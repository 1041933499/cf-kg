// 酷狗概念版自动签到 —— Cloudflare Workers 入口
// 基于 develop202/kgcheckin 移植：Express 服务 → 直连 fetch；Actions cron → Cron Trigger
import { runCheckin, beijingDate } from './checkin.js';
import { getUsers, upsertUser, getState, saveState } from './store.js';
import { statusPage, loginPage } from './pages.js';
import { qrKey, qrCheck } from './kugou/endpoints.js';
import { cryptoMd5, cryptoAesEncrypt, cryptoAesDecrypt, cryptoRSAEncrypt } from './kugou/crypto.js';

const QR_TTL = 120; // 二维码有效期（秒）

export default {
  /**
   * 定时签到 —— cron: 10 17 * * * (UTC) = 北京时间 01:10
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(env));
  },

  /**
   * HTTP 路由
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/':
          return html(await renderStatus(env));
        case '/login':
          return html(loginPage());
        case '/api/qr':
          if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);
          return handleQrGen(env);
        case '/api/qr/status':
          return handleQrStatus(request, env);
        case '/api/checkin':
          if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);
          return handleManualCheckin(request, env);
        case '/api/state':
          return json({ state: await getState(env.KG_KV) });
        case '/probe':
          return json(runProbe());
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (e) {
      console.error('unhandled error:', e);
      return json({ ok: false, error: String(e?.message || e) }, 500);
    }
  },
};

/* ─────────────── 定时任务 ─────────────── */

async function runScheduled(env) {
  const users = await getUsers(env.KG_KV);
  if (users.length === 0) {
    console.log('no accounts configured, skip');
    return;
  }
  const logs = [];
  const report = await runCheckin(users, (m) => {
    logs.push(m);
    console.log(m);
  });

  // token 刷新后写回 KV（替代原项目的 GitHub PAT 写 Secret）
  if (report.needRefresh) {
    await env.KG_KV.put('userinfo', JSON.stringify(report.refreshedUsers));
    logs.push('token 已刷新并写回存储');
  }

  await saveState(env.KG_KV, {
    date: report.date,
    results: report.results,
    summary: report.summary,
    logs,
    finishedAt: Date.now(),
    trigger: 'cron',
  });
}

/* ─────────────── 状态页 ─────────────── */

async function renderStatus(env) {
  const state = await getState(env.KG_KV);
  const users = await getUsers(env.KG_KV);
  return statusPage(state, users.length);
}

/* ─────────────── 扫码登录 ─────────────── */

async function handleQrGen(env) {
  try {
    const res = await qrKey();
    const key = res.body?.data?.qrcode;
    if (!key) {
      return json({ ok: false, error: `获取二维码失败: ${JSON.stringify(res.body)?.slice(0, 300)}` });
    }
    // 生成 SVG（服务端渲染，浏览器直接展示）
    const svg = await renderQrSvg(`https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=${key}`);
    // 存 2 分钟
    await env.KG_KV.put(`qr:${key}`, JSON.stringify({ created: Date.now() }), {
      expirationTtl: QR_TTL,
    });
    return json({ ok: true, key, svg });
  } catch (e) {
    return json({ ok: false, error: String(e?.body?.msg || e?.message || e) });
  }
}

async function handleQrStatus(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return json({ status: -1, error: 'missing key' });

  const rec = await env.KG_KV.get(`qr:${key}`);
  if (!rec) return json({ status: 0 }); // 过期或不存在

  try {
    const res = await qrCheck(key);
    const status = Number(res.body?.data?.status ?? 1);
    if (status === 4) {
      const userid = res.body?.data?.userid;
      const token = res.body?.data?.token;
      if (userid && token) {
        await upsertUser(env.KG_KV, { userid, token });
        await env.KG_KV.delete(`qr:${key}`); // 一次性
        return json({ status: 4 });
      }
      return json({ status: -1, error: '登录成功但缺少 token' });
    }
    return json({ status });
  } catch (e) {
    return json({ status: -1, error: String(e?.body?.msg || e?.message || e) });
  }
}

/** 二维码 SVG 渲染（动态 import qrcode 包，见 qr-render.js） */
async function renderQrSvg(text) {
  const { toSvg } = await import('./qr-render.js');
  return toSvg(text);
}

/* ─────────────── 手动签到（流式输出） ─────────────── */

async function handleManualCheckin(request, env) {
  const users = await getUsers(env.KG_KV);
  if (users.length === 0) {
    return json({ ok: false, error: '未配置账号，请先扫码登录' }, 400);
  }

  // 流式返回日志，保持连接（HTTP 请求无墙钟限制）
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const ctx2 = {
    async run() {
      try {
        const logs = [];
        const report = await runCheckin(users, (m) => {
          logs.push(m);
          writer.write(encoder.encode(m + '\n'));
        });
        if (report.needRefresh) {
          await env.KG_KV.put('userinfo', JSON.stringify(report.refreshedUsers));
          logs.push('token 已刷新并写回存储');
          writer.write(encoder.encode('token 已刷新并写回存储\n'));
        }
        const state = {
          date: report.date,
          results: report.results,
          summary: report.summary,
          logs,
          finishedAt: Date.now(),
          trigger: 'manual',
        };
        await saveState(env.KG_KV, state);
        writer.write(
          encoder.encode(
            `\n=== 完成：成功 ${report.summary.success} / 失败 ${report.summary.fail} ===\n`
          )
        );
      } catch (e) {
        writer.write(encoder.encode(`异常中止: ${e?.message || e}\n`));
      } finally {
        try {
          await writer.close();
        } catch {}
      }
    },
  };
  ctx2.run(); // 不 await，立即返回流

  return new Response(readable, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

/* ─────────────── crypto 探针 ─────────────── */

function runProbe() {
  const out = { ok: true, tests: {} };
  try {
    const h = cryptoMd5('1234567890');
    out.tests.md5 = h === 'e807f1fcf82d132f9bb018ca6738a19f' ? 'ok' : `fail: ${h}`;
    if (out.tests.md5 !== 'ok') out.ok = false;
  } catch (e) {
    out.tests.md5 = `error: ${e.message}`;
    out.ok = false;
  }
  try {
    const enc = cryptoAesEncrypt('hello kg', { key: 'c24f74ca2820225badc01946dba4fdf7', iv: 'adc01946dba4fdf7' });
    const dec = cryptoAesDecrypt(enc, 'c24f74ca2820225badc01946dba4fdf7', 'adc01946dba4fdf7');
    out.tests.aes = dec === 'hello kg' ? 'ok' : `fail: ${dec}`;
    if (out.tests.aes !== 'ok') out.ok = false;
  } catch (e) {
    out.tests.aes = `error: ${e.message}`;
    out.ok = false;
  }
  try {
    const pk = cryptoRSAEncrypt({ token: 'abc', clienttime: 1700000000 });
    out.tests.rsa = /^[0-9a-f]{256}$/.test(pk) ? 'ok' : `fail: len=${pk.length}`;
    if (out.tests.rsa !== 'ok') out.ok = false;
  } catch (e) {
    out.tests.rsa = `error: ${e.message}`;
    out.ok = false;
  }
  out.date = beijingDate();
  return out;
}

/* ─────────────── 工具 ─────────────── */

function html(body) {
  return new Response(body, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

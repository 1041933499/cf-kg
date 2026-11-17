// 签到主流程 —— 移植自 develop202/kgcheckin main.js
// 变更：GitHub Secret 写回 → KV 写回；通知渠道 → 状态页展示（本版不带通知）
import {
  userDetail,
  loginByToken,
  youthListenSong,
  youthVip,
  userVipDetail,
} from './kugou/endpoints.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** 北京时间日期字符串 yyyy-MM-dd */
export function beijingDate(d = new Date()) {
  const t = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const DD = String(t.getUTCDate()).padStart(2, '0');
  const MM = String(t.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = t.getUTCFullYear();
  return `${yyyy}-${MM}-${DD}`;
}

/** 匟名显示名（与源 safeLog 一致） */
function maskDisplayName(name) {
  const s = String(name ?? '');
  if (s.length === 0) return '';
  if (s.length === 1) return `${s[0]}********`;
  if (s.length === 2) return `${s[0]}********${s[1]}`;
  return `${s.slice(0, 3)}***${s.slice(-2)}`;
}

/** userid 脱敏 */
function maskIdentifier(value) {
  const s = String(value ?? '');
  if (s.length <= 2) return '*'.repeat(s.length);
  if (s.length <= 6) return `${s[0]}***${s[s.length - 1]}`;
  return `${s.slice(0, 3)}***${s.slice(-2)}`;
}

/** 响应摘要（不含敏感字段） */
function summarizeResponse(resp) {
  const b = resp?.body ?? resp;
  if (!b || typeof b !== 'object') return { raw: String(b).slice(0, 200) };
  return {
    status: b.status,
    error_code: b.error_code,
    code: b.code,
    msg: b.msg || b.message || b.error,
  };
}

/**
 * 执行单账号签到
 * @param {{userid: string, token: string}} user
 * @param {boolean} isSunday 是否周日（刷新 token）
 * @returns {Promise<{result: object, user: object, needRefresh: boolean}>}
 */
async function checkinOne(user, isSunday) {
  const safeUserId = maskIdentifier(user.userid);
  /** @type {any[]} */
  const logs = [];
  const log = (level, msg) => logs.push({ level, msg, t: Date.now() });

  // 1. 验证 token
  let userDetailRes;
  try {
    userDetailRes = await userDetail(user);
  } catch (e) {
    log('error', `token 验证请求失败: ${e?.body?.msg || e?.message || e}`);
    return {
      result: {
        nickname: safeUserId,
        status: '失败',
        listen: '未知',
        vipClaim: '0/0',
        vipExpiry: '未知',
        error: 'token 验证请求失败',
        logs,
      },
      user,
      needRefresh: false,
    };
  }
  if (userDetailRes?.body?.data?.nickname == null) {
    log('error', `token 过期或账号不存在, userid: ${safeUserId}`);
    return {
      result: {
        nickname: safeUserId,
        status: '失败',
        listen: '账号不存在',
        vipClaim: '0/8',
        vipExpiry: '未知',
        error: 'token过期或账号不存在',
        logs,
      },
      user,
      needRefresh: false,
    };
  }

  const safeNickname = maskDisplayName(userDetailRes.body.data.nickname);
  log('info', `账号 ${safeNickname} 开始领取VIP...`);

  let needRefresh = false;
  // 2. 周日刷新 token
  if (isSunday) {
    try {
      const refreshToken = await loginByToken(user);
      if (refreshToken?.body?.status == 1) {
        if (refreshToken?.body?.data?.token !== user.token) {
          needRefresh = true;
          log('warn', `账号 ${safeNickname} 需要刷新token`);
          user = { ...user, token: refreshToken.body.data.token };
        }
      }
    } catch (e) {
      log('warn', `token 刷新失败（不影响本次签到）: ${e?.body?.msg || e?.message || e}`);
    }
  }

  // 3. 听歌领取
  log('info', '开始听歌领取VIP...');
  let listenStatus = '未知';
  try {
    const listen = await youthListenSong(user);
    if (listen.body.status === 1) {
      log('success', '听歌领取成功');
      listenStatus = '成功';
    } else if (listen.body.error_code === 130012) {
      log('success', '今日已领取');
      listenStatus = '今日已领取';
    } else {
      log('error', `听歌领取失败: ${JSON.stringify(summarizeResponse(listen))}`);
      listenStatus = '失败';
    }
  } catch (e) {
    // 源实现：请求异常（含业务 502）走 errorMsg
    if (e?.body?.error_code === 130012) {
      log('success', '今日已领取');
      listenStatus = '今日已领取';
    } else {
      log('error', `听歌领取异常: ${JSON.stringify(e?.body || e?.message || e)}`);
      listenStatus = '失败';
    }
  }

  // 4. 广告领取（最多 8 次，间隔 30s；30002 = 今日次数用光）
  log('info', '开始领取VIP(广告)...');
  let claimCount = 0;
  let claimTotal = 0;
  let adFailed = false;
  for (let i = 1; i <= 8; i++) {
    try {
      const ad = await youthVip(user);
      claimTotal = i;
      if (ad.body.status === 1) {
        log('success', `第${i}次领取成功`);
        claimCount++;
        if (i !== 8) await delay(30 * 1000);
      } else if (ad.body.error_code === 30002) {
        log('info', '今天次数已用光');
        break;
      } else {
        log('error', `第${i}次领取失败: ${JSON.stringify(summarizeResponse(ad))}`);
        adFailed = true;
        break;
      }
    } catch (e) {
      if (e?.body?.error_code === 30002) {
        log('info', '今天次数已用光');
        break;
      }
      log('error', `第${i}次领取异常: ${JSON.stringify(e?.body || e?.message || e)}`);
      adFailed = true;
      break;
    }
  }

  // 5. 查询 VIP 到期时间
  let vipExpiry = '未知';
  let vipDetailFailed = false;
  try {
    const vip_details = await userVipDetail(user);
    if (
      vip_details.body.status === 1 &&
      Array.isArray(vip_details.body.data?.busi_vip) &&
      vip_details.body.data.busi_vip.length > 0
    ) {
      vipExpiry = vip_details.body.data.busi_vip[0].vip_end_time;
      log('info', `VIP到期时间：${vipExpiry}`);
    } else {
      log('error', '获取VIP详情失败');
      vipDetailFailed = true;
    }
  } catch (e) {
    log('error', `获取VIP详情异常: ${JSON.stringify(e?.body || e?.message || e)}`);
    vipDetailFailed = true;
  }

  const hasError = listenStatus === '失败' || adFailed || vipDetailFailed;
  return {
    result: {
      nickname: safeNickname,
      status: hasError ? (claimCount > 0 || listenStatus === '成功' ? '部分失败' : '失败') : '成功',
      listen: listenStatus,
      vipClaim: `${claimCount}/${claimTotal}`,
      vipExpiry,
      error: hasError ? '详见日志' : '',
      logs,
    },
    user,
    needRefresh,
  };
}

/**
 * 执行全部账号签到（账号间并行，控制并发 ≤3 以满足免费计划 50 子请求/次上限）
 * @param {Array<{userid: string, token: string}>} users
 * @param {(msg: string) => void} [onLog]
 */
export async function runCheckin(users, onLog = () => {}) {
  const now = new Date();
  const today = beijingDate(now);
  // 与源实现一致：把时间拨到北京时间后再取星期几（cron UTC 17:10 = 北京次日 01:10）
  const beijingNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const isSunday = beijingNow.getUTCDay() === 0;
  onLog(`日期: ${today}（北京时间）${isSunday ? '，周日将刷新 token' : ''}`);
  onLog(`账号数: ${users.length}`);

  const results = [];
  const refreshedUsers = [...users];
  let anyRefresh = false;

  // 并发3路
  const CONCURRENCY = 3;
  let index = 0;
  async function worker() {
    while (index < users.length) {
      const i = index++;
      const user = users[i];
      try {
        const r = await checkinOne(user, isSunday);
        results[i] = r.result;
        if (r.needRefresh) {
          anyRefresh = true;
          refreshedUsers[i] = r.user;
        } else {
          refreshedUsers[i] = r.user;
        }
        onLog(
          `[${r.result.status}] ${r.result.nickname} 听歌:${r.result.listen} 广告:${r.result.vipClaim} 到期:${r.result.vipExpiry}`
        );
      } catch (e) {
        const safeId = maskIdentifier(user.userid);
        results[i] = {
          nickname: safeId,
          status: '失败',
          listen: '异常',
          vipClaim: '0/8',
          vipExpiry: '未知',
          error: String(e?.message || e),
          logs: [{ level: 'error', msg: String(e?.message || e), t: Date.now() }],
        };
        onLog(`[失败] ${safeId} 处理异常: ${e?.message || e}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, users.length) }, worker));

  const successCount = results.filter((r) => r.status === '成功').length;
  const failCount = results.length - successCount;
  onLog(`完成: 成功 ${successCount} / 失败 ${failCount}`);

  return {
    date: today,
    results,
    needRefresh: anyRefresh,
    refreshedUsers,
    summary: {
      total: results.length,
      success: successCount,
      fail: failCount,
    },
  };
}

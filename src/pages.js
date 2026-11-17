// HTML 页面 —— 状态页 + 扫码登录页
export function statusPage(state, accounts) {
  const accountCount = accounts.length;
  const rows = (state?.results || [])
    .map((r) => {
      const statusColor =
        r.status === '成功' ? '#3fb950' : r.status === '部分失败' ? '#d29922' : '#f85149';
      return `<tr>
        <td>${escapeHtml(r.nickname)}</td>
        <td style="color:${statusColor}">${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.listen)}</td>
        <td>${escapeHtml(r.vipClaim)}</td>
        <td>${escapeHtml(r.vipExpiry)}</td>
      </tr>`;
    })
    .join('');

  const noAccounts = accountCount === 0;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>酷狗概念版自动签到</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;padding:20px}
.container{max-width:860px;margin:0 auto}
h1{color:#58a6ff;font-size:22px;margin-bottom:6px}
.sub{color:#8b949e;font-size:13px;margin-bottom:20px}
.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;margin-bottom:16px}
.card h2{font-size:15px;color:#e6edf3;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #21262d}
th{color:#8b949e;font-weight:600}
.meta{display:flex;gap:24px;flex-wrap:wrap;color:#8b949e;font-size:13px;margin-bottom:12px}
.meta b{color:#e6edf3}
button{background:#238636;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:14px;cursor:pointer;font-weight:600}
button:hover{background:#2ea043}
button:disabled{background:#21262d;color:#484f58;cursor:not-allowed}
button.secondary{background:#21262d;color:#c9d1d9}
button.secondary:hover{background:#30363d}
button.danger{background:#21262d;color:#f85149;border:1px solid #f8514933;padding:5px 14px;font-size:13px}
button.danger:hover{background:#f85149;color:#fff;border-color:#f85149}
button.danger:disabled{background:#21262d;color:#484f58;border-color:#30363d;cursor:not-allowed}
tr.removing{opacity:.4}
input{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:9px 12px;color:#e6edf3;font-size:14px;width:220px}
input:focus{outline:none;border-color:#58a6ff}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.notice{background:#1f6feb22;border:1px solid #1f6feb66;border-radius:8px;padding:12px 14px;font-size:13px;color:#a5d6ff;margin-bottom:16px}
.warn{background:#d2992222;border-color:#d2992266;color:#e3b341}
#log{background:#010409;border:1px solid #30363d;border-radius:8px;padding:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;height:260px;overflow-y:auto;white-space:pre-wrap;color:#c9d1d9;display:none}
.footer{color:#484f58;font-size:12px;text-align:center;margin-top:24px}
</style>
</head>
<body>
<div class="container">
  <h1>🎵 酷狗概念版自动签到</h1>
  <p class="sub">每天北京时间 01:10 自动领取 VIP（基于 kgcheckin 移植至 Cloudflare Workers）</p>

  ${noAccounts ? `<div class="notice warn">尚未配置账号，请先<a href="/login" style="color:#58a6ff">扫码登录</a>。</div>` : ''}

  <div class="card">
    <h2>最近一次签到</h2>
    ${
      state
        ? `<div class="meta">
             <span>日期: <b>${escapeHtml(state.date)}</b></span>
             <span>成功: <b style="color:#3fb950">${state.summary?.success ?? 0}</b></span>
             <span>失败: <b style="color:#f85149">${state.summary?.fail ?? 0}</b></span>
             <span>账号数: <b>${state.summary?.total ?? 0}</b></span>
           </div>
           <table>
             <tr><th>账号</th><th>状态</th><th>听歌领取</th><th>广告领取</th><th>VIP到期</th></tr>
             ${rows}
           </table>`
        : `<p style="color:#8b949e;font-size:13px">暂无记录，等待首次定时执行或手动触发。</p>`
    }
  </div>

  <div class="card">
    <h2>账号管理 <span style="color:#8b949e;font-weight:400;font-size:13px">共 ${accountCount} 个</span></h2>
    ${
      accountCount === 0
        ? `<p style="color:#8b949e;font-size:13px">暂无账号，<a href="/login" style="color:#58a6ff">扫码登录</a>添加。</p>`
        : `<table id="acctTable">
             <tr><th>昵称</th><th>VIP到期</th><th>上次状态</th><th>添加时间</th><th style="text-align:right">操作</th></tr>
             ${accounts
               .map(
                 (a) => `<tr data-id="${escapeHtml(a.id)}">
                   <td>${escapeHtml(a.nickname)}</td>
                   <td>${escapeHtml(a.vipExpiry || '—')}</td>
                   <td>${escapeHtml(a.lastStatus || '—')}</td>
                   <td>${a.addedAt ? escapeHtml(formatTime(a.addedAt)) : '—'}</td>
                   <td style="text-align:right">
                     <button class="danger" data-del="${escapeHtml(a.id)}" data-name="${escapeHtml(a.nickname)}">删除</button>
                   </td>
                 </tr>`
               )
               .join('')}
           </table>
           <p style="color:#484f58;font-size:12px;margin-top:10px">删除后需重新扫码登录才能继续签到；token 会立即从存储中移除。</p>`
    }
  </div>

  <div class="card">
    <h2>操作</h2>
    <div class="row" style="margin-bottom:12px">
      <button id="runBtn" ${noAccounts ? 'disabled' : ''}>立即签到</button>
      <a href="/login"><button class="secondary">扫码登录 / 添加账号</button></a>
      <button class="secondary" id="refreshBtn">刷新状态</button>
    </div>
    <div id="log"></div>
  </div>

  <p class="footer">kgcheckin-cloudflare · 仅供个人学习使用</p>
</div>
<script>
const logEl = document.getElementById('log');
function appendLog(text) {
  logEl.style.display = 'block';
  logEl.textContent += text + '\\n';
  logEl.scrollTop = logEl.scrollHeight;
}
document.getElementById('refreshBtn').onclick = () => location.reload();

// 账号删除
document.querySelectorAll('[data-del]').forEach(function(btn) {
  btn.onclick = async function() {
    const id = this.dataset.del;
    const name = this.dataset.name || '该账号';
    if (!confirm('确认删除账号「' + name + '」？\\n删除后 token 立即从存储移除，需重新扫码登录。')) return;
    this.disabled = true;
    this.textContent = '删除中...';
    const tr = this.closest('tr');
    try {
      const resp = await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: id })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || '删除失败');
      tr.classList.add('removing');
      const remaining = typeof data.remaining === 'number' ? data.remaining : null;
      if (remaining === 0) {
        location.reload();
        return;
      }
      tr.remove();
      const cnt = document.querySelector('#acctTable') ? document.querySelectorAll('#acctTable tr[data-id]').length : 0;
      const head = document.querySelector('.card h2 span');
      if (head && cnt) head.textContent = '共 ' + cnt + ' 个';
      if (cnt === 0) location.reload();
    } catch (e) {
      this.disabled = false;
      this.textContent = '删除';
      alert('删除失败: ' + e.message);
    }
  };
});
document.getElementById('runBtn').onclick = async function() {
  this.disabled = true;
  logEl.style.display = 'block';
  logEl.textContent = '';
  appendLog('触发签到，等待响应（多账号约需 1-4 分钟）...');
  try {
    const resp = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}'
    });
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      appendLog(decoder.decode(value, { stream: true }));
    }
    appendLog('--- 完成，3 秒后刷新状态 ---');
    setTimeout(() => location.reload(), 3000);
  } catch (e) {
    appendLog('请求失败: ' + e.message);
    this.disabled = false;
  }
};
</script>
</body>
</html>`;
}

export function loginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>扫码登录 - 酷狗概念版签到</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;padding:20px;display:flex;justify-content:center}
.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:28px;max-width:420px;width:100%;margin-top:40px;text-align:center}
h1{color:#58a6ff;font-size:20px;margin-bottom:8px}
p{color:#8b949e;font-size:13px;margin-bottom:16px}
.qrbox{background:#fff;border-radius:12px;padding:16px;display:inline-block;min-height:220px;min-width:220px;display:flex;align-items:center;justify-content:center}
.qrbox img{width:200px;height:200px;display:block}
.qrbox .placeholder{color:#555;font-size:13px}
.status{margin-top:14px;font-size:14px;font-weight:600;min-height:20px}
.ok{color:#3fb950}.err{color:#f85149}.muted{color:#8b949e}
button{background:#238636;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;cursor:pointer;font-weight:600;margin-top:14px}
button:hover{background:#2ea043}
a{color:#58a6ff;font-size:13px}
</style>
</head>
<body>
<div class="card">
  <h1>📱 扫码登录</h1>
  <p>使用「酷狗音乐 APP」扫描二维码<br/>二维码有效期约 2 分钟</p>
  <div class="qrbox" id="qrbox"><span class="placeholder">正在生成二维码...</span></div>
  <div class="status muted" id="status"></div>
  <div><button id="genBtn">重新生成</button></div>
  <p style="margin-top:18px"><a href="/">← 返回状态页</a></p>
</div>
<script>
let polling = null;
let currentKey = '';
const statusEl = document.getElementById('status');
const qrbox = document.getElementById('qrbox');

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = 'status ' + (cls || 'muted');
}

// 极简二维码渲染：调用后端返回的 SVG
async function gen() {
  if (polling) clearInterval(polling);
  currentKey = '';
  qrbox.innerHTML = '<span class="placeholder">生成中...</span>';
  setStatus('正在向酷狗申请二维码...', 'muted');
  try {
    const resp = await fetch('/api/qr', { method: 'POST' });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || '生成失败');
    currentKey = data.key;
    qrbox.innerHTML = data.svg;
    setStatus('请用酷狗音乐 APP 扫码', 'muted');
    poll();
  } catch (e) {
    qrbox.innerHTML = '<span class="placeholder">生成失败</span>';
    setStatus('二维码生成失败: ' + e.message, 'err');
  }
}

async function poll() {
  let elapsed = 0;
  polling = setInterval(async () => {
    elapsed += 2;
    if (!currentKey) return;
    try {
      const resp = await fetch('/api/qr/status?key=' + encodeURIComponent(currentKey));
      const data = await resp.json();
      if (data.status === 4) {
        clearInterval(polling);
        setStatus('✅ 登录成功！账号已保存，3 秒后返回...', 'ok');
        setTimeout(() => location.href = '/', 3000);
      } else if (data.status === 0) {
        clearInterval(polling);
        setStatus('❌ 二维码已过期，请点击重新生成', 'err');
      } else if (data.status === 2) {
        setStatus('已扫码，请在手机上点击确认...', 'muted');
      } else {
        setStatus('等待扫码... (' + elapsed + 's)', 'muted');
      }
      if (elapsed > 115) {
        clearInterval(polling);
        setStatus('❌ 二维码已过期，请点击重新生成', 'err');
      }
    } catch (e) {
      setStatus('轮询失败，重试中...', 'err');
    }
  }, 2000);
}

document.getElementById('genBtn').onclick = gen;
gen();
</script>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(ts) {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return '—';
  }
}

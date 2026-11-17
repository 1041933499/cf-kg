// KV 存储层
const KEY_USERINFO = 'userinfo';
const KEY_STATE = 'state';

/** 读取账号列表 */
export async function getUsers(kv) {
  const raw = await kv.get(KEY_USERINFO);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** 写入账号列表 */
export async function saveUsers(kv, users) {
  await kv.put(KEY_USERINFO, JSON.stringify(users));
}

/** upsert 账号（按 userid 去重） */
export async function upsertUser(kv, { userid, token, nickname }) {
  const users = await getUsers(kv);
  const idx = users.findIndex((u) => String(u.userid) === String(userid));
  if (idx >= 0) {
    // 已存在：更新 token；仅在拿到新昵称时覆盖，避免登录接口异常把昵称清空
    users[idx] = { ...users[idx], token, ...(nickname ? { nickname } : {}) };
  } else {
    users.push({
      userid: String(userid),
      token,
      nickname: nickname || '',
      addedAt: Date.now(),
    });
  }
  await saveUsers(kv, users);
  return users;
}

/** 删除账号（按 userid），返回是否删到了东西 */
export async function removeUser(kv, userid) {
  const users = await getUsers(kv);
  const next = users.filter((u) => String(u.userid) !== String(userid));
  if (next.length === users.length) return false;
  await saveUsers(kv, next);
  return true;
}

/** 读取最近一次签到状态 */
export async function getState(kv) {
  const raw = await kv.get(KEY_STATE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 写入签到状态 */
export async function saveState(kv, state) {
  await kv.put(KEY_STATE, JSON.stringify(state));
}

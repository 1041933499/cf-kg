// 酷狗接口封装 —— 对应 develop202/kgcheckin api/module/ 中被签到/登录流程引用的模块
import { createRequest } from './request.js';
import { cryptoRSAEncrypt, cryptoAesEncrypt, cryptoAesDecrypt, randomString } from './crypto.js';
import { CONFIG, LOGIN_TOKEN_AES, LOGIN_BY_TOKEN_PATH } from './config.js';

/** 统一构造 cookie 头 */
function cookieHeader(user) {
  return { cookie: `token=${user.token}; userid=${user.userid}` };
}

function cookieObj(user) {
  return { token: user.token, userid: user.userid };
}

/**
 * 验证 token / 获取用户详情 —— api/module/user_detail.js
 * POST /v3/get_my_info  (x-router: usercenter.kugou.com)
 */
export async function userDetail(user) {
  const clienttime_ms = Math.floor(Date.now() / 1000);
  const pk = cryptoRSAEncrypt({
    token: user.token,
    clienttime: clienttime_ms,
  }).toUpperCase();
  return createRequest({
    url: '/v3/get_my_info',
    method: 'POST',
    data: { visit_time: clienttime_ms, usertype: 1, p: pk, userid: Number(user.userid) },
    params: { plat: 1 },
    encryptType: 'android',
    cookie: cookieObj(user),
    headers: { 'x-router': 'usercenter.kugou.com' },
  });
}

/**
 * 刷新 token —— api/module/login_token.js（默认 /v5，lite 走 /v4）
 */
export async function loginByToken(user) {
  const dateNow = Date.now();
  const encrypt = cryptoAesEncrypt(
    { clienttime: Math.floor(dateNow / 1000), token: user.token },
    { key: LOGIN_TOKEN_AES.key, iv: LOGIN_TOKEN_AES.iv }
  );
  const encryptParams = cryptoAesEncrypt({});
  const pk = cryptoRSAEncrypt({ clienttime_ms: dateNow, key: encryptParams.key });

  const dataMap = {
    dfid: '-',
    p3: encrypt,
    plat: 1,
    t1: 0,
    t2: 0,
    t3: 'MCwwLDAsMCwwLDAsMCwwLDA=',
    pk,
    params: encryptParams.str,
    userid: user.userid,
    clienttime_ms: dateNow,
  };

  const res = await createRequest({
    baseURL: 'http://login.user.kugou.com',
    url: LOGIN_BY_TOKEN_PATH,
    method: 'POST',
    data: dataMap,
    cookie: cookieObj(user),
    encryptType: 'android',
    headers: { 'x-router': 'login.user.kugou.com' },
  });

  const body = res.body;
  if (body?.status && body.status === 1) {
    if (body?.data?.secu_params) {
      const getToken = cryptoAesDecrypt(body.data.secu_params, encryptParams.key);
      if (typeof getToken === 'object') {
        res.body.data = { ...body.data, ...getToken };
      } else {
        res.body.data['token'] = getToken;
      }
    }
    res.cookie.push(`token=${res.body.data['token']}`);
    res.cookie.push(`userid=${res.body.data?.userid || 0}`);
  }
  return res;
}

/**
 * 听歌领取 VIP —— api/module/youth_listen_song.js
 * POST /youth/v2/report/listen_song
 */
export function youthListenSong(user) {
  return createRequest({
    url: '/youth/v2/report/listen_song',
    method: 'POST',
    data: { mixsongid: 666075191 },
    params: { clientver: 10566 },
    encryptType: 'android',
    cookie: cookieObj(user),
    headers: {
      'user-agent':
        'Android13-1070-10566-201-0-ReportPlaySongToServerProtocol-wifi',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * 广告领取 VIP —— api/module/youth_vip.js
 * POST /youth/v1/ad/play_report
 */
export function youthVip(user) {
  const time = Date.now();
  return createRequest({
    url: '/youth/v1/ad/play_report',
    method: 'POST',
    data: { ad_id: 12307537187, play_end: time, play_start: time - 30000 },
    encryptType: 'android',
    cookie: cookieObj(user),
  });
}

/**
 * VIP 到期查询 —— api/module/user_vip_detail.js
 * GET /v1/get_union_vip (kugouvip.kugou.com)
 */
export function userVipDetail(user) {
  return createRequest({
    baseURL: 'https://kugouvip.kugou.com',
    url: '/v1/get_union_vip',
    method: 'GET',
    params: { busi_type: 'concept' },
    encryptType: 'android',
    cookie: cookieObj(user),
  });
}

/**
 * 生成二维码 key —— api/module/login_qr_key.js
 * GET /v2/qrcode (login-user.kugou.com)
 */
export function qrKey() {
  return createRequest({
    baseURL: 'https://login-user.kugou.com',
    url: '/v2/qrcode',
    method: 'GET',
    params: {
      appid: 1001,
      type: 1,
      plat: 4,
      qrcode_txt: `https://h5.kugou.com/apps/loginQRCode/html/index.html?appid=${CONFIG.appid}&`,
      srcappid: CONFIG.srcappid,
    },
    encryptType: 'web',
    cookie: {},
  });
}

/**
 * 轮询二维码状态 —— api/module/login_qr_check.js
 * status: 0 过期 / 1 未扫 / 2 待确认 / 4 成功（返回 token）
 */
export function qrCheck(key) {
  return createRequest({
    baseURL: 'https://login-user.kugou.com',
    url: '/v2/get_userinfo_qrcode',
    method: 'GET',
    params: { plat: 4, appid: CONFIG.appid, srcappid: CONFIG.srcappid, qrcode: key },
    encryptType: 'web',
    cookie: {},
  });
}

export { cookieHeader };

// 签名算法 —— 移植自 develop202/kgcheckin api/util/helper.js（platform=lite 分支）
import { cryptoMd5 } from './crypto.js';
import {
  ANDROID_SIGN_SALT,
  WEB_SIGN_SALT,
  SIGN_KEY_SALT,
  CONFIG,
} from './config.js';

/**
 * web 版 signature
 * @param {Record<string, any>} params
 */
export function signatureWebParams(params) {
  const paramsString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .sort()
    .join('');
  return cryptoMd5(`${WEB_SIGN_SALT}${paramsString}${WEB_SIGN_SALT}`);
}

/**
 * Android 版 signature（lite 盐）
 * @param {Record<string, any>} params
 * @param {string} [data]
 */
export function signatureAndroidParams(params, data) {
  const paramsString = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${key}=${typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]}`
    )
    .join('');
  return cryptoMd5(`${ANDROID_SIGN_SALT}${paramsString}${data || ''}${ANDROID_SIGN_SALT}`);
}

/**
 * signKey
 */
export function signKey(hash, mid, userid, appid) {
  return cryptoMd5(
    `${hash}${SIGN_KEY_SALT}${appid || CONFIG.appid}${mid}${userid || 0}`
  );
}

/**
 * signParamsKey
 */
export function signParamsKey(data, appid, clientver) {
  appid = appid || CONFIG.appid;
  clientver = clientver || CONFIG.clientver;
  return cryptoMd5(`${appid}${ANDROID_SIGN_SALT}${clientver}${data}`);
}

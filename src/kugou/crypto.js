// 加密工具 —— 移植自 develop202/kgcheckin api/util/crypto.js
// Workers 上通过 nodejs_compat 提供的 node:crypto 实现（探针 /probe 验证可用性）
import { createHash, createCipheriv, createDecipheriv, publicEncrypt, constants } from 'node:crypto';
import { PUBLIC_RSA_KEY } from './config.js';

/** 随机字符串（与源实现一致的字符集） */
export function randomString(len = 16) {
  const keyString = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += keyString[Math.ceil((keyString.length - 1) * Math.random())];
  }
  return out;
}

/**
 * MD5
 * @param {string | object} data
 * @returns {string}
 */
export function cryptoMd5(data) {
  const input = typeof data === 'object' ? JSON.stringify(data) : data;
  return createHash('md5').update(input).digest('hex');
}

/**
 * AES-256-CBC 加密
 * @param {string | object} data
 * @param {{key?: string, iv?: string} | undefined} opt
 * @returns {{str: string, key: string} | string}
 */
export function cryptoAesEncrypt(data, opt) {
  if (typeof data === 'object') data = JSON.stringify(data);
  const buffer = Buffer.from(data, 'utf8');
  let key, iv, tempKey = '';
  if (opt?.key && opt?.iv) {
    key = opt.key;
    iv = opt.iv;
  } else {
    tempKey = opt?.key || randomString(16).toLowerCase();
    key = cryptoMd5(tempKey).substring(0, 32);
    iv = key.substring(key.length - 16, key.length);
  }
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const dest = Buffer.concat([cipher.update(buffer), cipher.final()]);
  if (opt?.key && opt?.iv) return dest.toString('hex');
  return { str: dest.toString('hex'), key: tempKey };
}

/**
 * AES-256-CBC 解密
 * @param {string} data hex
 * @param {string} key
 * @param {string} [iv]
 * @returns {string | object}
 */
export function cryptoAesDecrypt(data, key, iv) {
  if (!iv) key = cryptoMd5(key).substring(0, 32);
  iv = iv || key.substring(key.length - 16, key.length);
  const cipher = createDecipheriv('aes-256-cbc', key, iv);
  const dest = Buffer.concat([cipher.update(Buffer.from(data, 'hex')), cipher.final()]);
  try {
    return JSON.parse(dest.toString('utf8'));
  } catch (e) {
    return dest.toString('utf8');
  }
}

/**
 * RSA 加密（NO_PADDING，128 字节对齐）—— 用于 /user/detail、/login/token
 * @param {string | object} data
 * @param {string} [publicKey] PEM
 * @returns {string} hex
 */
export function cryptoRSAEncrypt(data, publicKey) {
  if (typeof data === 'object') data = JSON.stringify(data);
  const buffer = Buffer.from(data, 'utf8');
  const _buffer = Buffer.concat([buffer, Buffer.alloc(128 - buffer.length)]);
  return publicEncrypt(
    { key: publicKey || PUBLIC_RSA_KEY, padding: constants.RSA_NO_PADDING },
    _buffer
  ).toString('hex');
}

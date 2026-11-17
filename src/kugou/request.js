// HTTP 请求层 —— 移植自 develop202/kgcheckin api/util/request.js
// axios → fetch 重写；保留签名、默认参数、错误语义（status 502 + body）
import { cryptoMd5 } from './crypto.js';
import {
  signatureAndroidParams,
  signatureWebParams,
} from './helper.js';
import { CONFIG, GATEWAY, DEFAULT_UA } from './config.js';

/**
 * @typedef {{
 *   status: number;
 *   body: any;
 *   cookie: string[];
 *   headers?: Record<string, string>;
 * }} KgResponse
 */

/**
 * @param {Object} options
 * @param {'GET'|'POST'} options.method
 * @param {string} options.url
 * @param {string} [options.baseURL]
 * @param {Record<string, any>} [options.params]
 * @param {any} [options.data]
 * @param {Record<string, string|number>} [options.headers]
 * @param {'android'|'web'|'register'} [options.encryptType]
 * @param {Record<string, any>} [options.cookie]
 * @param {boolean} [options.notSignature]
 * @returns {Promise<KgResponse>}
 */
export function createRequest(options) {
  return (async () => {
    const dfid = options?.cookie?.dfid || '-';
    const mid = `${cryptoMd5(dfid)}${cryptoMd5(dfid).slice(0, 7)}`;
    const uuid = cryptoMd5(`${dfid}${mid}`);
    const token = options?.cookie?.token || '';
    const userid = options?.cookie?.userid || 0;
    const clienttime = Math.floor(Date.now() / 1000);
    const ip = options?.realIP || options?.ip || '';

    const defaultParams = {
      dfid,
      mid,
      uuid,
      appid: CONFIG.appid,
      clientver: CONFIG.clientver,
      userid,
      clienttime,
    };
    if (token) defaultParams['token'] = token;

    const params = options?.clearDefaultParams
      ? options?.params || {}
      : Object.assign({}, defaultParams, options?.params || {});

    const headers = { dfid, clienttime: params.clienttime, mid };
    if (ip) {
      headers['X-Real-IP'] = ip;
      headers['X-Forwarded-For'] = ip;
    }

    const data =
      typeof options?.data === 'object' ? JSON.stringify(options?.data) : options?.data || '';

    if (!params['signature'] && !options.notSignature) {
      switch (options?.encryptType) {
        case 'web':
          params['signature'] = signatureWebParams(params);
          break;
        case 'android':
        default:
          params['signature'] = signatureAndroidParams(params, data);
          break;
      }
    }

    const baseURL = options?.baseURL || GATEWAY;
    const reqHeaders = Object.assign(
      { 'User-Agent': DEFAULT_UA },
      options?.headers || {},
      headers,
      { clienttime: params.clienttime }
    );

    // openapicdn 类接口：参数拼进 URL（与源实现一致）
    let finalUrl = `${baseURL}${options.url}`;
    let searchParams;
    if (baseURL.includes('openapicdn')) {
      searchParams = '';
      finalUrl += `?${Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join('&')}`;
    } else {
      const sp = new URLSearchParams();
      for (const key of Object.keys(params)) {
        sp.append(key, String(params[key]));
      }
      searchParams = sp.toString();
      if (searchParams) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams;
      }
    }

    /** @type {KgResponse} */
    const answer = { status: 500, body: {}, cookie: [], headers: {} };
    try {
      const init = {
        method: options.method,
        headers: reqHeaders,
      };
      if (options.data !== undefined && options.method === 'POST') {
        if (typeof options.data === 'object') {
          init.body = JSON.stringify(options.data);
          // 与 axios 对象 body 的默认行为一致
          if (!reqHeaders['content-type'] && !reqHeaders['Content-Type']) {
            reqHeaders['content-type'] = 'application/json;charset=utf-8';
          }
        } else {
          init.body = options.data;
        }
      }
      const response = await fetch(finalUrl, init);

      const text = await response.text();
      // set-cookie 在 Workers 中用 getSetCookie()
      const setCookies =
        typeof response.headers.getSetCookie === 'function'
          ? response.headers.getSetCookie()
          : [];
      answer.cookie = setCookies.map((x) => parseCookieString(x));

      if (response.headers.get('ssa-code')) {
        answer.headers['ssa-code'] = response.headers.get('ssa-code');
      }

      try {
        answer.body = JSON.parse(text);
      } catch (error) {
        answer.body = text;
      }

      const body = answer.body;
      if (body?.status === 0 || (body?.error_code && body.error_code !== 0)) {
        answer.status = 502;
        throw answer;
      }
      answer.status = 200;
      return answer;
    } catch (e) {
      if (e && e.status === 502 && e.body !== undefined) throw e; // 业务错误原样抛出
      const responseBody = e?.body;
      const responseSummary =
        responseBody && typeof responseBody === 'object'
          ? {
              status: responseBody.status,
              code: responseBody.code,
              error_code: responseBody.error_code,
              errcode: responseBody.errcode,
              msg: responseBody.msg || responseBody.message || responseBody.error,
            }
          : {};
      const err = { status: 502, body: {}, cookie: [], headers: {} };
      err.body = {
        status: 0,
        msg: responseSummary.msg || e?.message || 'request failed',
        code: e?.code,
        httpStatus: e?.response?.status,
        ...responseSummary,
      };
      throw err;
    }
  })();
}

/** 与源实现一致：剥离 Domain/path/expires/HttpOnly 属性 */
function parseCookieString(cookie) {
  const t = cookie.replace(/\s*(Domain|domain|path|expires)=[^(;|$)]+;*/g, '');
  return t.replace(/;HttpOnly/g, '');
}

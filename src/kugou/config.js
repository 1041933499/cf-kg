// 酷狗平台配置 —— 提取自 develop202/kgcheckin
//
// ⚠ 重要结论：原仓库的 .env 未提交、两个 workflow 也均未设置 `platform`，
//   即原项目实际以 **默认（非 lite）参数** 运行并通过验证：
//     appid 1005 / clientver 20489 / android 盐 OIlwieks... / 非 lite RSA 公钥 /
//     login_token AES key 90b8382a... / `/v5/login_by_token`
//   `/youth/*`（概念版领 VIP）接口在默认参数下即可用。
//   此处与原项目保持一致（IS_LITE = false）；若需切换概念版参数，
//   将 IS_LITE 置为 true 即可（lite 参数同样取自原仓库源码分支）。

const LITE = {
  isLite: true,
  appid: 3116, // liteAppid
  clientver: 11436, // liteClientver
  androidSignSalt: 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA',
  signKeySalt: '185672dd44712f60bb1736df5a377e82',
  // publicLiteRasKey
  publicRsaB64:
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDECi0Np2UR87scwrvTr72L6oO01rBbbBPriSDFPxr3Z5syug0O24QyQO8bg27+0+4kBzTBTBOZ/WWU0WryL1JSXRTXLgFVxtzIY41Pe7lPOgsfTCn5kZcvKhYKJesKnnJDNr5/abvTGf+rHG3YRwsCHcQ08/q6ifSioBszvb3QiwIDAQAB',
  loginTokenAes: { key: 'c24f74ca2820225badc01946dba4fdf7', iv: 'adc01946dba4fdf7' },
  loginByTokenPath: '/v4/login_by_token',
};

const DEFAULT_PLATFORM = {
  isLite: false,
  appid: 1005, // config.json appid
  clientver: 20489, // config.json clientver
  androidSignSalt: 'OIlwieks28dk2k092lksi2UIkp',
  signKeySalt: '57ae12eb6890223e355ccfcb74edf70d',
  // publicRasKey
  publicRsaB64:
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDIAG7QOELSYoIJvTFJhMpe1s/gbjDJX51HBNnEl5HXqTW6lQ7LC8jr9fWZTwusknp+sVGzwd40MwP6U5yDE27M/X1+UR4tvOGOqp94TJtQ1EPnWGWXngpeIW5GxoQGao1rmYWAu6oi1z9XkChrsUdC6DJE5E221wf/4WLFxwAtRQIDAQAB',
  loginTokenAes: { key: '90b8382a1bb4ccdcf063102053fd75b8', iv: 'f063102053fd75b8' },
  loginByTokenPath: '/v5/login_by_token',
};

// 与原项目一致：不设置 platform（默认参数）
export const IS_LITE = false;

const P = IS_LITE ? LITE : DEFAULT_PLATFORM;

export const CONFIG = {
  srcappid: 2919,
  appid: P.appid,
  clientver: P.clientver,
  isLite: P.isLite,
};

// android signature 盐
export const ANDROID_SIGN_SALT = P.androidSignSalt;
// web signature 盐（源码中无 platform 分支）
export const WEB_SIGN_SALT = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt';
// signKey 盐
export const SIGN_KEY_SALT = P.signKeySalt;
// login_token 的 AES key/iv
export const LOGIN_TOKEN_AES = P.loginTokenAes;
// 刷新 token 的路径
export const LOGIN_BY_TOKEN_PATH = P.loginByTokenPath;

/**
 * 把 base64 主体按 64 字符折行，生成标准 PEM
 * （原仓库为单行 base64，这里规范化，保证字节零误差）
 */
export function toPem(body) {
  const lines = body.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

// RSA 公钥（/user/detail 验 token、/login/token 刷新用）
export const PUBLIC_RSA_KEY = toPem(P.publicRsaB64);

export const GATEWAY = 'https://gateway.kugou.com';
export const DEFAULT_UA =
  'Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi';

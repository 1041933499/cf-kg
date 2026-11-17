// 二维码 SVG 渲染 —— 基于 npm qrcode 包（纯 JS，可打包进 Workers）
import QRCode from 'qrcode';

/**
 * 生成 SVG 字符串
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function toSvg(text) {
  const svg = await QRCode.toString(text, {
    type: 'svg',
    margin: 2,
    width: 220,
    errorCorrectionLevel: 'M',
  });
  return svg;
}

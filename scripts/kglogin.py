#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
酷狗概念版 · 扫码登录取号（配合 scripts/kgcoin.py 使用）

用法：
    python kglogin.py                  # 生成二维码（终端显示 + kg_login_qr.png）
    python kglogin.py --seconds 180    # 轮询时长，默认 120 秒

流程（与 Cloudflare Worker 的 qrKey/qrCheck 完全同款，已实测）：
    1. GET login-user.kugou.com/v2/qrcode 申请一次性二维码
       - 签名：web 盐 NVPh...（md5(盐 + 字典序k=v + 盐)）
    2. 终端渲染二维码（本地 PNG，可复制到别处打开）；扫码页面链接可作备用
    3. 轮询 GET /v2/get_userinfo_qrcode，状态：
       0 过期 / 1 等待扫码 / 2 已扫码待确认 / 4 成功(返回 token+userid)
    4. 成功后输出账号串（kgcoin.py / GitHub Secret KGGNB 的格式）

安全提示：
    - 账号串包含 token，只在本机终端显示，请勿截图外发
    - 用【酷狗概念版 APP】扫码（提示文案如此；其它酷狗 APP 扫出的
      token 属主 APP 平台，coin 脚本可能不认）
    - 二维码仅 2 分钟有效，过期脚本会自动换码
    - 输出的 token 可能被 Worker 侧自动刷新而失效，失效后重扫即可

需要：Python 3.7+（仅标准库；终端无二维码库时自动改用 PNG+浏览器）
"""
import argparse
import base64
import hashlib
import json
import os
import sys
import time
import urllib.parse
import urllib.request

# Windows 控制台 GBK 会因 emoji/中文崩溃，统一切 UTF-8
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:                     # noqa: BLE001
        pass

LOGIN_HOST = "https://login-user.kugou.com"
QR_KEY_PATH = "/v2/qrcode"
QR_CHECK_PATH = "/v2/get_userinfo_qrcode"
QR_H5 = "https://h5.kugou.com/apps/loginQRCode/html/index.html"
SALT = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt"   # web 签名盐（与 kgcoin/Worker 一致）
CLIENTVER = "20489"
TIMEOUT = 20
OUT_PNG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kg_login_qr.png")


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def md5(s):
    return hashlib.md5(str(s).encode("utf-8")).hexdigest()


def make_sign(params):
    joined = "".join(f"{k}={params[k]}" for k in sorted(params.keys()))
    return md5(SALT + joined + SALT)


def http_get(url):
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent",
                   "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36")
    last = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                return json.loads(r.read().decode("utf-8", "replace"))
        except Exception as e:            # noqa: BLE001
            last = e
            time.sleep(1.5)
    raise RuntimeError(f"请求失败: {last}")


def derive_device():
    """固定设备标识（进程内不变），uuid 与 mid 对齐 Worker 规则"""
    dfid = "0j" + md5(str(os.getpid()) + str(int(time.time())))[:20]
    mid = md5(dfid) + md5(dfid)[:7]
    uuid = md5(dfid + mid)
    return dfid, mid, uuid


def create_qr():
    dfid, mid, uuid = derive_device()
    qrcode_txt = f"{QR_H5}?appid=1005&signature=placeholder"
    p = {
        "appid": "1005",
        "srcappid": "2919",
        "clientver": CLIENTVER,
        "clienttime": str(int(time.time() * 1000)),
        "mid": mid,
        "uuid": uuid,
        "dfid": dfid,
        "type": "1",
        "plat": "4",
        "qrcode_txt": qrcode_txt,
    }
    p["signature"] = make_sign(p)
    url = LOGIN_HOST + QR_KEY_PATH + "?" + urllib.parse.urlencode(p)
    r = http_get(url)
    data = (r or {}).get("data") or {}
    key = data.get("qrcode") or data.get("key") or ""
    if not key:
        raise RuntimeError(f"取码失败: {json.dumps(r, ensure_ascii=False)[:200]}")
    return {"key": key, "img": data.get("qrcode_img") or "", "dfid": dfid,
            "mid": mid, "uuid": uuid}


def poll_status(sess):
    dfid, mid, uuid = sess["dfid"], sess["mid"], sess["uuid"]
    p = {
        "plat": "4",
        "appid": "1005",
        "srcappid": "2919",
        "qrcode": sess["key"],
        "clientver": CLIENTVER,
        "clienttime": str(int(time.time() * 1000)),
        "mid": mid,
        "uuid": uuid,
        "dfid": dfid,
    }
    p["signature"] = make_sign(p)
    url = LOGIN_HOST + QR_CHECK_PATH + "?" + urllib.parse.urlencode(p)
    return http_get(url)


def render_qr(sess):
    """优先终端渲染（zbar 不依赖）；无二维码库时退化为 PNG + 链接"""
    payload = f"{QR_H5}?qrcode={sess['key']}"
    kind = "link"
    # 1) 终端二维码
    try:
        import qrcode                          # noqa: PLC0415
        qr = qrcode.QRCode(border=1)
        qr.add_data(payload)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
        log("↑ 请用【酷狗概念版 APP】扫描上方二维码")
        kind = "ascii"
    except Exception:                          # noqa: BLE001
        # 2) 本地 PNG
        png_b64 = sess.get("img", "")
        if png_b64.startswith("data:"):
            png_b64 = png_b64.split(",", 1)[1]
        if png_b64:
            try:
                with open(OUT_PNG, "wb") as f:
                    f.write(base64.b64decode(png_b64))
                log(f"二维码已保存: {OUT_PNG}（双击打开后用 APP 扫）")
                kind = "png"
            except Exception as e:             # noqa: BLE001
                log(f"PNG 保存失败: {e}")
    if kind == "link":
        log("扫码页面链接（浏览器打开后用 APP 扫）:")
    log(f"  {payload}")
    return payload, kind


def run(seconds, remark="我的号", out=None):
    log("酷狗概念版 · 扫码登录取号")
    log("=" * 52)
    try:
        import qrcode                          # noqa: PLC0415
    except ImportError:
        log("提示: 未安装 qrcode 库，将用 PNG/链接方式展示"
            "（pip install qrcode 可终端直显）")
    last_state = None
    deadline = time.time() + seconds
    while time.time() < deadline:
        try:
            sess = create_qr()
        except Exception as e:                # noqa: BLE001
            log(f"取码失败: {e}，3 秒后重试")
            time.sleep(3)
            continue
        _, kind = render_qr(sess)
        log(f"二维码有效期 120 秒，开始轮询（剩余 {int(deadline - time.time())}s）...")
        expire_at = time.time() + 115
        while time.time() < min(expire_at, deadline):
            time.sleep(2)
            try:
                r = poll_status(sess)
            except Exception:                 # noqa: BLE001
                continue                      # 单次轮询失败静默跳过
            d = (r or {}).get("data") or {}
            st = d.get("status")
            if st != last_state and st in (0, 1, 2, 4):
                names = {0: "已过期，正在换新码…", 1: "等待扫码",
                         2: "已扫码，请在手机上确认", 4: "授权成功"}
                log(f"状态: {st} - {names[st]}")
                last_state = st
            if st == 4:
                token = str(d.get("token") or "").strip()
                userid = str(d.get("userid") or d.get("user_id") or "").strip()
                if token and userid:
                    acc = f"{remark}#{token}#{userid}"
                    print()
                    log("=" * 52)
                    log("✅ 登录成功！")
                    if out:
                        # Actions/CI 模式：账号串只落文件，绝不进日志（日志可能公开）
                        with open(out, "w", encoding="utf-8", newline="") as f:
                            f.write(acc)
                        log(f"账号串已写入 {out}（内容不在日志显示）")
                    else:
                        log("账号串如下（复制到 Secret KGGNB 使用）:")
                        print(acc, flush=True)
                    log("=" * 52)
                    log("用法: GitHub Secrets → KGGNB → 粘贴上面整行")
                    log("     （多账号用 & 分隔；本地也可 export KGGNB=...）")
                    return 0
                log(f"status=4 但缺 token/userid: {json.dumps(d, ensure_ascii=False)[:150]}")
            if st == 0:
                break                          # 过期 → 外层自动换新码
        else:
            if time.time() >= deadline:
                break
    log("⏰ 超时未完成扫码，可重新运行本脚本")
    return 1


def main():
    ap = argparse.ArgumentParser(description="酷狗概念版扫码登录取号")
    ap.add_argument("--seconds", type=int, default=120, help="轮询时长（秒）")
    ap.add_argument("--remark", default="我的号", help="账号串首段备注")
    ap.add_argument("--out", default=None,
                    help="账号串写入该文件而不打印（CI/公开日志场景必用）")
    args = ap.parse_args()
    try:
        return run(max(30, args.seconds), remark=args.remark, out=args.out)
    except KeyboardInterrupt:
        print()
        log("已取消")
        return 130


if __name__ == "__main__":
    sys.exit(main())

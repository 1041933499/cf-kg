#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
酷狗概念版 · 扫码登录取号（配合 scripts/kgcoin.py / GitHub Actions 使用）

本地用法：
    python kglogin.py                       # 出码并等待扫码（过期自动换码）
    python kglogin.py --remark 小号 --seconds 180
    python kglogin.py --create --session qr.json     # 只生成二维码（会话存盘）
    python kglogin.py --poll --session qr.json --out account.txt

GitHub Actions 用法（.github/workflows/qr.yml）：
    python kglogin.py --create --session qr.json   # 日志打印全块二维码 + 保存 PNG
    python kglogin.py --poll --session qr.json --out account.txt
    → 日志里扫不出来时：运行页底部 Artifacts → login-qr → 下载 qr.png 再扫

流程（与 Cloudflare Worker 的 qrKey/qrCheck 完全一致，已实测）：
    1. GET login-user.kugou.com/v2/qrcode（web 盐签名）申请一次性二维码
    2. 展示二维码：全块字符（终端/日志）+ PNG 图片（API 直出）
    3. 轮询 /v2/get_userinfo_qrcode：0 过期 / 1 等待 / 2 已扫待确认 / 4 成功
    4. 成功后输出账号串（本地打印；CI 用 --out 落文件，绝不进日志）

安全：账号串含 token，只给--out 文件或本机终端，请勿截图外发。
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

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:                     # noqa: BLE001
        pass

LOGIN_HOST = "https://login-user.kugou.com"
QR_KEY_PATH = "/v2/qrcode"
QR_CHECK_PATH = "/v2/get_userinfo_qrcode"
QR_H5 = "https://h5.kugou.com/apps/loginQRCode/html/index.html"
SALT = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt"
CLIENTVER = "20489"
TIMEOUT = 20
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PNG = os.path.join(HERE, "kg_login_qr.png")
STATE_NAMES = {0: "已过期", 1: "等待扫码", 2: "已扫码，请在手机上确认", 4: "授权成功"}


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
    dfid = "0j" + md5(str(os.getpid()) + str(int(time.time())))[:20]
    mid = md5(dfid) + md5(dfid)[:7]
    uuid = md5(dfid + mid)
    return dfid, mid, uuid


def create_qr():
    dfid, mid, uuid = derive_device()
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
        "qrcode_txt": f"{QR_H5}?appid=1005&signature=placeholder",
    }
    p["signature"] = make_sign(p)
    r = http_get(LOGIN_HOST + QR_KEY_PATH + "?" + urllib.parse.urlencode(p))
    data = (r or {}).get("data") or {}
    key = data.get("qrcode") or data.get("key") or ""
    if not key:
        raise RuntimeError(f"取码失败: {json.dumps(r, ensure_ascii=False)[:200]}")
    return {"key": key, "img": data.get("qrcode_img") or "",
            "dfid": dfid, "mid": mid, "uuid": uuid,
            "created": int(time.time())}


def poll_status(sess):
    p = {
        "plat": "4",
        "appid": "1005",
        "srcappid": "2919",
        "qrcode": sess["key"],
        "clientver": CLIENTVER,
        "clienttime": str(int(time.time() * 1000)),
        "mid": sess["mid"],
        "uuid": sess["uuid"],
        "dfid": sess["dfid"],
    }
    p["signature"] = make_sign(p)
    return http_get(LOGIN_HOST + QR_CHECK_PATH + "?" + urllib.parse.urlencode(p))


def print_ascii_qr(payload):
    """全块字符渲染：每个模块 2 字符宽 × 1 行（半块字符在 GitHub 日志里会因
    行距被纵向拉伸导致扫不出来，全块最稳）；手动补 2 格静区"""
    import qrcode                          # noqa: PLC0415
    qr = qrcode.QRCode(border=0,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(payload)
    qr.make(fit=True)
    rows = qr.modules                      # 不含静区
    n = len(rows)
    pad = 2
    blank = "  " * (n + 2 * pad)
    print()
    for _ in range(pad):
        print(blank, flush=True)
    for row in rows:
        print("  " * pad + "".join("██" if c else "  " for c in row)
              + "  " * pad, flush=True)
    for _ in range(pad):
        print(blank, flush=True)
    print(f"（{n}×{n} 全块二维码，含静区）", flush=True)


def save_png(sess):
    b64 = sess.get("img", "")
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    if not b64:
        return None
    try:
        with open(OUT_PNG, "wb") as f:
            f.write(base64.b64decode(b64))
        return OUT_PNG
    except Exception as e:                 # noqa: BLE001
        log(f"PNG 保存失败: {e}")
        return None


def show_qr(sess):
    """展示二维码：本地出字符码 + PNG；GitHub Actions 走 PNG 图片直链"""
    payload = f"{QR_H5}?qrcode={sess['key']}"
    rendered = False
    if not os.environ.get("GITHUB_ACTIONS"):
        try:
            print_ascii_qr(payload)
            log("↑ 请用【酷狗概念版 APP】扫描上方二维码")
            rendered = True
        except ImportError:
            log("提示: 未安装 qrcode 库（pip install qrcode）")
        except Exception as e:             # noqa: BLE001
            log(f"字符二维码渲染失败: {e}")
    png = save_png(sess)
    if png:
        log(f"二维码图片已保存: {png}")
    if not rendered:
        log(f"扫码数据（可自行生成二维码）: {payload}")
    return payload


def poll_until(sess, seconds, remark, out):
    """轮询直到成功/过期/超时。返回 0 成功 / 1 超时 / 2 过期"""
    deadline = time.time() + seconds
    last = None
    while time.time() < deadline:
        time.sleep(2)
        try:
            r = poll_status(sess)
        except Exception:                 # noqa: BLE001
            continue                      # 单次失败静默跳过
        d = (r or {}).get("data") or {}
        st = d.get("status")
        if st != last and st in STATE_NAMES:
            log(f"状态: {st} - {STATE_NAMES[st]}")
            last = st
        if st == 4:
            token = str(d.get("token") or "").strip()
            userid = str(d.get("userid") or d.get("user_id") or "").strip()
            if not (token and userid):
                log(f"status=4 但缺 token/userid: "
                    f"{json.dumps(d, ensure_ascii=False)[:150]}")
                continue
            acc = f"{remark}#{token}#{userid}"
            print()
            log("=" * 52)
            log("✅ 登录成功！")
            if out:
                with open(out, "w", encoding="utf-8", newline="") as f:
                    f.write(acc)
                log(f"账号串已写入 {out}（内容不在日志显示）")
            else:
                log("账号串如下（复制到 Secret KGGNB / 环境变量使用）:")
                print(acc, flush=True)
            log("=" * 52)
            return 0
        if st == 0:
            return 2
    return 1


def run(seconds, remark="我的号", out=None):
    """本地交互模式：出码 → 等待 → 过期自动换码"""
    log("酷狗概念版 · 扫码登录取号")
    log("=" * 52)
    deadline = time.time() + seconds
    while time.time() < deadline:
        try:
            sess = create_qr()
        except Exception as e:            # noqa: BLE001
            log(f"取码失败: {e}，3 秒后重试")
            time.sleep(3)
            continue
        show_qr(sess)
        log(f"二维码约 2 分钟有效，开始轮询（剩余 {int(deadline - time.time())}s）...")
        rc = poll_until(sess, min(115, max(10, deadline - time.time())),
                        remark, out)
        if rc == 0:
            return 0
        if rc == 2:
            log("二维码已过期，自动换新码…")
            continue
        break
    log("⏰ 超时未完成扫码，可重新运行本脚本")
    return 1


def cmd_create(session_path):
    log("酷狗概念版 · 生成扫码会话")
    log("=" * 52)
    for i in range(3):
        try:
            sess = create_qr()
            break
        except Exception as e:            # noqa: BLE001
            log(f"取码失败: {e}（{i + 1}/3）")
            time.sleep(3)
    else:
        log("❌ 三次取码均失败，请稍后重试")
        return 1
    show_qr(sess)
    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(sess, f)
    log(f"会话已保存: {session_path}（下一步 --poll 使用）")
    return 0


def cmd_poll(session_path, seconds, remark, out):
    if not os.path.exists(session_path):
        log(f"❌ 会话文件不存在: {session_path}（先运行 --create）")
        return 1
    with open(session_path, encoding="utf-8") as f:
        sess = json.load(f)
    log("等待扫码…")
    rc = poll_until(sess, seconds, remark, out)
    if rc == 0:
        return 0
    if rc == 2:
        log("⏰ 二维码已过期，请重新运行本工作流（Run workflow）")
        return 2
    log("⏰ 等待超时，请重新运行本工作流（Run workflow）")
    return 1


def main():
    ap = argparse.ArgumentParser(description="酷狗概念版扫码登录取号")
    ap.add_argument("--seconds", type=int, default=150, help="轮询时间（秒）")
    ap.add_argument("--remark", default="我的号", help="账号串首段备注")
    ap.add_argument("--out", default=None,
                    help="账号串写入文件而不打印（CI/公开日志场景必用）")
    ap.add_argument("--create", action="store_true", help="只生成二维码（配合 --session）")
    ap.add_argument("--poll", action="store_true", help="只轮询已有会话（配合 --session）")
    ap.add_argument("--session", default="qr_session.json", help="会话文件路径")
    args = ap.parse_args()
    try:
        if args.create:
            return cmd_create(args.session)
        if args.poll:
            return cmd_poll(args.session, max(30, args.seconds),
                            args.remark, args.out)
        return run(max(30, args.seconds), remark=args.remark, out=args.out)
    except KeyboardInterrupt:
        print()
        log("已取消")
        return 130


if __name__ == "__main__":
    sys.exit(main())

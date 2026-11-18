#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
 酷狗概念版 (KugouYouth) —— 【任务脚本 v3.6】每日金币目标档位 + 多账号并发收割
 青龙面板 / Dumb-Panel 多账号聚合推送版
================================================================================

  v3.6 每日金币目标档位（本项目新增：控制收益量 + 降低风控风险）：
    通过 --target 或环境变量 KGGNB_TARGET 选择「每个账号每日获取多少金币」，
    档位同时决定停止条件与请求节奏（档位越低越保守）：

      1w  =    10,000  保守：慢间隔 2.5~5s、翻倍 ≤4 档、任务上限小、多账号串行
      10w =   100,000  中等：间隔 1.8~3.5s、翻倍 ≤8 档、并发 ≤3   ← 默认档
      25w =   250,000  激进：原版 v3.5 满额参数（1.2~2.5s、翻倍 ≤12、并发 10）

    任意自定义数值（如 5w / 50000）也支持：按「不小于目标的最小档」取节奏，
    达到设定数值立即停止任务与 1105 循环。

    用法：  python kgcoin.py --target 1w
            python kgcoin.py --target 10w --info
    环境变量：KGGNB_TARGET=1w（兼容 KG_TARGET）；未指定默认 10w。

  v3 核心收益逻辑（真机实测验证，满额跑单账号日收益可达 18W~25W 金币 ≈ 18~25元）：
  1. 翻倍链独立领取：每次基础提交后自动连翻 3~7 档（单次最高 +1500~+3500 金币）
  2. 任务 9「刷创意视频」60 次/天，翻倍吃满单任务达 +99,000+ 金币
  3. 任务 45「直达广告」15 次/天，前 10 次有翻倍，单任务 +17,000+ 金币
  4. 任务 2022「我页广告」4 次/天，翻倍链 5~7 档，单任务 +8,700+ 金币
  5. 每日小任务（2002/2003/2006/2008）+ 盲盒福利 + 翻牌活动
  6. 1105 定时领取 ×35 次/天（冷却约 10~20 分钟/次）

  【多账号环境变量】
    变量名：KGGNB 或 kggnb 或 KGGNB_TASK 或 kwtx 或 KWTX
    每日目标档位：KGGNB_TARGET（1w / 10w / 25w / 任意金币数字）
    多账号格式：支持使用 & 或 换行 分割多个账号
    单账号格式：
      - 标准格式：备注#token#userid#mid#dfid#devid[#t2][#uni_verify_str]
      - 简写格式：备注#token#userid 或 token#userid（缺少 mid/dfid 自动算法推导补齐）
      - 提现兼容格式：备注#token#userid#openid#nickname[#appid]
      - 键值对格式：token=xxx;userid=yyy;mid=zzz...
    
   定时：5 0 * * *

  【推送通知】
    三级自动兜底：青龙内置 notify -> 同目录 SendNotify.py -> 控制台日志
================================================================================"""

import gzip
import hashlib
import json
import os
import random
import re
import string
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

# Windows 控制台默认 GBK，日志含 emoji/中文时会 UnicodeEncodeError 崩溃，
# 统一切到 UTF-8（青龙/Linux 本身是 UTF-8，reconfigure 无副作用）
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:                     # noqa: BLE001
        pass

# ============================================================================
#  可调参数
# ============================================================================
CFG = {
    "skip_taskids": [2124],                 # 下载试玩需广告 SDK 试玩回传，跳过
    "task_loop_caps": {9: 60, 45: 15, 2022: 4, 1105: 35, 1107: 10},
    "delay_min": 1.2, "delay_max": 2.5,     # v3 提速（翻倍链本身有节奏）
    "lock": True,
    "wait_1105_max": 300,
    "retry": 1,
    "double_max": 12,                       # ★ v3: 翻倍链上限提到 12（实测 3-7 档）
    "double_delay": 1.5,                    # 翻倍间隔（秒）
    "send_ticket": True,
    "send_clienttime_ms": True,
    "send_user_label": True,
    "use_profile": True,
    "loop1105_rounds": 40,
    "loop1105_max_wait": 1200,
    # 每日一次性任务（00:00 重置后可再领）
    "daily_once": [2002, 2003, 2006, 2008, 1139, 2022, 45, 9],
    # 多账号并发配置（多账号同时收割，避免串行执行导致总体耗时翻倍或超时）
    "concurrent": True,
    "max_account_workers": 10,
}

ENV_NAME = "KGGNB"

# ============================================================================
#  v3.6 每日金币目标档位（--target / KGGNB_TARGET）
#    档位 = 停止条件（每账号拿到多少就停）+ 风控节奏（间隔/翻倍/次数/并发）
# ============================================================================
TARGET_CHOICES = [10000, 100000, 250000]   # 1w / 10w / 25w
DEFAULT_TARGET = 100000                    # 默认 10w：比原版收敛，避免一上来就激进

TARGET_PRESETS = {
    # ---- 1w：保守档（易风控场景优先选它） ----
    10000: {
        "label": "1w 保守",
        "task_loop_caps": {9: 5, 45: 2, 2022: 1, 1105: 8, 1107: 3},
        "delay_min": 2.5, "delay_max": 5.0,
        "double_max": 4,
        "double_delay": 3.0,
        "loop1105_rounds": 10,
        "loop1105_max_wait": 300,
        "concurrent": False,               # 多账号串行，避免同 IP 高频并发
        "max_account_workers": 2,
        "welfare_sleep": 2.0,
    },
    # ---- 10w：中等档（默认） ----
    100000: {
        "label": "10w 中等",
        "task_loop_caps": {9: 25, 45: 8, 2022: 2, 1105: 20, 1107: 5},
        "delay_min": 1.8, "delay_max": 3.5,
        "double_max": 8,
        "double_delay": 2.0,
        "loop1105_rounds": 25,
        "loop1105_max_wait": 600,
        "concurrent": True,
        "max_account_workers": 3,
        "welfare_sleep": 1.5,
    },
    # ---- 25w：激进档（原版 v3.5 参数原样保留） ----
    250000: {
        "label": "25w 激进(原版)",
        "task_loop_caps": {9: 60, 45: 15, 2022: 4, 1105: 35, 1107: 10},
        "delay_min": 1.2, "delay_max": 2.5,
        "double_max": 12,
        "double_delay": 1.5,
        "loop1105_rounds": 40,
        "loop1105_max_wait": 1200,
        "concurrent": True,
        "max_account_workers": 10,
        "welfare_sleep": 1.0,
    },
}


def parse_target(raw):
    """解析目标档位：1w/10w/25w 或纯数字（金币）。无法识别返回 None。"""
    if raw is None:
        return None
    s = str(raw).strip().lower().replace(",", "").replace("_", "")
    if not s:
        return None
    m = re.match(r"^(\d+(?:\.\d+)?)\s*w$", s)
    if m:
        return int(float(m.group(1)) * 10000)
    if s.isdigit():
        return int(s)
    return None


def nearest_preset(target):
    """任意目标值 → 选取节奏档：不小于目标的最小档（自定义值偏向保守）。"""
    for t in TARGET_CHOICES:
        if target <= t:
            return t
    return TARGET_CHOICES[-1]


def apply_target(target):
    """按每日目标把节奏参数写入 CFG，返回所用档位 key。"""
    key = nearest_preset(target)
    p = TARGET_PRESETS[key]
    CFG["task_loop_caps"] = dict(p["task_loop_caps"])
    CFG["delay_min"] = p["delay_min"]
    CFG["delay_max"] = p["delay_max"]
    CFG["double_max"] = p["double_max"]
    CFG["double_delay"] = p["double_delay"]
    CFG["loop1105_rounds"] = p["loop1105_rounds"]
    CFG["loop1105_max_wait"] = p["loop1105_max_wait"]
    CFG["concurrent"] = p["concurrent"]
    CFG["max_account_workers"] = p["max_account_workers"]
    CFG["welfare_sleep"] = p["welfare_sleep"]
    CFG["target"] = int(target)
    CFG["target_label"] = p["label"]
    return key


def target_desc():
    return (f"{CFG.get('target', DEFAULT_TARGET)} 金币 "
            f"({CFG.get('target_label', '')})")


def reset_budget(acc):
    """给账号挂上每日目标与已获取计数（每账号独立额度）。"""
    acc["target"] = int(CFG.get("target") or DEFAULT_TARGET)
    acc["got"] = 0


def target_reached():
    acc = get_current_account()
    if not acc:
        return False
    target = int(acc.get("target") or CFG.get("target") or 0)
    got = int(acc.get("got") or 0)
    return bool(target) and got >= target


def add_gain(coins):
    """累计当前账号已获取金币；跨过目标时打日志。返回是否已达标。"""
    acc = get_current_account()
    if not acc:
        return False
    before = int(acc.get("got") or 0)
    target = int(acc.get("target") or CFG.get("target") or 0)
    got = before + int(coins or 0)
    acc["got"] = got
    if target and before < target <= got:
        log(f"🎯 已达每日目标 {got}/{target} 金币，停止后续任务")
        return True
    return bool(target) and got >= target


ENV_FIELDS = ["remark", "token", "userid", "mid", "dfid", "devid", "t2", "uni_verify_str"]

TICKET_SALT = "t6us8yan^mEtWj7P"
YOUTH_APPID = "3116"
YOUTH_CLIENTVER = "11571"
YOUTH_ACT_ID = 352
CONCEPTS_ACT_SIGN = "holiday_lucky_card"

DEFAULT_ACCOUNTS = [
    {"remark": "本地调试", "token": "填写", "userid": "填写",
     "mid": "填写", "dfid": "填写", "devid": "可填"},
]

SALT = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt"
BASE = "https://gateway.kugou.com"
UA = ("Mozilla/5.0 (Linux; Android 14; 2203121C Build/UKQ1.231003.002; wv) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 "
      "Mobile Safari/537.36 KugouYouth")
TIMEOUT = 25
LOCK_FILE = os.path.join(tempfile.gettempdir(), "kugou_task_v3.lock")
LOCK_TTL = 3600

REQ_COUNT = 0
REQ_COUNT_LOCK = threading.Lock()

def inc_req():
    global REQ_COUNT
    with REQ_COUNT_LOCK:
        REQ_COUNT += 1

# 线程上下文账号代理（实现多账号并发执行互不串号）
_tls = threading.local()
_GLOBAL_ACC = {}

class _AccountProxy:
    def _current(self):
        acc = getattr(_tls, "acc", None)
        return acc if acc is not None else _GLOBAL_ACC

    def get(self, key, default=None):
        return self._current().get(key, default)

    def __getitem__(self, key):
        return self._current()[key]

    def __setitem__(self, key, value):
        self._current()[key] = value

    def __contains__(self, key):
        return key in self._current()

    def __repr__(self):
        return repr(self._current())

    def update(self, *args, **kwargs):
        return self._current().update(*args, **kwargs)

ACC = _AccountProxy()

def set_current_account(acc):
    _tls.acc = acc
    _GLOBAL_ACC.clear()
    _GLOBAL_ACC.update(acc)

def get_current_account():
    acc = getattr(_tls, "acc", None)
    return acc if acc is not None else _GLOBAL_ACC

_log_lock = threading.Lock()


# ============================================================================
#  基础设施（沿用 v2 已验证的实现）
# ============================================================================
def log(msg, tag=None):
    if tag is None:
        cur = get_current_account()
        tag = cur.get("remark") if cur else ""
    prefix = f" [{tag}]" if tag else ""
    line = f"[{time.strftime('%H:%M:%S')}]{prefix} {msg}"
    with _log_lock:
        print(line, flush=True)


def derive_mid(token):
    n = int(hashlib.md5(("kg-mid:" + str(token)).encode()).hexdigest(), 16)
    return str(n % (10 ** 39)).zfill(39)


def derive_dfid(token):
    h = hashlib.sha256(("kg-dfid:" + str(token)).encode()).hexdigest()
    pool = string.ascii_letters + string.digits
    return "".join(pool[int(h[i * 2:i * 2 + 2], 16) % len(pool)] for i in range(23))


RE_MID = re.compile(r"^\d{25,45}$")


def parse_accounts():
    """解析多账号配置。
    支持环境变量：KGGNB, kggnb, KGGNB_TASK, kugou_token, kwtx, KWTX
    支持多账号分隔符：& 或 换行
    支持单账号多种格式（标准格式、提现兼容格式、缺备注格式、键值对格式）
    自动为缺失 mid/dfid 的账号补齐基于 token 算法推导的高仿真设备标识。
    """
    raw = ""
    for k in (ENV_NAME, "kggnb", "KGGNB_TASK", "kugou_token", "kwtx", "KWTX"):
        val = (os.environ.get(k) or "").strip()
        if val:
            raw = val
            break

    raw = raw.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\r", "\n")
    chunks = []
    for part in re.split(r"[&\n]+", raw):
        part = part.strip()
        if part and not part.startswith("#"):
            chunks.append(part)

    accounts = []
    seen = set()

    for idx, line in enumerate(chunks, 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        # 兼容 Key-Value 键值对格式
        if "#" not in line and ("token=" in line or "userid=" in line):
            kv = {}
            for item in re.split(r"[;,]+", line):
                if "=" in item:
                    k, v = item.split("=", 1)
                    kv[k.strip().lower()] = v.strip()
            token = kv.get("token", "")
            userid = kv.get("userid", "")
            if token and userid:
                key = (userid, token)
                if key not in seen:
                    seen.add(key)
                    remark = kv.get("remark") or kv.get("nickname") or f"账号_{userid}"
                    acc = {
                        "remark": remark, "token": token, "userid": userid,
                        "mid": kv.get("mid", "") or derive_mid(token),
                        "dfid": kv.get("dfid", "") or derive_dfid(token),
                        "devid": kv.get("devid", ""),
                        "t2": kv.get("t2", ""),
                        "uni_verify_str": kv.get("uni_verify_str", ""),
                    }
                    accounts.append(acc)
            continue

        parts = [x.strip() for x in line.split("#")]
        parts = [x for x in parts if x]
        if len(parts) < 2:
            continue

        # 兼容缺少备注直接以 32 位 hex Token 开头的写法
        if len(parts[0]) == 32 and all(c in string.hexdigits for c in parts[0]) and len(parts) > 1 and parts[1].isdigit():
            parts = [f"账号_{parts[1]}"] + parts

        remark = parts[0]
        token = parts[1]
        acc = {"remark": remark, "token": token, "userid": "",
               "mid": "", "dfid": "", "devid": "", "t2": "", "uni_verify_str": ""}
        rest = parts[2:]
        if len(rest) >= 2 and RE_MID.match(rest[1]):
            # 标准 6~8 段格式: remark#token#userid#mid#dfid#devid[#t2][#uni_verify_str]
            acc["userid"] = rest[0]
            acc["mid"] = rest[1]
            acc["dfid"] = rest[2] if len(rest) > 2 else ""
            acc["devid"] = rest[3] if len(rest) > 3 else ""
            acc["t2"] = rest[4] if len(rest) > 4 else ""
            acc["uni_verify_str"] = rest[5] if len(rest) > 5 else ""
        else:
            # 简写或提现格式: remark#token#userid[#openid/mid][#nickname/dfid]...
            acc["userid"] = rest[0] if rest else ""
            if len(rest) > 1 and RE_MID.match(rest[1]):
                acc["mid"] = rest[1]
                acc["dfid"] = rest[2] if len(rest) > 2 else ""
                acc["devid"] = rest[3] if len(rest) > 3 else ""
            else:
                # rest[1] 可能是 openid，跳过，自动推导 mid 和 dfid
                pass

        if not acc["token"] or not acc["userid"] or acc["token"] in ("填写", "xxx") or acc["userid"] in ("填写", "xxx"):
            continue

        acc["mid"] = acc["mid"] or derive_mid(acc["token"])
        acc["dfid"] = acc["dfid"] or derive_dfid(acc["token"])
        acc["remark"] = acc["remark"] or acc["userid"]

        key = (acc["userid"], acc["token"])
        if key in seen:
            continue
        seen.add(key)
        accounts.append(acc)

    return accounts


def acquire_lock():
    if not CFG.get("lock", True):
        return True
    try:
        if os.path.exists(LOCK_FILE):
            age = time.time() - os.path.getmtime(LOCK_FILE)
            if age < LOCK_TTL:
                return False
    except OSError:
        pass
    try:
        with open(LOCK_FILE, "w") as f:
            f.write(str(int(time.time())))
        return True
    except OSError:
        return True


def release_lock():
    if not CFG.get("lock", True):
        return
    try:
        os.remove(LOCK_FILE)
    except OSError:
        pass


def sleep_rand():
    time.sleep(random.uniform(CFG["delay_min"], CFG["delay_max"]))


def make_sign(params, raw_body=None):
    keys = sorted(params.keys())
    joined = "".join(f"{k}={params[k]}" for k in keys)
    if raw_body:
        joined += raw_body
    return hashlib.md5((SALT + joined + SALT).encode("utf-8")).hexdigest()


def make_ticket(taskid):
    raw = f"{ACC.get('userid', '')}{int(taskid)}{int(time.time())}{TICKET_SALT}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def _request(url, raw, method, _retry):
    req = urllib.request.Request(url, data=(raw.encode("utf-8") if raw else None),
                                 method=method)
    req.add_header("User-Agent", UA)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    if ACC.get("devid"):
        req.add_header("KG-DEVID", ACC["devid"])
    req.add_header("KG-CLIENTTIMEMS", str(int(time.time() * 1000)))
    req.add_header("Accept-Encoding", "gzip")

    last_err = None
    for attempt in range(_retry + 1):
        try:
            inc_req()
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                body = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    body = gzip.decompress(body)
            return json.loads(body.decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            b = e.read()
            try:
                if e.headers.get("Content-Encoding") == "gzip":
                    b = gzip.decompress(b)
            except Exception:
                pass
            last_err = f"HTTP {e.code}: {b[:200].decode('utf-8', 'replace')}"
        except Exception as e:            # noqa: BLE001
            last_err = f"{type(e).__name__}: {e}"
        if attempt < _retry:
            time.sleep(1.5 + attempt * 1.5)
    raise RuntimeError(f"{method} {url.split('?')[0]} 失败 -> {last_err}")


def api(path, params=None, data=None, method="GET", _retry=None, prefix="/yutc"):
    if _retry is None:
        _retry = CFG["retry"]
    p = {
        "appid": "3116",
        "clientver": "11571",
        "clienttime": str(int(time.time())),
        "mid": ACC.get("mid", ""),
        "uuid": "-",
        "dfid": ACC.get("dfid", ""),
        "srcappid": "2919",
        "userid": ACC.get("userid", ""),
        "token": ACC.get("token", ""),
    }
    if params:
        p.update({k: str(v) for k, v in params.items()})
    raw = None
    if data is not None:
        raw = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    p["signature"] = make_sign(p, raw)
    url = BASE + prefix + path + "?" + urllib.parse.urlencode(p)
    return _request(url, raw, method, _retry)


def youth_api(path, params=None, data=None, method="GET", _retry=None):
    if _retry is None:
        _retry = CFG["retry"]
    p = {
        "appid": YOUTH_APPID,
        "clientver": YOUTH_CLIENTVER,
        "clienttime": str(int(time.time() * 1000)),
        "mid": ACC.get("mid", "") or "-",
        "uuid": "-",
        "dfid": ACC.get("dfid", "") or "-",
        "srcappid": "2919",
        "clienttoken": ACC.get("token", ""),
        "userid": ACC.get("userid", ""),
        "token": ACC.get("token", ""),
    }
    if params:
        p.update({k: str(v) for k, v in params.items() if v is not None})
    raw = None
    if data is not None:
        raw = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    p["signature"] = make_sign(p, raw)
    url = BASE + "/youth" + path + "?" + urllib.parse.urlencode(p)
    return _request(url, raw, method, _retry)


def concepts_api(path, params=None, data=None, method="GET", _retry=None):
    if _retry is None:
        _retry = CFG["retry"]
    p = {
        "appid": YOUTH_APPID,
        "clientver": YOUTH_CLIENTVER,
        "clienttime": str(int(time.time() * 1000)),
        "mid": ACC.get("mid", "") or "-",
        "uuid": "-",
        "dfid": ACC.get("dfid", "") or "-",
        "srcappid": "2919",
        "userid": ACC.get("userid", ""),
        "token": ACC.get("token", ""),
    }
    if params:
        p.update({k: str(v) for k, v in params.items() if v is not None})
    raw = None
    if data is not None:
        raw = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    p["signature"] = make_sign(p, raw)
    url = BASE + "/concepts" + path + "?" + urllib.parse.urlencode(p)
    return _request(url, raw, method, _retry)


def resp_ok(r):
    return int((r or {}).get("status") or 0) == 1


def resp_err(r):
    r = r or {}
    return (r.get("error") or r.get("error_msg")
            or f"errcode={r.get('errcode')} error_code={r.get('error_code')}")


# ============================================================================
#  业务接口
# ============================================================================
def get_infos():
    return api("/youth/v1/system/infos")


def get_account():
    return api("/youth/v1/user/info")["data"]


def get_sign_state():
    return api("/youth/v1/task/sign_state")["data"]


def do_signon():
    st = get_sign_state()
    today = next((x for x in st.get("list", []) if x.get("today") == 1), None)
    if not today:
        return False, "未找到今日签到项"
    if today.get("state") != 0:
        return False, f"今日已签到 (state={today.get('state')})"
    code = today.get("code")
    try:
        api("/youth/v1/task/check_risk", params={"taskid": 100001})
    except Exception:                     # noqa: BLE001
        pass
    sleep_rand()
    r = api("/youth/v1/task/signon",
            params={"taskid": "100001", "from": "client"},
            data={"code": code, "source": 18},
            method="POST")
    if r.get("status") == 1:
        return True, f"签到成功 (code={code})"
    return False, f"签到失败: {r.get('error') or r.get('errcode')}"


def get_system_profile():
    return api("/youth/v1/system/profile",
               params={"ability": 3, "from": "client"},
               data={"user_label": {}}, method="POST")


def get_task_info(taskid):
    return api("/youth/v1/task/info",
               params={"taskid": taskid, "source": "18",
                       "pagename": "taskcenter", "appver": "1000"})


# ============================================================================
#  ★★★ v3 核心：满链提交（基础 + 全部翻倍档）
# ============================================================================
def submit_task_full(tid, show_coins):
    """
    提交任务并吃完整个翻倍链。
    返回 (总到账金币, 主响应, 错误说明)

    v3 修正的关键点：
    - 翻倍循环不比较 dc 前缀（旧版误判 dc 相同就停）
    - use_uni_award=1：实测不需要真实广告观看即可翻倍
    - double_award_type=2 给 500/档；type=1/3 给 300/档（2 最优）
    """
    body = {"appver": 1000, "taskid": tid,
            "show_coins": int(show_coins or 0), "source": 18}
    if CFG.get("send_clienttime_ms", True):
        body["clienttime_ms"] = int(time.time() * 1000)
    if CFG.get("send_user_label", True):
        body["user_label"] = {}
    if ACC.get("t2"):
        body["t2"] = ACC["t2"]
    uni = ACC.get("uni_verify_str") or ""
    if uni:
        body["uni_verify_str"] = uni
    if CFG.get("send_ticket", True):
        body["ticket"] = make_ticket(tid)

    try:
        r = api("/youth/v1/task/submit", data=body, method="POST")
    except Exception as e:                # noqa: BLE001
        return 0, {}, str(e)

    if r.get("status") != 1:
        return 0, r, r.get("error") or f"errcode={r.get('errcode')}"

    d = r.get("data") or {}
    total = int((d.get("awards") or {}).get("coins") or 0)
    if total <= 0 and not d.get("double_code"):
        return 0, r, ""

    # ---- 翻倍链：打到 dc 为空 ----
    dc = d.get("double_code")
    round_no = 0
    while dc and round_no < int(CFG.get("double_max") or 12):
        round_no += 1
        time.sleep(CFG.get("double_delay", 1.5))
        try:
            b2 = dict(body)
            b2["double_code"] = dc
            b2["double_award_type"] = 2        # ★ 每档 +500（最优档）
            b2["use_uni_award"] = 1            # ★ 无需真实广告
            b2["clienttime_ms"] = int(time.time() * 1000)
            b2["ticket"] = make_ticket(tid)
            r2 = api("/youth/v1/task/submit", data=b2, method="POST")
        except Exception as e:            # noqa: BLE001
            log(f"      ! 翻倍 #{round_no} 异常: {e}")
            break

        if r2.get("status") != 1:
            break

        d2 = r2.get("data") or {}
        c2 = int((d2.get("awards") or {}).get("coins") or 0)
        if c2 <= 0:
            break
        total += c2
        dc = d2.get("double_code")        # ★ v3: 不比较前缀，为空即止

    return total, r, ""


# ============================================================================
#  收割流程
# ============================================================================
def collect_tasks():
    """全量收割：签到 + 所有可领任务（含满链翻倍）"""
    infos = get_infos()
    if infos.get("status") != 1:
        raise RuntimeError(f"system/infos 异常: {infos.get('error') or infos.get('errcode')}")
    data = infos["data"]
    srv_ts = int(data.get("ts") or time.time())
    tasks = data.get("tasks") or []

    log("  ── 每日签到 ──")
    try:
        ok, msg = do_signon()
        log(("    ✓ " if ok else "    · ") + msg)
    except Exception as e:                # noqa: BLE001
        log(f"    ! 签到异常: {e}")

    log("  ── 扫描可领任务 ──")
    todo = []
    for t in tasks:
        pr = t.get("profile") or {}
        st = t.get("state") or {}
        tid = pr.get("taskid")
        if tid in CFG["skip_taskids"] or tid == 1:
            continue
        if not pr.get("open", 1):
            continue
        done = int(st.get("done_count") or 0)
        cap = int(st.get("max_done_count") or pr.get("max_done_count") or 0)
        if cap and done >= cap:
            continue
        if tid == 1105:
            continue  # 1105 由 loop_1105 专属处理
        if tid == 1107:
            ch = (st.get("lottery") or {}).get("chances", 0)
            if not ch or int(ch) <= 0:
                continue
        show = int(pr.get("show_coins") or pr.get("award_coins") or 0)
        if tid == 9:
            show = 200  # 9 的 award 是 0，但实际按 _award_list 给 288/108/388
        if tid == 2022:
            show = 100
        if tid == 45:
            show = 200
        rest = (cap - done) if cap else 1
        todo.append((tid, pr.get("name") or "", show, rest))

    if not todo:
        log("    · 暂无可领任务")
        return 0

    total = 0
    reached = False
    for tid, name, show_coins, rest in todo:
        if reached:
            break
        limit = CFG["task_loop_caps"].get(tid, rest)
        rounds = min(rest, limit) if limit else rest
        got_task = 0
        for i in range(rounds):
            coins, r, err = submit_task_full(tid, show_coins)
            if coins <= 0:
                if i == 0:
                    log(f"    · [{tid}]{name}: {err or '无奖励'}")
                break
            got_task += coins
            log(f"    ✓ [{tid}]{name} #{i + 1} +{coins}")
            if add_gain(coins):        # v3.6: 达到每日目标即停
                reached = True
                break
            sleep_rand()
        total += got_task
        if got_task:
            log(f"    Σ [{tid}]{name} 共 +{got_task}")

    if reached:
        log(f"  ── 已达每日目标 {target_desc()}，跳过剩余任务 ──")
    log(f"  ── 本轮任务累计 +{total} 金币 ──")
    return total


# ============================================================================
#  1105 循环（沿袭 v2 逻辑，换用满链提交）
# ============================================================================
def loop_1105(max_rounds=None, max_wait=None):
    max_rounds = int(max_rounds or CFG.get("loop1105_rounds") or 40)
    max_wait = int(max_wait if max_wait is not None
                   else CFG.get("loop1105_max_wait") or 1200)
    try:
        start = int((get_account().get("account") or {}).get("balance_coins") or 0)
    except Exception:                     # noqa: BLE001
        start = None
    log(f"  ── 1105 循环（最多 {max_rounds} 轮）──")
    got_total = 0
    for i in range(1, max_rounds + 1):
        if target_reached():            # v3.6: 达到每日目标即停
            log(f"    🎯 已达每日目标 {target_desc()}，停止 1105 循环")
            break
        try:
            r = get_task_info(1105)
        except Exception as e:            # noqa: BLE001
            log(f"    ! 第{i}轮查询失败: {e}")
            break
        d = r.get("data") or {}
        st = d.get("state") or {}
        pr = d.get("profile") or {}
        done = int(st.get("done_count") or 0)
        cap = int(st.get("max_done_count") or pr.get("max_done_count") or 0)
        nat = st.get("next_award_time")
        srv = int(st.get("server_time") or time.time())
        sc = int(st.get("coins") or pr.get("award_coins") or 200)
        if cap and done >= cap:
            log(f"    · 1105 今日已满 {done}/{cap}，停止")
            break
        wait = (int(nat) - srv) if nat else 0
        if wait < 0:
            wait = 0
        if wait > max_wait:
            log(f"    · 冷却剩 {wait}s 超上限，停止（done={done}/{cap}）")
            break
        if wait > 0:
            log(f"    · 等 {wait + 3}s 到点（done={done}/{cap}）")
            time.sleep(wait + 3)
        coins, resp, err = submit_task_full(1105, sc)
        if resp.get("status") != 1:
            log(f"    · 第{i}轮失败: {err}")
            time.sleep(5)
            continue
        got_total += coins
        log(f"    ✓ 第{i}轮 +{coins}（累计 +{got_total}）")
        add_gain(coins)                 # v3.6: 计入每日目标
        sleep_rand()
    if start is not None:
        try:
            end = int((get_account().get("account") or {}).get("balance_coins") or 0)
            log(f"  ── 1105 结束：{start} -> {end}（净增 {end - start}）──")
        except Exception:                 # noqa: BLE001
            pass
    return got_total


# ============================================================================
#  翻牌活动（每天重置，3 轮）
# ============================================================================
def holiday_flip():
    log("  ── 翻牌测运势（holiday_card）──")
    try:
        r = concepts_api("/v1/holiday_card/info",
                         params={"act_sign": CONCEPTS_ACT_SIGN})
    except Exception as e:                # noqa: BLE001
        log(f"    ! 查询失败: {e}")
        return 0
    if not resp_ok(r):
        log(f"    · info 异常: {r.get('errmsg') or r.get('errcode')}")
        return 0
    d = r.get("data") or {}
    state = d.get("state") or ""
    cur = int(d.get("current_round") or 0)
    top = int(d.get("max_round") or 3)
    if state.startswith("FROZEN"):
        log(f"    · 已冻结（{state}），解冻 share_code={d.get('share_code')}")
        return 0
    got = 0
    for rnd in range(cur + 1, top + 1):
        try:
            rr = concepts_api("/v1/holiday_card/draw",
                              data={"act_sign": CONCEPTS_ACT_SIGN, "round": rnd},
                              method="POST")
        except Exception as e:            # noqa: BLE001
            log(f"    ! 第{rnd}轮异常: {e}")
            break
        if not resp_ok(rr):
            break
        rd = rr.get("data") or {}
        secs = int(rd.get("reward_seconds") or 0)
        got += secs
        log(f"    ✓ 第{rnd}轮: {rd.get('prize_name')} +{secs}s")
        if rd.get("award_handler") == "no_award":
            try:
                r2 = concepts_api("/v1/holiday_card/info",
                                  params={"act_sign": CONCEPTS_ACT_SIGN})
                st2 = ((r2.get("data") or {}).get("state") or "")
                if st2.startswith("FROZEN"):
                    log(f"    · 冻结于 {st2}，share_code="
                        f"{(r2.get('data') or {}).get('share_code')}")
                    break
            except Exception:             # noqa: BLE001
                pass
        time.sleep(2)
    log(f"  ── 翻牌结束 +{got} 秒 VIP（≈{got / 86400:.2f} 天）──")
    return got


def holiday_assist(share_code):
    log(f"  ── 翻牌助力 {share_code} ──")
    try:
        r = concepts_api("/v1/holiday_card/assist",
                         data={"share_code": share_code}, method="POST")
        log(f"    {'✓' if resp_ok(r) else '·'} "
            f"{'' if resp_ok(r) else resp_err(r)}")
        return r
    except Exception as e:                # noqa: BLE001
        log(f"    ! 异常: {e}")
        return None


# ============================================================================
#  ★ 福利中心（从 v2 整合：邀请 / 抽奖 / 盲盒 / 新人VIP / 听歌VIP）
# ============================================================================
WELFARE_READ = [
    ("/v1/invite/share_act_info", None, "GET"),
    ("/v1/invite/award_tips", {"show_box": 1}, "GET"),
    ("/v2/invite/award_list", {"last_id": 0}, "GET"),
    ("/v1/invite/get_invitation_code", None, "GET"),
    ("/v1/invite/get_user_invite_list", {"last_id": 0}, "GET"),
    ("/v1/invite/rank_list", {"is_prev": 0}, "GET"),
    ("/v5/user/get_account_stat", {"supper_sign": 0}, "GET"),
    ("/v1/activity/get_listen_song_task", {"source_id": 18, "get_stats": 1}, "GET"),
    ("/v1/ad/get_ad_vip_time", None, "GET"),
    ("/v1/free_package/get_vip_task", None, "GET"),
    ("/v1/popup/check_popup", None, "GET"),
]

ID_KEYS = {"box_id", "bsid", "period_id", "record_id",
           "invitation_code", "free_state", "is_new_user", "award_id"}

# 新人 VIP 各期（get_account_stat 的 signin_list 挖出 period_id）
VIP_PERIOD_IDS = [14, 16, 18, 20]


def find_values(obj, names, out=None, depth=0):
    if out is None:
        out = {}
    if depth > 8:
        return out
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in names and not isinstance(v, (dict, list)):
                out.setdefault(k, [])
                if v not in out[k]:
                    out[k].append(v)
            find_values(v, names, out, depth + 1)
    elif isinstance(obj, list):
        for x in obj:
            find_values(x, names, out, depth + 1)
    return out


def welfare_scan():
    log("  ── 福利中心扫描 ──")
    got = {}
    for path, params, method in WELFARE_READ:
        try:
            r = youth_api(path, params=params, method=method)
            got[path] = r
            if resp_ok(r):
                d = r.get("data")
                brief = (",".join(list(d.keys())[:8]) if isinstance(d, dict)
                         else f"list[{len(d)}]" if isinstance(d, list) else "")
                log(f"    ✓ {path}  {brief}")
            else:
                log(f"    · {path}  {resp_err(r)}")
        except Exception as e:            # noqa: BLE001
            log(f"    ! {path} 异常: {e}")
        time.sleep(float(CFG.get("welfare_sleep", 1)))
    return got


def welfare_claim(scan):
    """自动领取福利中心所有可拿的（盲盒/抽奖/排行榜/新人VIP/任务上报）"""
    ids = {}
    for path, r in scan.items():
        for k, vals in find_values(r, ID_KEYS).items():
            ids.setdefault(k, [])
            for v in vals:
                if v not in ids[k]:
                    ids[k].append(v)
    log(f"    发现 id: { {k: v[:3] for k, v in ids.items()} }")

    # 1) 分享任务上报（无 body，首抽给 vip3h；已抽报 161003 不影响）
    try:
        r = youth_api("/v1/invite/task_report", method="POST")
        if resp_ok(r):
            log(f"    ✓ task_report: {json.dumps(r.get('data'), ensure_ascii=False)[:120]}")
        else:
            log(f"    · task_report: {resp_err(r)}")
    except Exception as e:                # noqa: BLE001
        log(f"    ! task_report 异常: {e}")
    time.sleep(1)

    # 2) 新人免费 VIP（按期领，已领报 232005 自动跳过）
    try:
        r = youth_api("/v5/user/get_account_stat", params={"supper_sign": 0})
        if resp_ok(r):
            signin = ((r.get("data") or {}).get("signin_list") or [])
            for s in signin:
                if int(s.get("receive_status") or 0) == 0 and s.get("period_id"):
                    rr = youth_api("/v1/activity/receive_new_user_vip",
                                   data={"period_id": s["period_id"]}, method="POST")
                    ok = resp_ok(rr)
                    log(f"    {'✓' if ok else '·'} 新人VIP period={s['period_id']}"
                        f" {'' if ok else resp_err(rr)}")
                    time.sleep(1)
    except Exception as e:                # noqa: BLE001
        log(f"    ! 新人VIP 异常: {e}")

    # 3) 开盲盒（有 box_id 才有效）
    for box in ids.get("box_id", [])[:10]:
        if not box:
            continue
        try:
            r = youth_api("/v1/invite/open_blind_box",
                          params={"box_id": box}, method="POST")
            log(f"    {'✓' if resp_ok(r) else '·'} 盲盒 {box}"
                f" {'' if resp_ok(r) else resp_err(r)}")
        except Exception as e:            # noqa: BLE001
            log(f"    ! 盲盒异常: {e}")
        time.sleep(1)

    # 4) 抽奖（act_id=352，需邀请获得机会；无资格报「没有资格抽奖」自动跳过）
    for bsid in ids.get("bsid", [])[:10]:
        if not bsid:
            continue
        try:
            r = youth_api("/v1/lottery/draw",
                          params={"act_id": YOUTH_ACT_ID},
                          data={"bsid": bsid}, method="POST")
            log(f"    {'✓' if resp_ok(r) else '·'} 抽奖 {bsid}"
                f" {'' if resp_ok(r) else resp_err(r)}")
        except Exception as e:            # noqa: BLE001
            log(f"    ! 抽奖异常: {e}")
        time.sleep(1)

    # 5) 排行榜奖励（上榜才有资格）
    try:
        r = youth_api("/v1/invite/receive_rank_award", method="POST")
        if resp_ok(r):
            log(f"    ✓ 排行榜奖励: {json.dumps(r.get('data'), ensure_ascii=False)[:120]}")
        else:
            log(f"    · 排行榜奖励: {resp_err(r)}")
    except Exception as e:                # noqa: BLE001
        log(f"    ! 排行榜异常: {e}")


def welfare_flow():
    """福利中心：扫描 → 自动领取"""
    scan = welfare_scan()
    welfare_claim(scan)


def listen_song_report():
    """
    听歌上报（2006 的判定通道）：
    POST /youth/v2/report/listen_song  body {"mixsongid": N}
    实测：合法歌曲 status=1；重复报 30002；非法 id 130012。
    领 2006 前先报 1~2 首真实歌曲提高判定通过率。
    """
    # 常驻热门歌曲 mixsongid（真实存在的曲库 id）
    songs = [937093, 3146767, 116505, 6015206, 967613]
    ok = 0
    for sid in songs[:2]:
        try:
            r = youth_api("/v2/report/listen_song",
                          data={"mixsongid": sid}, method="POST")
            if resp_ok(r):
                ok += 1
        except Exception:                 # noqa: BLE001
            pass
        time.sleep(1)
    if ok:
        log(f"    ✓ 听歌上报 {ok} 次")
    return ok


# ============================================================================
#  信息展示
# ============================================================================
def show_info():
    acc = get_account()
    a = acc.get("account") or {}
    log(f"  余额 : {a.get('balance_coins')} 金币 "
        f"(≈ {float(a.get('cash') or 0):.2f} 元)")
    log(f"  累计 : {a.get('total_coins')}")
    st = get_sign_state()
    today = next((x for x in st.get("list", []) if x.get("today") == 1), None)
    log(f"  签到 : {'今日已签' if today and today.get('state') != 0 else '今日未签'}")
    infos = get_infos()
    ts = int(infos["data"].get("ts") or time.time())
    log("  任务:")
    for t in infos["data"].get("tasks", []):
        pr, s = t.get("profile") or {}, t.get("state") or {}
        tid = pr.get("taskid")
        done = int(s.get("done_count") or 0)
        cap = int(s.get("max_done_count") or 0)
        flag = "可领" if (not cap or done < cap) else "已满"
        extra = ""
        if tid == 1105 and s.get("next_award_time"):
            left = int(s["next_award_time"]) - ts
            if left > 0:
                extra = f"  冷却 {left // 60}m{left % 60}s"
        log(f"        [{tid:>6}] {str(pr.get('name', ''))[:14]:<14} "
            f"{done}/{cap} {flag}{extra}")


def self_test():
    p = {"appid": "3116", "clientver": "11571",
         "dfid": "1J9A8J1ZDCDy4OPWYB4Yj6c2",
         "mid": "117031343721896449724314978024697721034",
         "srcappid": "2919", "token": "T", "userid": "2247744797", "uuid": "-"}
    got = make_sign(p)
    sample = ("appid=3116clientver=11571dfid=1J9A8J1ZDCDy4OPWYB4Yj6c2"
              "mid=117031343721896449724314978024697721034srcappid=2919"
              "token=Tuserid=2247744797uuid=-")
    expect = hashlib.md5((SALT + sample + SALT).encode()).hexdigest()
    if got != expect:
        log(f"  ✗ 签名实现异常")
        return False
    log(f"  ✓ 签名自检通过: {got}")
    return True


# ============================================================================
#  入口

def send_notify(title, content):
    """青龙多渠道本地通知三级兜底：青龙内置 notify -> 同目录 SendNotify.py -> 控制台打印"""
    notified = False

    # 1. 青龙内置 notify.send
    try:
        from notify import send as _ql_send  # type: ignore
        _ql_send(title, content)
        log(f"📮 通知已推送（青龙内置 notify）: {title}")
        notified = True
    except Exception:
        pass

    # 2. 同目录 / 运行目录 SendNotify.py
    if not notified:
        try:
            import SendNotify as _sn
            _fn = (getattr(_sn, "send_push_notification", None)
                   or getattr(_sn, "sendNotify", None)
                   or getattr(_sn, "send", None))
            if _fn:
                _fn(title, content)
                log(f"📮 通知已推送（SendNotify.py）: {title}")
                notified = True
        except Exception:
            pass

    if not notified:
        for _dir in dict.fromkeys([str(Path(__file__).resolve().parent), os.getcwd()]):
            if not _dir or not os.path.isdir(_dir):
                continue
            p = os.path.join(_dir, "SendNotify.py")
            if not os.path.exists(p):
                continue
            try:
                if _dir not in sys.path:
                    sys.path.insert(0, _dir)
                import importlib
                _mod = importlib.import_module("SendNotify")
                _fn = (getattr(_mod, "send_push_notification", None)
                       or getattr(_mod, "sendNotify", None)
                       or getattr(_mod, "send", None))
                if _fn:
                    _fn(title, content)
                    log(f"📮 通知已推送（SendNotify.py）: {title}")
                    notified = True
                    break
            except Exception:
                pass

    return notified

# ============================================================================
def run_account(acc, mode, bind_code=None):
    set_current_account(acc)
    reset_budget(acc)                   # v3.6: 每账号每日目标与计数
    log(f"━━━ 账号 [{acc['remark']}] userid={acc['userid']} 目标 {target_desc()} ━━━")
    res = {
        "remark": acc.get("remark", ""),
        "userid": acc.get("userid", ""),
        "ok": False,
        "before": 0,
        "after": 0,
        "gain": 0,
        "task_coins": 0,
        "loop_coins": 0,
        "err": ""
    }

    if mode == "info":
        show_info()
        res["ok"] = True
        return res
    if mode == "once":
        pass  # --once：只跑一轮，进入下方通用流程（不进 1105 循环）
    elif mode == "flip":
        if not self_test():
            res["err"] = "签名自检失败"
            raise RuntimeError("签名自检失败")
        holiday_flip()
        res["ok"] = True
        return res
    if mode == "assist":
        if bind_code:
            holiday_assist(bind_code)
            res["ok"] = True
        else:
            log("  ! --assist 需要 share_code 参数")
            res["err"] = "缺少 share_code 参数"
        return res
    if mode == "welfare":
        if not self_test():
            res["err"] = "签名自检失败"
            raise RuntimeError("签名自检失败")
        welfare_flow()
        res["ok"] = True
        return res

    if not self_test():
        res["err"] = "签名自检失败"
        raise RuntimeError("签名自检失败")

    try:
        acc0 = get_account()
        before = int((acc0.get("account") or {}).get("balance_coins") or 0)
        res["before"] = before
        log(f"  起始金币: {before}")
    except Exception as e:                # noqa: BLE001
        log(f"  ! 读取余额失败(账号可能失效): {e}")
        res["err"] = f"读取余额失败(Token失效): {e}"
        return res

    # 听歌上报（2006 判定通道，领任务前先报）
    try:
        listen_song_report()
    except Exception as e:                # noqa: BLE001
        log(f"  ! 听歌上报异常(忽略): {e}")

    # 福利中心（盲盒/新人VIP/task_report 的 vip3h）
    try:
        welfare_flow()
    except Exception as e:                # noqa: BLE001
        log(f"  ! 福利中心异常(忽略): {e}")

    try:
        task_coins = collect_tasks()
        res["task_coins"] = task_coins or 0
    except Exception as e:                # noqa: BLE001
        log(f"  ! 任务流程异常: {e}")

    # ★ 1105 循环（默认必跑：等冷却逐次领到当日 35 次满，全程约 6 小时）
    #   --once 可跳过（只做一轮任务）
    if mode not in ("once", "tasks_only"):
        try:
            loop_coins = loop_1105()
            res["loop_coins"] = loop_coins or 0
        except Exception as e:            # noqa: BLE001
            log(f"  ! 1105 循环异常: {e}")

    # 翻牌顺手抽（冻结就跳过）
    try:
        holiday_flip()
    except Exception as e:                # noqa: BLE001
        log(f"  ! 翻牌异常: {e}")

    try:
        acc1 = get_account()
        after = int((acc1.get("account") or {}).get("balance_coins") or 0)
        res["after"] = after
        res["gain"] = max(0, after - before)
        res["ok"] = True
        log(f"  结束金币: {after}   本次净增 +{after - before}"
            f"  ({(after - before) / 10000.0:.2f} 元)")
    except Exception as e:                # noqa: BLE001
        log(f"  ! 读取余额失败: {e}")
        res["after"] = before + (res.get("task_coins", 0) + res.get("loop_coins", 0))
        res["gain"] = res["after"] - before
        res["ok"] = True

    res["target"] = int(acc.get("target") or CFG.get("target") or 0)
    res["got"] = int(acc.get("got") or 0)
    return res


def main():
    args = sys.argv[1:]
    aset = set(args)
    mode = "run"
    if "--info" in aset:
        mode = "info"
    elif "--once" in aset:
        mode = "once"
    elif "--flip" in aset:
        mode = "flip"
    elif "--welfare" in aset:
        mode = "welfare"
    elif "--assist" in aset:
        mode = "assist"

    # v3.6: 每日金币目标档位（--target > KGGNB_TARGET/KG_TARGET > 默认 10w）
    raw_target = None
    if "--target" in args:
        _i = args.index("--target")
        if _i + 1 < len(args):
            raw_target = args[_i + 1]
    if raw_target is None:
        for _a in args:
            if _a.startswith("--target="):
                raw_target = _a.split("=", 1)[1]
    if raw_target is None:
        raw_target = (os.environ.get("KGGNB_TARGET")
                      or os.environ.get("KG_TARGET"))
    _target = parse_target(raw_target)
    _warn_target = bool(raw_target) and _target is None
    if _target is None:
        _target = DEFAULT_TARGET
    apply_target(_target)

    # 并发 / 串行参数与环境变量配置（显式 --serial/--parallel 优先于档位默认）
    if "--serial" in aset or os.environ.get("KGGNB_SERIAL") in ("1", "true", "True"):
        CFG["concurrent"] = False
    elif "--parallel" in aset or "--concurrent" in aset:
        CFG["concurrent"] = True

    bind_code = None
    for flag in ("--assist",):
        if flag in args:
            i = args.index(flag)
            if i + 1 < len(args):
                bind_code = args[i + 1]

    log("=" * 62)
    log(" 酷狗概念版 · 任务脚本 v3.6 (每日目标档位 · 多账号收割 · 满链翻倍)")
    log("=" * 62)
    if _warn_target:
        log(f"⚠️ 无法识别的目标值 {raw_target!r}，已回退默认 {DEFAULT_TARGET}")
    log(f"🎯 每日目标: {target_desc()}（每账号，达标即停）")

    accounts = parse_accounts()
    if not accounts:
        log("❌ 未检测到有效的酷狗账号配置！")
        log("   请在青龙环境变量中配置 KGGNB（支持 KGGNB / KGGNB_TASK / kwtx）")
        log("   格式：备注#token#userid#mid#dfid#devid 或 备注#token#userid")
        log("   多账号支持：使用 & 或 换行 分割多个账号")
        send_notify("❌ 酷狗概念版配置错误", "未检测到有效的账号配置！请在青龙环境变量中设置 KGGNB")
        sys.exit(1)

    log(f"共检测到 {len(accounts)} 个有效账号")

    if "--test" in aset:
        sys.exit(0 if self_test() else 1)

    if not acquire_lock():
        log("已有实例在运行，退出")
        sys.exit(0)

    results = []
    try:
        is_concurrent = CFG.get("concurrent", True) and len(accounts) > 1
        if is_concurrent:
            max_w = min(len(accounts), int(CFG.get("max_account_workers", 10)))
            log(f"⚡ 已启用多账号并发执行模式（并发数: {max_w}）")
            with ThreadPoolExecutor(max_workers=max_w) as ex:
                futures = [ex.submit(run_account, acc, mode, bind_code) for acc in accounts]
                for fut in futures:
                    try:
                        res = fut.result()
                        if isinstance(res, dict):
                            results.append(res)
                    except Exception as e:
                        log(f"! 账号并发执行异常: {e}")
        else:
            # 串行模式执行
            log("ℹ️ 采用串行执行模式")
            if mode == "run" and len(accounts) > 1:
                # 多账号串行优化策略：先跑各账号常规任务，再跑 1105，避免前置账号独占 6 小时
                log("⚡ 启动多账号分阶段收割：第一阶段（常规任务全量收割）...")
                for idx, acc in enumerate(accounts, 1):
                    log(f"── 阶段一：账号 {idx}/{len(accounts)} [{acc.get('remark')}] ──")
                    try:
                        r = run_account(acc, "once", bind_code)
                        if isinstance(r, dict): results.append(r)
                    except Exception as e:
                        log(f"! 账号[{acc.get('remark')}] 任务失败: {e}")
                    if idx < len(accounts): time.sleep(random.uniform(1.5, 3.5))

                log("⚡ 启动第二阶段（各账号 1105 循环）...")
                for idx, acc in enumerate(accounts, 1):
                    log(f"── 阶段二：账号 {idx}/{len(accounts)} [{acc.get('remark')}] 1105 循环 ──")
                    set_current_account(acc)
                    try:
                        loop_coins = loop_1105()
                        # 更新 results
                        for r in results:
                            if r.get("userid") == acc.get("userid"):
                                r["loop_coins"] = loop_coins or 0
                                r["gain"] = (r.get("gain") or 0) + (loop_coins or 0)
                                r["after"] = (r.get("after") or r.get("before", 0)) + (loop_coins or 0)
                                # v3.6: 同步每日目标计数（acc 内含阶段一任务收益）
                                r["target"] = int(acc.get("target") or 0)
                                r["got"] = int(acc.get("got") or r.get("got") or 0)
                    except Exception as e:
                        log(f"! 账号[{acc.get('remark')}] 1105 异常: {e}")
            else:
                for idx, acc in enumerate(accounts, 1):
                    log(f"── 账号 {idx}/{len(accounts)} ──")
                    try:
                        r = run_account(acc, mode, bind_code)
                        if isinstance(r, dict): results.append(r)
                    except Exception as e:
                        log(f"! 账号[{acc.get('remark')}] 执行失败: {e}")
                    if idx < len(accounts):
                        time.sleep(random.uniform(2, 5))

        # 统一构建并发送多账号聚合通知报告
        if results and mode in ("run", "once"):
            ok_cnt = sum(1 for r in results if r.get("ok"))
            total_gain = sum(r.get("gain", 0) for r in results)
            title = f"📊 酷狗概念版收益汇总 (成功 {ok_cnt}/{len(results)})"
            lines = [
                "==============================",
                f"🕒 执行时间：{time.strftime('%Y-%m-%d %H:%M:%S')}",
                f"📊 统计数据：成功 {ok_cnt} / 共 {len(results)} 个账号",
                f"🎯 每日目标：{target_desc()}（每账号）",
                f"💰 累计获得：+{total_gain} 金币 (≈ {total_gain / 10000.0:.2f} 元)",
                "==============================",
            ]
            for i, r in enumerate(results, 1):
                ok = r.get("ok", False)
                icon = "🧑‍💻" if ok else "🧟"
                st_icon = "✅" if ok else "❌"
                remark = r.get("remark") or r.get("userid") or f"账号{i}"
                lines.append(f"{icon} 【账号{i}】{remark}")
                if ok:
                    lines.append(f"{st_icon} 状态：任务完成")
                    if r.get("target"):
                        hit = ("✅ 已达标" if int(r.get("got") or 0) >= int(r["target"])
                               else "⏳ 未达标")
                        lines.append(f"🎯 目标：{hit}（{r.get('got', 0)}/{r['target']}）")
                    lines.append(f"💰 金币：始 {r.get('before', 0)} ➔ 终 {r.get('after', 0)} (+{r.get('gain', 0)})")
                    if r.get("task_coins"):
                        lines.append(f"🌾 任务收益：+{r.get('task_coins')} 金币")
                    if r.get("loop_coins"):
                        lines.append(f"⏰ 挂机收益：+{r.get('loop_coins')} 金币")
                else:
                    lines.append(f"{st_icon} 状态：执行异常")
                    lines.append(f"🧨 原因：{r.get('err') or '未完成'}")
                lines.append("------------------------------")
            report_content = "\n".join(lines)
            send_notify(title, report_content)
    finally:
        release_lock()

    log(f"总请求数: {REQ_COUNT}")
    log("全部账号完成。")


if __name__ == "__main__":
    main()

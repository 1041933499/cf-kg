# kgcheckin-cloudflare

酷狗概念版 VIP 自动签到 —— **Cloudflare Workers** 版。

每天北京时间 01:10 自动领取：听歌领 1 天 + 广告领 8 次（每次 30 秒间隔），合计 2 天概念版 VIP。

移植自 [develop202/kgcheckin](https://github.com/develop202/kgcheckin)（GitHub Actions 版），API 层源自 [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi)。

## 与原项目的差异

| | 原项目 (Actions) | 本项目 (Workers) |
|---|---|---|
| 运行环境 | GitHub Actions + Node.js | Cloudflare Workers |
| HTTP 层 | Express 本地服务 + axios | 直接 `fetch`，无服务层 |
| 凭据存储 | GitHub Secret `USERINFO` | Workers KV |
| token 刷新写回 | 需 PAT 写 Secret | 直接写 KV，无需 PAT |
| 登录方式 | Actions 内生成二维码 / 手机号 | 网页扫码，token 存 KV |
| 通知渠道 | 15+ 渐 webhook / SMTP | 无（Workers 不支持 SMTP，网页查看状态） |
| 定时 | `cron` workflow | Cron Trigger |

**免费计划限制**（已按此设计）：cron 每次 10ms CPU、50 个子请求、15 分钟墙钟。账号间并发限制为 3 路，单账号约 15 个子请求，因此约可支持 **3 个账号**。

## 部署（三种方式，任选其一）

三种方式效果完全一样：代码在 Cloudflare 跑、cron 每天北京 01:10 触发、账号 token 存自己的 KV。**都只需要一个免费 Cloudflare 账号，不需要 GitHub Token / Actions / Secret。**

> ⚠️ 大陆网络环境下 `workers.dev` 域名可能无法访问（DNS 污染 / 连接重置）。这不影响 Worker 运行和定时签到，只是网页打不开。可在 Workers 设置里绑定自己的**自定义域名**解决。

### 方案 A（推荐）：Fork + 网页导入，全程零命令行

适合 fork 本仓库的人，以后上游更新点一下 **Sync fork** 即可自动重新部署。

**1. 创建 KV（Cloudflare 面板）**

[Workers & Pages → KV](https://dash.cloudflare.com/?to=/:account/workers/kv) → Create namespace → 名字随意（建议 `KG_KV`）→ 记下它。

**2. Fork 本仓库**

GitHub 本页面右上角 **Fork** → Create fork。

**3. 填入自己的 KV id（GitHub 网页直接改）**

打开你 fork 的仓库 → `wrangler.jsonc` → 点铅笔编辑 → 把

```jsonc
"id": "REPLACE_WITH_KV_NAMESPACE_ID"   // 换成第 1 步创建的 KV id（32 位字符串）
```

→ **Commit changes**。这一步是必须的，否则构建会失败。

**4. 导入部署（Cloudflare 面板）**

[Workers & Pages → Create application → Import a repository](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/import)（Workers Builds）→ 授权并选择你 fork 的仓库 → 构建配置保持默认（识别到 `wrangler.jsonc` 即可）→ Deploy。

cron（`triggers.crons`）和 `nodejs_compat` 标志都写在 `wrangler.jsonc` 里，**随部署自动生效**，无需额外配置。

**5. 完成**

访问 `https://<你的子域>.workers.dev` → `/login` 扫码添加账号。

之后上游有更新：GitHub 上点 **Sync fork** → Cloudflare 侧下一次 push 自动重新部署。

### 方案 B：单文件粘贴，粘 1 次 + 点 3 下

不用 fork、不用命令行，适合快速试玩。代码已打包成自包含单文件：**[`standalone/index.js`](standalone/index.js)**（含全部源码 + `qrcode` 依赖，约 114 KB，无任何密钥/ID）。

**1. 创建 KV**：同方案 A 第 1 步。

**2. 建 Worker**：[Workers & Pages → Create → Start with Hello World](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create) → **Edit code** → 全选删除默认代码，粘贴 `standalone/index.js` 全部内容 → Deploy。

**3. 补 3 项平台配置**（代码里写不了，必须在面板点）：

| 位置 | 操作 |
|---|---|
| Settings → **Bindings & Variables** → Add | KV Namespace，变量名必须是 `KG_KV`，选第 1 步的 namespace |
| Settings → **Triggers** → Cron Triggers | 填 `10 17 * * *` → Add → Deploy |
| Settings → **Compatibility Flags** | 添加 `nodejs_compat` → Deploy |

**4. 完成**：打开 `/login` 扫码。

> 缺任一项的表现：缺 KV → 页面 500/签到不存数据；缺 cron → 不会自动签到；缺 `nodejs_compat` → `/probe` 报错、签到加密失败。
>
> 缺点：源仓库更新后需重新复制粘贴。想长期用请选方案 A 或 C。

### 方案 C：本地 wrangler（开发者方式）

前置：Node.js 20+、Cloudflare 账号。

```bash
git clone https://github.com/<你的用户名>/cf-kg.git && cd cf-kg
npm install

# 1. 创建 KV namespace，把返回的 id 填进 wrangler.jsonc 的 kv_namespaces[0].id
npx wrangler kv namespace create KG_KV

# 2. 登录
npx wrangler login

# 3. 部署（cron 随配置一起生效）
npm run deploy
```

每次改动源码后重新 `npm run deploy` 即可。重新生成方案 B 的单文件：

```bash
npx wrangler deploy --dry-run --outdir standalone
```

### 每日执行时间

`wrangler.jsonc` 中 `triggers.crons`：

```jsonc
// 每天北京时间 01:10 = UTC 17:10（前一天）
"crons": ["10 17 * * *"]
```

改完重新部署生效。方案 C 可用 `npx wrangler triggers deploy` 查看当前远端 cron。

## 使用

1. 打开 `/login`，用**酷狗音乐 APP** 扫码，二维码有效期 2 分钟
2. 扫码成功后 token 自动存入 KV，返回状态页
3. 点「立即签到」可手动触发，页面实时滚动日志
4. 每天 01:10 自动执行，状态页展示各账号听歌领取 / 广告领取次数 / VIP 到期时间
5. 状态页「账号管理」卡片可查看已添加账号（昵称脱敏）并删除；删除后 token 立即从 KV 移除

### 接口

| 路径 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 状态页 |
| `/login` | GET | 扫码登录页 |
| `/api/qr` | POST | 生成二维码，返回 `{key, svg}` |
| `/api/qr/status?key=` | GET | 轮询扫码状态（0 过期 / 1 未扫 / 2 待确认 / 4 成功） |
| `/api/checkin` | POST | 手动签到，流式返回日志 |
| `/api/state` | GET | 最近一次签到结果 JSON |
| `/api/accounts` | GET | 账号列表（脱敏，不含 token） |
| `/api/accounts` | DELETE | 删除账号，body `{"id": "<列表返回的 id>"}` |
| `/probe` | GET | `node:crypto` 可用性探针（md5 / aes / rsa） |

## 金币任务脚本（`scripts/kgcoin.py`）

与签到并行的另一条线：**跑金币**（金币签到、任务收割、1105 挂机、翻牌、盲盒、福利中心）。

脚本运行在**本地或青龙面板**（Python 3.7+，仅标准库），直连酷狗接口——**不经过 Cloudflare Worker，不占用任何 Cloudflare 免费额度**，与本仓库的 Worker 完全独立。

### 每日金币目标档位（v3.6）

原版脚本一天满跑 18W~25W 金币，请求激进容易触发**酷狗风控**。现通过 `--target` 选择「**每个账号每日**获取多少金币」，档位同时决定**达标即停**与**请求节奏**：

| 档位 | 目标 | 请求间隔 | 翻倍链 | 任务9/45/1105 上限 | 多账号 |
|---|---|---|---|---|---|
| `1w` 保守 | 10,000 | 2.5~5s | ≤4 档 | 5 / 2 / 8 轮 | 串行 |
| `10w` 中等（**默认**） | 100,000 | 1.8~3.5s | ≤8 档 | 25 / 8 / 20 轮 | 并发 ≤3 |
| `25w` 激进（原版参数） | 250,000 | 1.2~2.5s | ≤12 档 | 60 / 15 / 35 轮 | 并发 ≤10 |

- 任意自定义值可用（`--target 5w` / `--target 50000`）：按给定数值停止，节奏自动取「不小于目标的最小档」（偏保守）
- 达标后任务与 1105 循环**立即停止**，推送报告标注 ✅已达标 / ⏳未达标
- 统计口径：任务提交 + 1105 循环金币（签到/盲盒等小额不计入，最终可能略微超出目标）

### 用法

```bash
# 本地
python scripts/kgcoin.py --target 1w           # 保守档
python scripts/kgcoin.py --target 25w --info   # 查看账号与任务状态
python scripts/kgcoin.py --test                # 签名自检（无网络）
```

青龙面板：定时 `5 0 * * *`，环境变量两个：

```bash
KGGNB=备注#token#userid    # 账号，多账号用 & 或换行分隔（更多格式见脚本头部注释）
KGGNB_TARGET=1w            # 档位，可省略（默认 10w）
```

支持 `--serial` / `--parallel` 强制串并行（优先于档位默认）。

### GitHub Actions 自动跑（已内置 `.github/workflows/coin.yml`）

不想开电脑时可交给 GitHub 定时执行：每天 **UTC 16:05（北京 00:05，金币 00:00 重置后）** 自动运行；也可在 **Actions → 每日金币任务 → Run workflow** 手动触发，下拉框选档位（1w / 10w / 25w）。

首次使用前在仓库 **Settings → Secrets and variables → Actions** 配置：

| 类型 | 名称 | 值 |
|---|---|---|
| Secret（**必填**） | `KGGNB` | 账号串，多账号用 `&` 或换行分隔 |
| Variable（可选） | `KGGNB_TARGET` | 定时跑的默认档位，不填按 `1w` |

注意：

- 未配置 `KGGNB` 时任务会**失败报错**（故意的，避免静默漏跑）
- fork 后需到 Settings → Actions → General 手动 **Enable actions**；fork 仓库 60 天无提交会自动暂停定时
- Actions 定时任务平台高负载时可能延迟几分钟，正常现象
- 单 job 上限 6 小时：`1w`/`10w` 档（受 `loop1105_max_wait` 封顶）远在限制内；`25w` 满 35 轮挂机可能贴边，建议本地/青龙跑或手动选 `once` 模式

### 风控建议

- 账号较新或已出现风控迹象 → 先用 `1w` 跑几天观察，再逐步升 `10w`
- `25w` 保留原版激进参数，仅建议了解风险后使用
- 金币增长异常变慢 / 接口频繁报错 = 可能被限制，降到低档位并停跑几天

## 项目结构

```
src/
├── index.js          # 入口：HTTP 路由 + scheduled
├── checkin.js        # 签到主流程（验 token → 周日刷新 → 听歌 → 8×广告 → 查到期）
├── store.js          # KV 读写（userinfo / state）
├── pages.js          # 状态页 + 扫码登录页
├── qr-render.js      # 二维码 → SVG
└── kugou/
    ├── config.js     # 平台参数（appid / 签名盐 / RSA 公钥 / AES key）
    ├── crypto.js     # md5 / aes-256-cbc / rsa-no-padding（node:crypto）
    ├── helper.js     # web / android 签名算法
    ├── request.js    # fetch 请求层（签名、默认参数、错误语义）
    └── endpoints.js  # 酷狗接口封装
standalone/
└── index.js          # 方案 B 用：打包好的自包含单文件（由 wrangler --dry-run --outdir 生成）
scripts/
└── kgcoin.py         # 金币任务脚本（本地/青龙运行，独立于 Worker；--target 1w/10w/25w 档位）
```

## 关键实现说明

### `node:crypto` 依赖

加密依赖 `nodejs_compat` 兼容标志提供的 `node:crypto`。`/probe` 路由会校验 md5 / aes / rsa 三项输出与 Node.js 一致，部署后可先访问它确认运行时正常。

### 平台参数（`src/kugou/config.js`）

原仓库未提交 `.env`，其两个 workflow 也**均未设置 `platform`**，即实际以**默认（非 lite）参数**运行：appid 1005、clientver 20489、android 签名盐 `OIlwieks28dk2k092lksi2UIkp`、非 lite RSA 公钥、`/v5/login_by_token`。

本项目与之保持一致。文件中保留了 `IS_LITE` 开关和完整的 lite 参数（appid 3116 等），置为 `true` 可切换。

### 签到流程与错误码

- `130012` = 今日已领取（听歌）
- `30002` = 今日广告次数用光，停止重试
- 周日刷新 token 后写回 KV

### 免费计划子请求预算

单账号约 15 个子请求：验 token 1 + 听歌 1 + 广告 8 + VIP 查询 1 + 杂项。并发固定 3 路，账号数超过 3 时自动排队，避免触发 50 次上限。

## 本地开发

```bash
npm run dev        # http://127.0.0.1:8787
curl -X POST http://127.0.0.1:8787/api/qr   # 生成二维码
```

本地 KV 数据存在 `.wrangler/state/`，已被 gitignore。

## 免责声明

仅供个人学习研究使用，请勿用于商业用途。使用本项目所产生的任何后果由使用者自行承担。请尊重版权，支持正版。

## License

基于原项目移植，版权归原作者所有。

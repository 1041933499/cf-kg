# cf-kg · 酷狗概念版自动签到 + 每日金币

两条**互相独立**的自动化线，可只用其一，也可都用：

| | ① VIP 签到 | ② 每日金币 |
|---|---|---|
| 做什么 | 听歌领 1 天 + 广告领 8×30s，每天净得 **2 天**概念版 VIP | 金币签到、任务收割、1105 挂机、翻倍链、翻牌、盲盒 |
| 跑在哪 | **Cloudflare Workers**（Cron Trigger） | **GitHub Actions** / 本地 / 青龙面板 |
| 代码 | `src/`（`standalone/index.js` 为单文件版） | `scripts/kgcoin.py` |
| 账号存哪 | Workers KV（网页扫码写入） | 仓库 Secret `KGGNB`（或环境变量） |
| 依赖 | 一个免费 Cloudflare 账号 | Python 3.7+（仅标准库） |
| 消耗额度 | CF 免费额度 | 不占 CF 任何额度 |

> 两者**不共享账号数据**：Worker 的账号在你的 KV 里，金币脚本的账号在 `KGGNB` 里。同一个酷狗账号可以两边都加，互不影响（Worker 只做签到，金币脚本只跑金币）。

移植自 [develop202/kgcheckin](https://github.com/develop202/kgcheckin)（Actions 版），API 层参考 [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi)。

---

## 目录

- [一、VIP 签到（Cloudflare Workers）](#一vip-签到cloudflare-workers)
  - [部署方式 A：Fork + 网页导入](#方式-afork--网页导入推荐全程零命令行)
  - [部署方式 B：单文件粘贴](#方式-b单文件粘贴)
  - [部署方式 C：本地 wrangler](#方式-c本地-wrangler)
  - [使用与接口](#使用)
- [二、每日金币任务](#二每日金币任务)
  - [目标档位](#每日金币目标档位)
  - [GitHub Actions 自动跑](#github-actions-自动跑)
  - [本地 / 青龙](#本地--青龙面板)
  - [风控建议](#风控建议)
- [三、添加账号（扫码）](#三添加账号扫码)
- [四、项目结构](#四项目结构)
- [五、关键实现说明](#五关键实现说明)
- [六、本地开发](#六本地开发)
- [七、常见问题](#七常见问题)
- [免责声明与 License](#免责声明)

---

# 一、VIP 签到（Cloudflare Workers）

每天北京时间 **01:10** 自动领取：听歌领 1 天 + 广告领 8 次（每次间隔 30 秒）。

**免费计划限制**（已按此设计）：cron 每次 10ms CPU、50 个子请求、15 分钟墙钟。账号间并发固定 3 路，单账号约 15 个子请求，所以约可支持 **3 个账号**。

## 与原项目的差异

| | 原项目（Actions） | 本项目（Workers） |
|---|---|---|
| 运行环境 | GitHub Actions + Node.js | Cloudflare Workers |
| HTTP 层 | Express 本地服务 + axios | 直接 `fetch`，无服务层 |
| 凭据存储 | GitHub Secret `USERINFO` | Workers KV |
| token 刷新写回 | 需 PAT 写 Secret | 直接写 KV，无需 PAT |
| 登录方式 | Actions 内生成二维码 / 手机号 | 网页扫码，token 存 KV |
| 通知渠道 | 15+ webhook / SMTP | 无（Workers 不支持 SMTP，网页看状态） |
| 定时 | `cron` workflow | Cron Trigger |

---

## 部署（三种方式，任选其一）

三种方式效果完全一样：代码在 Cloudflare 跑、cron 每天北京 01:10 触发、token 存自己的 KV。**都只需要一个免费 Cloudflare 账号，不需要 GitHub Token / Actions / Secret。**

> ⚠️ 大陆网络下 `workers.dev` 域名可能无法访问（DNS 污染 / 连接重置）。这不影响 Worker 运行和定时签到，只是网页打不开。绑定**自定义域名**即可解决。

### 方式 A：Fork + 网页导入（推荐，全程零命令行）

适合 fork 本仓库的人，以后上游更新点一下 **Sync fork** 即自动重新部署。

**1. 创建 KV**

[Workers & Pages → KV](https://dash.cloudflare.com/?to=/:account/workers/kv) → Create namespace → 名字随意（建议 `KG_KV`）→ 记下它。

**2. Fork 本仓库**

GitHub 页面右上角 **Fork** → Create fork。

**3. 填入自己的 KV id（GitHub 网页直接改）**

打开你 fork 的仓库 → `wrangler.jsonc` → 铅笔编辑 → 把

```jsonc
"id": "REPLACE_WITH_KV_NAMESPACE_ID"   // 换成第 1 步创建的 KV id（32 位字符串）
```

→ **Commit changes**。这一步必须做，否则构建失败。

**4. 导入部署**

[Workers & Pages → Create → Import a repository](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/import) → 授权并选你 fork 的仓库 → 构建配置保持默认（识别 `wrangler.jsonc`）→ Deploy。

cron（`triggers.crons`）和 `nodejs_compat` 标志都写在 `wrangler.jsonc` 里，**随部署自动生效**。

**5. 完成**

访问 `https://<你的子域>.workers.dev` → `/login` 扫码添加账号。

之后上游有更新：GitHub 点 **Sync fork** → Cloudflare 自动重新部署。

### 方式 B：单文件粘贴

不用 fork、不用命令行。代码已打包成自包含单文件：**[`standalone/index.js`](standalone/index.js)**（含全部源码 + `qrcode` 依赖，约 114 KB，无任何密钥/ID）。

**1. 创建 KV**：同方式 A 第 1 步。

**2. 建 Worker**：[Workers & Pages → Create → Start with Hello World](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create) → **Edit code** → 全选删除默认代码，粘贴 `standalone/index.js` 全部内容 → Deploy。

**3. 补 3 项平台配置**（代码写不了，必须面板点）：

| 位置 | 操作 |
|---|---|
| Settings → **Bindings & Variables** → Add | KV Namespace，变量名必须是 `KG_KV`，选第 1 步的 namespace |
| Settings → **Triggers** → Cron Triggers | 填 `10 17 * * *` → Add → Deploy |
| Settings → **Compatibility Flags** | 添加 `nodejs_compat` → Deploy |

**4. 完成**：打开 `/login` 扫码。

> 缺任一项的表现：缺 KV → 页面 500 / 签到不存数据；缺 cron → 不会自动签到；缺 `nodejs_compat` → `/probe` 报错、签到加密失败。
>
> 缺点：上游更新后需重新复制粘贴。想长期用请选 A 或 C。

### 方式 C：本地 wrangler

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

改动源码后重新 `npm run deploy`。重新生成方案 B 的单文件：

```bash
npx wrangler deploy --dry-run --outdir standalone
```

### 每日执行时间

```jsonc
// wrangler.jsonc：每天北京时间 01:10 = UTC 17:10（前一天）
"crons": ["10 17 * * *"]
```

改完重新部署生效。`npx wrangler triggers deploy` 可查看当前远端 cron。

## 使用

1. 打开 `/login`，用**酷狗音乐 APP** 扫码，二维码有效期 2 分钟
2. 扫码成功后 token 自动存入 KV，跳到状态页
3. 点「立即签到」可手动触发，页面实时滚动日志
4. 每天 01:10 自动执行；状态页展示各账号听歌领取 / 广告领取次数 / VIP 到期时间
5. 「账号管理」卡片可查看已添加账号（昵称脱敏）并删除，删除后 token 立即从 KV 移除

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

---

# 二、每日金币任务

`scripts/kgcoin.py`：金币签到、任务收割、1105 挂机、翻倍链、翻牌、盲盒、福利中心。

运行在 **GitHub Actions / 本地 / 青龙面板**（Python 3.7+，**仅标准库**），直连酷狗接口——**不经过 Cloudflare Worker，不占任何 CF 额度**。

## 每日金币目标档位

原版脚本一天满跑 18W~25W 金币，请求激进容易触发**酷狗风控**。现用 `--target` 选择「**每个账号每日**获取多少金币」，档位同时决定**达标即停**与**请求节奏**：

| 档位 | 目标 | 请求间隔 | 翻倍链 | 任务 9/45/1105 上限 | 多账号 |
|---|---|---|---|---|---|
| `1w` 保守 | 10,000 | 2.5~5s | ≤4 档 | 5 / 2 / 8 轮 | 串行 |
| `10w` 中等（脚本默认） | 100,000 | 1.8~3.5s | ≤8 档 | 25 / 8 / 20 轮 | 并发 ≤3 |
| `25w` 激进（原版参数） | 250,000 | 1.2~2.5s | ≤12 档 | 60 / 15 / 35 轮 | 并发 ≤10 |

- 任意自定义值可用（`--target 5w` / `--target 50000`）：按给定数值停止，节奏自动取「不小于目标的最小档」（偏保守）
- 达标后任务与 1105 循环**立即停止**，报告标注 ✅ 已达标 / ⏳ 未达标
- 统计口径：任务提交 + 1105 循环金币（签到/盲盒等小额不计入，最终可能略微超出目标）
- `--serial` / `--parallel` 可强制串行/并发（优先于档位默认）

## GitHub Actions 自动跑

已内置 [`.github/workflows/coin.yml`](.github/workflows/coin.yml)：每天 **UTC 16:05（北京 00:05，金币 00:00 重置后）** 自动运行；也可 **Actions → 每日金币任务 → Run workflow** 手动触发，下拉选**档位**和**模式**（`full` 完整含 1105 挂机 / `once` 只跑一轮 / `info` 仅查看状态）。

配置（仓库 **Settings → Secrets and variables → Actions**）：

| 类型 | 名称 | 值 |
|---|---|---|
| Secret（**必填**） | `KGGNB` | 账号串，多账号用 `&` 或换行分隔 |
| Variable（可选） | `KGGNB_TARGET` | 定时跑的默认档位，不填按 `1w` |

注意：

- 未配置 `KGGNB` 时任务**直接失败报错**（故意的，避免静默漏跑）
- fork 后需到 Settings → Actions → General 手动 **Enable actions**；fork 仓库 60 天无提交会自动暂停定时
- Actions 定时在高负载时可能延迟几分钟到十几分钟，属正常现象
- 单 job 上限 6 小时：`1w` / `10w` 档远在限制内；`25w` 满 35 轮挂机可能贴边，建议本地/青龙跑或手动选 `once`

## 本地 / 青龙面板

```bash
python scripts/kgcoin.py --target 1w            # 保守档
python scripts/kgcoin.py --target 10w --info    # 查看账号与任务状态（不跑任务）
python scripts/kgcoin.py --target 10w --once    # 只跑一轮任务，不挂机 1105
python scripts/kgcoin.py --test                 # 签名自检（无网络）
```

青龙面板：定时 `5 0 * * *`，环境变量：

```bash
KGGNB=备注#token#userid    # 账号，多账号用 & 或换行分隔
KGGNB_TARGET=1w            # 档位，可省略（默认 10w）
```

单账号支持的格式（详见脚本头部注释）：

```text
备注#token#userid#mid#dfid#devid[#t2][#uni_verify_str]   # 标准
备注#token#userid                                        # 简写，缺的设备字段自动推导
token#userid                                             # 最简
token=xxx;userid=yyy;mid=zzz...                          # 键值对
```

> 只有 `备注#token#userid` 三个字段也能跑——缺的 `mid/dfid` 由脚本算法补齐。扫码登录直接产出的就是这个三字段格式。

## 风控建议

- 账号较新或已出现风控迹象 → 先用 `1w` 跑几天观察，再逐步升 `10w`
- `25w` 保留原版激进参数，仅建议了解风险后使用
- 金币增长异常变慢 / 接口频繁报错 = 可能被限制，降到低档位并停跑几天

---

# 三、添加账号（扫码）

不用抓包找 token——用**酷狗概念版 APP** 扫码即可拿到账号串（`备注#token#userid`），也就是金币脚本要的 `KGGNB`。

## 方式 A：在 Actions 里扫码（Fork 用户推荐，无需本地环境）

**一次性前置**（只需做一次）：

1. 创建 classic 令牌（**只勾 `repo` 即可**）：<https://github.com/settings/tokens/new>
2. 仓库 **Settings → Secrets and variables → Actions → New repository secret**：Name = `KGGNB_PAT`，Value = 令牌

> 为什么需要它：GitHub 的 Secret **写入后不可读回**，只能由持有令牌的程序覆盖写入，所以要给它一个能写 Secret 的令牌。它只用于最后一步 `gh secret set KGGNB`。

**每次加账号**：

1. **Actions → 扫码登录添加账号 → Run workflow**（可填账号备注）
2. 打开本次运行页面 → **Summary** 标签里就是二维码图片（PNG，直接显示）
   - 也可用日志「发布二维码图片」步骤里打印的**图片直链**，浏览器打开就是 PNG（不是压缩包）
3. 用【酷狗概念版 APP】扫码 → 手机确认
4. 流水线自动完成剩下的：

```text
校验账号（只读 --info） → 写入 Secret KGGNB → 完成
```

5. 之后等每天 00:05 自动跑，或去 **每日金币任务 → Run workflow → mode=info** 手动验证一次

**安全设计**：

- 运行日志/摘要公开，所以账号串（token）**只写入文件并直接进 Secret，绝不打印**
- 二维码约 2 分钟有效、单次有效；过期就重新 Run workflow 出新码
- 二维码 PNG 被推到独立分支 `qr-image`（单文件、每次强制覆盖），直链用 **commit SHA** 定位，避免 CDN 缓存扫到上一轮的过期码
- 他人扫到只会把 TA 自己的账号写进来（无利可图），重跑覆盖即可
- 私有仓库 fork 无法用 raw 直链（需登录），请用运行页底部 **Artifacts → login-qr → qr.png**

## 方式 B：本地扫码

```bash
pip install qrcode                      # 可选：装了才有终端字符二维码 + 更清晰
python scripts/kglogin.py               # 出码并等待扫码，过期自动换码
python scripts/kglogin.py --remark 小号  # 自定义备注
```

终端会打印全块字符二维码，并把 PNG 存到 `scripts/kg_login_qr.png`（双击打开用 APP 扫）。扫码成功后终端直接输出账号串，粘进 Secret `KGGNB` 即可。

## 多账号

- **方式 B 多次扫码**，把每段用 `&` 拼接后整体粘贴进 `KGGNB`（推荐做法）
- 方式 A 只能**覆盖**单个账号（Secret 不可读回，没法追加）
- 金币脚本内部按 `&` 或换行拆分，自动串行/并发

> 扫码流程与网页登录同款（`login-user.kugou.com` 二维码接口），拿到的 token 就是金币脚本可用的登录态。Worker 侧的 `/login` 是另一套 KV 存储，和 `KGGNB` 相互独立。

---

# 四、项目结构

```text
src/
├── index.js            # 入口：HTTP 路由 + scheduled
├── checkin.js          # 签到主流程（验 token → 周日刷新 → 听歌 → 8×广告 → 查到期）
├── store.js            # KV 读写（userinfo / state）
├── pages.js            # 状态页 + 扫码登录页
├── qr-render.js        # 二维码 → SVG
└── kugou/
    ├── config.js       # 平台参数（appid / 签名盐 / RSA 公钥 / AES key）
    ├── crypto.js       # md5 / aes-256-cbc / rsa-no-padding（node:crypto）
    ├── helper.js       # web / android 签名算法
    ├── request.js      # fetch 请求层（签名、默认参数、错误语义）
    └── endpoints.js    # 酷狗接口封装
standalone/
└── index.js            # 方案 B 用：打包好的自包含单文件
scripts/
├── kgcoin.py           # 金币任务（Actions/本地/青龙，独立于 Worker；--target 档位）
└── kglogin.py          # 扫码取号（本地交互 / Actions 的 --create + --poll）
.github/workflows/
├── coin.yml            # 每日金币定时（北京 00:05，默认 1w）
└── qr.yml              # Actions 内扫码 → 校验 → 写入 Secret KGGNB
wrangler.jsonc          # Worker 部署配置（KV 绑定 / cron / 兼容标志）
```

---

# 五、关键实现说明

### `node:crypto` 依赖

加密依赖 `nodejs_compat` 提供的 `node:crypto`。`/probe` 会校验 md5 / aes / rsa 三项输出与 Node.js 一致，部署后先访问它确认运行时正常。

### 平台参数（`src/kugou/config.js` / `scripts/kgcoin.py` 已对齐）

原仓库未提交 `.env`，两个 workflow 也**均未设置 `platform`**，即实际以**默认（非 lite）参数**运行：appid **1005**、clientver **20489**、android 签名盐 `OIlwieks28dk2k092lksi2UIkp`、非 lite RSA 公钥、`/v5/login_by_token`。

本项目与之保持一致。`config.js` 里保留了 `IS_LITE` 开关和完整 lite 参数（appid 3116 等），置 `true` 可切换。

> 金币脚本 v3.7 起同样改用这组默认参数，并**移除** `srcappid` / `clienttoken`（服务端按固定参数集验签，多带必报 `20006`）。用 lite 参数会得到 `11002 请先登录`。

### 签到流程与错误码

- `130012` = 今日已领取（听歌）
- `30002` = 今日广告次数用光，停止重试
- `20006` = 签名错误（参数集不匹配，见上）
- `11002` = 未登录（token 失效，或平台参数用错）
- 周日刷新 token 后写回 KV

### 免费计划子请求预算

单账号约 15 个子请求：验 token 1 + 听歌 1 + 广告 8 + VIP 查询 1 + 杂项。并发固定 3 路，账号数超过 3 时排队，避免触发 50 次上限。

---

# 六、本地开发

```bash
npm run dev        # http://127.0.0.1:8787
curl -X POST http://127.0.0.1:8787/api/qr   # 生成二维码
```

本地 KV 数据在 `.wrangler/state/`，已被 gitignore。

> 安全：**不要把本地的真实 KV id、`KGGNB` 账号串提交到仓库**。`wrangler.jsonc` 里提交的应是占位符 `REPLACE_WITH_KV_NAMESPACE_ID`。

---

# 七、常见问题

**Q：Summary 里没有二维码 / 日志里没有直链？**
看「发布二维码图片」这一步是否成功。失败通常是 `permissions: contents: write` 被改掉，或仓库禁用了 Actions 写权限（Settings → Actions → General → Workflow permissions 选 Read and write）。

**Q：二维码扫不出来？**
用运行页 **Summary** 里那张图，或复制日志里的 `raw.githubusercontent.com/.../qr.png` 直链在浏览器打开（点开就是 PNG 原图，不经过压缩包）。别用截图缩略图。

**Q：二维码过期了？**
2 分钟有效。重新 **Run workflow** 即可，会生成新码与新直链。

**Q：写入 Secret 那步失败（403 / 401）？**
`KGGNB_PAT` 权限不足或已过期。重新建 classic 令牌（勾 `repo`），覆盖 Secret `KGGNB_PAT`。`gh secret set` 只需要 `repo` 范围，不需要 `workflow`。

**Q：金币脚本报 `11002 请先登录`？**
平台参数用错（lite 参数）或 token 失效。确认用仓库里的 v3.7 脚本，并重新扫码取号。

**Q：`workers.dev` 打不开？**
大陆网络常见，不影响后台签到。绑定自定义域名解决。

**Q：fork 后定时任务不跑？**
Settings → Actions → General → **Enable actions**；fork 仓库 60 天无提交会自动暂停定时，随便提交一次即恢复。

---

# 免责声明

仅供个人学习研究使用，请勿用于商业用途。使用本项目所产生的任何后果由使用者自行承担。请尊重版权，支持正版。

# License

基于原项目移植，版权归原作者所有。

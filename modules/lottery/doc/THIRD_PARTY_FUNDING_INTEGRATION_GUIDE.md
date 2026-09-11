# 去中心化彩票协议第三方出入金对接文档

> 文档版本：1.2
>
> 更新时间：2026-09-11
>
> 当前环境：Polygon Mainnet Mock，Chain ID `137`
>
> 适用对象：第三方钱包、游戏平台、聚合前端和技术服务商

本版按当前 Backend 路由、Reserve 合约和 Indexer 查询实现核对。文中将“已实现接口”和“第三方需要实现的状态管理”分开说明；示例请求不包含可用签名、API Key 或真实授权。

快速阅读：接入前先读第 1–3 节；充值实现看第 4–5 节，提现看第 6 节；查询/扫链看第 7 节；跨域与错误恢复看第 8–10 节；完整联调样例见第 15 节。

## 1. 文档目的

本文档说明第三方如何为用户接入去中心化彩票协议的充值、余额查询、提现和出入金记录查询能力。

本文档只描述用户资金入口，不描述购票、开奖、Partner 返佣和后台资金管理。

接入结论：**充值需要调用协议的授权接口，但不需要把资金交给 Backend；提现直接调用合约，不需要申请充值授权。** SDK 可选，第三方可以使用公开 ABI 自行接入。

### 1.1 最短接入路径

1. 获取当前 Manifest 和支持代币，确认网络、Reserve 和 Ledger 地址。
2. 用户钱包授权 Reserve 扣除本次充值代币，等待 Approve 确认。
3. 第三方请求 `POST /backend/api/v1/deposit-authorizations`，取得协议签发的授权。
4. 用户钱包签署并发送 Reserve 的 `deposit` 交易。
5. 核验交易回执和当前 Reserve 的 `Deposited` 事件，再展示实际到账余额。

| 操作 | 调用对象 | 是否需要用户链上交易 |
| --- | --- | --- |
| 获取部署信息 | `GET /indexer/v1/protocol/manifest` | 否 |
| 获取代币列表 | `GET /backend/api/v1/tokens` | 否 |
| 申请充值授权 | `POST /backend/api/v1/deposit-authorizations` | 否，由协议签发风控授权 |
| 代币授权 | 代币合约 `approve` | 是，已有足够 allowance 时跳过 |
| 充值到账 | Reserve `deposit` | 是 |
| 提现 | Reserve `withdraw` | 是 |
| 查询余额与历史 | Indexer 或链上只读调用 | 否 |

以上 HTTP 路径的公共域名为 `https://wf.vip`，详见第 3 节。无需创建 Partner Order、提交交易哈希回调或接入 Webhook。第三方仍应保存交易哈希用于查询回执和排障。

### 1.2 谁签名、谁付款、谁到账

充值涉及三种不同授权，不应混淆：

- ERC-20 Approve：用户允许当前 Reserve 扣取其钱包代币。
- Backend EIP-712 授权：协议授权指定用户在期限内充值不超过指定金额；不是用户登录签名，也不会替用户发送交易。
- 用户交易签名：用户确认链上 Deposit，支付 POL Gas；Reserve 从该交易的 `msg.sender` 扣款，并给同一地址的 Ledger 账户记账。

第三方可以通过自己的 RPC 广播**用户已经签好的交易**，但不能换成第三方自己的普通钱包发送 Deposit 并期望给用户入账。当前接口没有 `depositFor` 接收人参数；只有提现允许单独指定 `recipient`。智能账户集成须保证签名授权中的用户地址等于 Reserve 实际看到的调用地址。

注意钱包能力差异：MetaMask 等浏览器钱包通常通过 `eth_sendTransaction` 完成签名和广播，使用钱包自己的网络设置；第三方网页配置自己的只读 RPC，不代表钱包广播也会走同一个 RPC。只有钱包明确支持导出已签原始交易时，第三方才可用 `eth_sendRawTransaction` 广播。不要假定所有钱包支持 `eth_signTransaction`，也不要为了自行广播向用户索取私钥。

核心边界：

- 充值是用户将自己钱包中的支持代币存入 `StablecoinReserve`，并获得 UnifiedLedger 内部 USD 余额；
- 提现是用户销毁自己的 UnifiedLedger USD 余额，并从 `StablecoinReserve` 收到指定支持代币；
- 充值需要协议 Backend 签发一次性 EIP-712 风控授权；
- 提现不需要 Backend 授权，由用户钱包直接调用合约；
- 第三方不得托管用户私钥，也不需要 Partner API Key；
- 出入金不携带 `partnerCode`，不会产生渠道返佣；渠道归因只发生在购票阶段。

### 1.3 接入职责与授权边界

| 参与方 | 负责 | 不负责 |
| --- | --- | --- |
| 第三方前端/服务端 | 展示金额、查询配置、申请充值授权、构造交易、跟踪结果 | 签发协议风控授权、代替用户控制资金 |
| 用户钱包 | Approve、Deposit、Withdraw 的交易确认与签名 | 自动获得合作商身份 |
| 协议 Backend | 白名单、地址风险筛查、授权额度、nonce 分配、充值 EIP-712 签名 | 接收用户稳定币、替用户提现 |
| StablecoinReserve | 收取支持代币、校验授权、兑入/兑出 Ledger 余额 | 给普通直接转账自动记账 |
| UnifiedLedgerV4 | 维护用户内部 USD/WUSD 余额 | 提供一个可转入钱包的 WUSD ERC-20 代币 |
| Indexer | 根据事件更新余额查询和历史记录 | 决定链上交易是否成功、替代最终性确认 |

| 操作 | 协议 HTTP 接口 | Partner API Key | SIWE 登录 token | 用户钱包交易确认 |
| --- | --- | --- | --- | --- |
| 获取 manifest/支持资产/公开余额历史 | 查询接口 | 不需要 | 不需要 | 不需要 |
| 申请充值授权 | 必需 | 不需要 | 当前不需要 | 此步骤不发链上交易 |
| Approve、Deposit | Deposit 前取得授权；执行走 RPC | 不需要 | 不需要 | 需要 |
| Withdraw | 不需要申请提现授权；直接走 RPC | 不需要 | 不需要 | 需要 |
| 私有通知、合作商私有账单 | 对应私有业务接口，不在本文范围 | 不以 code 替代鉴权 | 需要有效身份及对应权限 | 登录签名不是资金授权 |

第三方商务审批、浏览器 Origin 登记和链上充值权限是不同事项。拿到 `partnerCode` 不会自动进入 CORS 白名单，也不会免除用户充值时的风险筛查。充值和提现不必先创建代理订单。

## 2. 资产模型

### 2.1 三种余额

| 名称 | 所在位置 | 用途 |
| --- | --- | --- |
| 钱包代币余额 | 用户 Polygon 钱包 | 用户直接持有的 mUSDT、mUSDC 或正式环境支持的稳定币 |
| POL 余额 | 用户 Polygon 钱包 | 支付 Approve、Deposit 和 Withdraw 的网络 Gas |
| 平台 USD 余额 | UnifiedLedger | 购票、接收奖金、接收退款和发起提现 |

平台显示的 USD 是 UnifiedLedger 内部 6 位小数记账单位，不是可自由转账的 ERC-20 代币。

```text
钱包 mUSDT / mUSDC
        |
        | approve + deposit
        v
StablecoinReserve ---- creditFromReserve ----> UnifiedLedger USD
        ^                                          |
        |                                          | debitToReserve
        +--------------- withdraw ----------------+
```

### 2.2 充值不是普通转账

用户从交易所或其他钱包转入资产时，资产首先进入用户自己的 Polygon 钱包。此时平台 USD 不会自动增加。

第三方必须继续引导用户完成：

1. ERC-20 `approve(StablecoinReserve, amount)`；
2. `StablecoinReserve.deposit(...)`。

第三方不得把自己的地址、平台热钱包或游戏 Treasury 展示为用户充值地址。

也不得引导用户通过 ERC-20 `transfer(Reserve, amount)` 代替 `deposit`。直接转账不会触发 `Deposited`，不会给用户增加 Ledger 余额，亦不应承诺能够自动找回。

## 3. 服务与部署发现

### 3.1 公共服务

| 服务 | 当前测试地址 | 用途 |
| --- | --- | --- |
| Manifest | `https://wf.vip/indexer/v1/protocol/manifest` | 获取部署版本、网络、合约和代币地址 |
| Backend | `https://wf.vip/backend` | 查询支持代币、申请充值授权 |
| Indexer | `https://wf.vip/indexer` | 查询余额和出入金历史 |
| Explorer | `https://polygonscan.com` | 查询交易和合约 |

### 3.2 必须动态读取 Manifest

第三方启动和提交交易前必须读取 active manifest，并至少校验：

- `schemaVersion` 是客户端支持的版本；
- `deploymentId` 与第三方配置一致；
- `chainId === 137`；
- `status` 和 `mode` 符合当前使用环境；
- `contracts.stablecoinReserve`、`contracts.unifiedLedger` 和代币地址非零；
- 页面明显显示 Mock 或 Production 环境，禁止混用。

以下 Reserve、Ledger、chainId 和 deploymentId 已于 2026-09-11 通过线上公开 manifest 只读核对；代币地址与项目对应 Mock manifest 对照。快照只用于核对，不应写死到正式客户端：

| 项目 | 当前值 |
| --- | --- |
| schemaVersion | `4` |
| deploymentId | `polygon-mainnet-mock-standalone-v4-20260908` |
| 账本版本 | 独立 `UnifiedLedgerV4` |
| StablecoinReserve | `0x68B6bf1EE6c464562A7296687a98cE40e334072C` |
| UnifiedLedger | `0xC93f8062932bAFA24832B427d29A505395bc759D` |
| mUSDT | `0x3aCF6C9F443b8806206dFac85205CaF15efae528` |
| mUSDC | `0xc65577f875eBA302e4Ba5cDF429351b0Ce00A8bF` |

最小字段提取路径：

| 所需配置 | Manifest 字段 |
| --- | --- |
| 网络 | `chainId` |
| 部署标识 | `deploymentId` |
| Reserve | `contracts.stablecoinReserve` |
| Ledger | `contracts.unifiedLedger` |
| Mock mUSDC | `contracts.gameTokens.mUSDC` |
| Mock mUSDT | `contracts.gameTokens.mUSDT` |
| 扫描起点 | `startBlocks.stablecoinReserve` |
| 来源代码版本 | `source.repository`、`source.commit` |

当前 manifest 的 `contracts.tokens.USDC/USDT` 键名不代表真实 USDC/USDT，必须结合 Mock 环境和实际地址判断。不要按币种符号认领任意同名代币。

这是 Polygon 主网上的测试资产部署：Gas 消耗真实 POL，mUSDT/mUSDC 不具有真实兑付价值。账本 V4、Manifest schemaVersion 4 和 Reserve 的 EIP-712 version `1` 是不同版本概念，不能相互替换。部署切换后必须重新检查 allowance 并申请绑定新 Reserve 的授权，不能沿用旧地址或旧授权。

### 3.3 获取支持代币

```http
GET https://wf.vip/backend/api/v1/tokens
```

成功响应：

```json
{
  "tokens": [
    {
      "symbol": "mUSDT",
      "address": "0x3aCF6C9F443b8806206dFac85205CaF15efae528",
      "decimals": 6
    },
    {
      "symbol": "mUSDC",
      "address": "0xc65577f875eBA302e4Ba5cDF429351b0Ce00A8bF",
      "decimals": 6
    }
  ]
}
```

Backend 白名单用于提前拦截无效授权请求，链上的 `assetConfigs(token)` 才是交易执行时的最终事实。第三方应同时确认：

- `exists === true`；
- 充值时 `depositEnabled === true`；
- 提现时 `withdrawalEnabled === true`；
- 代币精度与链上配置一致。

## 4. 最小合约接口

第三方可以使用公开 ABI、任意 Web3 库或可选 SDK，不强制安装协议 SDK。

```solidity
interface IStablecoinReserve {
    function usedNonces(address user, uint256 nonce) external view returns (bool);

    function paused() external view returns (bool);

    function ledger() external view returns (address);

    function signer() external view returns (address);

    function depositWindows(address user, address token)
        external view returns (uint64 windowStart, uint192 accumulated);

    function withdrawalWindows(address user, address token)
        external view returns (uint64 windowStart, uint192 accumulated);

    function assetConfigs(address token) external view returns (
        bool exists,
        bool depositEnabled,
        bool withdrawalEnabled,
        uint8 decimals,
        uint16 wusdRateBps,
        uint128 singleDepositLimit,
        uint128 dailyDepositLimit,
        uint128 dailyWithdrawLimit
    );

    function previewDeposit(address token, uint256 tokenAmount)
        external view returns (uint256 wusdAmount);

    function previewWithdraw(address token, uint256 wusdAmount)
        external view returns (uint256 tokenAmount);

    function deposit(
        address token,
        uint256 amount,
        uint256 authorizedAmount,
        uint256 minWusdOut,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external returns (uint256 received, uint256 wusdCredited);

    function withdraw(
        address token,
        uint256 wusdAmount,
        uint256 minTokenOut,
        address recipient
    ) external returns (uint256 tokenAmount);
}

interface IUnifiedLedger {
    function balanceOf(address account) external view returns (uint256);
}
```

以上是最小可读接口声明，不要求第三方使用 Solidity 开发。完整 ABI 必须与当前部署代码版本一致；可使用协议提供的 ABI 或可选 SDK。不得仅根据最新仓库分支推断已部署合约的接口，也不应要求第三方必须从 npm 安装尚未确认可用的包版本。

`approve`、`deposit`、`withdraw` 都是合约交易而不是 HTTP POST 路径。三者均不接收 POL 充值金额：交易 `value` 使用 `0`，POL 只用于钱包支付网络 Gas。Approve 的目标是代币合约；其 spender 是 Reserve；Deposit/Withdraw 的目标才是 Reserve。不要把 ABI 调用目标写成 Ledger 或游戏金库。

相关 ERC-20 接口：

```solidity
interface IERC20Funding {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}
```

## 5. 充值对接

### 5.1 标准流程

```text
读取 active manifest
  -> 获取支持代币并核对链上 assetConfigs
  -> 连接用户钱包并确认 Polygon 137
  -> 读取钱包代币余额和 POL 余额
  -> 调用 previewDeposit 计算预计到账 USD
  -> allowance 不足时，用户确认 approve 并等待交易确认
  -> 请求一次性充值授权
  -> 校验授权响应与原请求完全一致且未过期
  -> simulateContract 模拟 deposit
  -> 用户钱包确认 deposit
  -> 等待交易回执和 Deposited 事件
  -> 刷新 UnifiedLedger.balanceOf
  -> 等待 Indexer 生成充值历史
```

充值授权应尽可能靠近 `deposit` 交易申请，建议先完成 Approve，再申请授权，减少授权过期或未使用的概率。

这是推荐的第三方流程，不要求照搬协议前台内部的所有调用顺序。若在 Approve 前先申请授权以提前完成风控，应自行承担等待 Approve 期间授权到期的处理，并避免反复申请消耗额度。

| 阶段 | 第三方需要读取/执行 | 完成条件 |
| --- | --- | --- |
| 准备 | 固定本次用户、chainId、deploymentId、token、amount | 地址与金额通过校验，账户/网络未变化 |
| 钱包授权 | `allowance` 不足时 `approve` | 交易成功且 allowance 足够；此时还未充值 |
| 风控授权 | 请求授权并校验响应 | 获得未过期、绑定本次操作的协议签名 |
| 提交充值 | 预览、模拟、用户确认 `deposit` | 取得 Hash 只代表已提交 |
| 到账核验 | 回执 + 当前 Reserve 的 `Deposited` | 成功且用户/token/nonce/金额匹配 |
| 展示同步 | Ledger 余额与 Indexer 历史 | 本次入账只展示一次，索引延迟有单独提示 |

### 5.2 充值授权 API

```http
POST https://wf.vip/backend/api/v1/deposit-authorizations
Content-Type: application/json

{
  "userAddress": "0x1111111111111111111111111111111111111111",
  "token": "0xc65577f875eBA302e4Ba5cDF429351b0Ce00A8bF",
  "amount": "100000000"
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `userAddress` | address | 实际执行 `deposit` 的钱包地址 |
| `token` | address | Backend 和链上均支持的代币地址 |
| `amount` | decimal string | 代币最小单位正整数，禁止使用 JSON 浮点数 |

例如 6 位精度代币的 `100000000` 表示 100 枚代币。

示例用户地址仅为占位，必须替换为实际操作钱包。金额使用不带符号、小数点、科学计数法或前导零的正整数字符串。当前接口不要求 Partner API Key 或用户登录令牌，但仍受风控、额度及限流约束。

第三方必须自行把十进制输入按 token 的 `decimals` 精确转换为整数，显式拒绝 `0`、`00`、超精度输入以及零用户地址，不依赖服务端所有格式分支都返回同一个错误码。不要把金额先转成浮点数再乘以 10 的幂。

成功响应：

```json
{
  "user": "0x1111111111111111111111111111111111111111",
  "token": "0xc65577f875eBA302e4Ba5cDF429351b0Ce00A8bF",
  "amount": "100000000",
  "deadline": "1788937800",
  "nonce": "42",
  "signature": "0x..."
}
```

响应字段说明：

| 字段 | 合约参数 | 说明 |
| --- | --- | --- |
| `user` | 隐式绑定 `msg.sender` | 必须与当前钱包一致 |
| `token` | `token` | 必须与请求代币一致 |
| `amount` | `authorizedAmount` | 本次授权允许的最大扣款金额 |
| `deadline` | `deadline` | Unix 秒时间戳，过期后不可使用 |
| `nonce` | `nonce` | 用户维度一次性 nonce |
| `signature` | `signature` | StablecoinReserve 当前 signer 的 EIP-712 签名 |

当前默认授权有效期为 600 秒，但第三方必须以响应中的 `deadline` 为准，不得写死有效期。

以上响应只展示结构，时间、nonce 和签名不是可用授权。实际请求必须使用接口实时返回的完整响应。这里的 nonce 与钱包交易 nonce、购票 nonce 无关，不应由第三方自行递增。

Backend 在申请授权时按用户和代币预占请求金额的日额度；用户随后取消交易或授权过期，目前不会自动释放该额度。Backend 的窗口按首次占用时间起算 24 小时，不是 UTC 零点重置。不要通过反复请求授权进行轮询。

### 5.3 EIP-712 授权内容

第三方不负责生成该签名，但应理解签名绑定范围：

```text
Domain:
  name: WUSDStablecoinReserve
  version: 1
  chainId: 137
  verifyingContract: active StablecoinReserve

Primary type:
  DepositAuthorization(
    address user,
    address token,
    uint256 authorizedAmount,
    uint256 deadline,
    uint256 nonce
  )
```

签名不能被换用户、换代币或跨部署复用。同一 `(user, nonce)` 成功使用一次后，再次使用会回退。

授权签名绑定的是最大允许金额 `authorizedAmount`。例如授权 100，实际一次充值 60，该 nonce 仍整次消耗，不能用同一签名再充值剩余 40。实际 `amount`、`minWusdOut` 和完整 calldata 由用户最终签署的链上交易确定；第三方不能在用户签好该交易后替换参数。

### 5.4 Approve

第三方读取：

```text
allowance(user, stablecoinReserve)
```

当 allowance 小于充值金额时，由用户钱包调用：

```text
approve(stablecoinReserve, amount)
```

推荐只授权本次所需金额。必须等待 Approve 确认后再模拟 Deposit，不能把 Approve 成功当成充值成功。

### 5.5 预计到账和滑点保护

提交前调用：

```text
previewDeposit(token, amount) -> expectedWusd
```

`minWusdOut` 是用户可以接受的最少 WUSD。第三方可根据产品披露的容忍度从 `expectedWusd` 计算下限，不得直接假设所有正式资产永久按 1:1 兑换。

当前 Mock 资产通常为 6 位精度和 1:1 风险汇率，但正式客户端仍应使用 `previewDeposit`。

### 5.6 调用 Deposit

```text
deposit(
  token,
  requestedAmount,
  BigInt(auth.amount),
  minWusdOut,
  BigInt(auth.deadline),
  BigInt(auth.nonce),
  auth.signature
)
```

关键约束：

- 交易的 `msg.sender` 必须等于授权中的 `user`；
- `requestedAmount` 必须大于 0 且不能超过 `authorizedAmount`；
- 用户钱包必须有足够代币和 allowance；
- 授权必须未过期、nonce 未使用；
- 最终到账按 Reserve 实际收到的代币计算；
- 计算出的 WUSD 必须不小于 `minWusdOut`；
- 链上单笔和每日限额仍会再次校验。

额度单位注意：Backend 授权额度按代币最小单位计算；链上 `assetConfigs` 的三项充值/提现限额按 WUSD 的 6 位小数单位计算。两层额度独立校验，非 6 位精度或非 1:1 汇率资产不能直接比较原始数字。链上限额为 `0` 表示该项不设限，并不表示 Backend 也无限额。

链上日窗口可读取 `depositWindows(user, token)`；`accumulated` 使用 WUSD 最小单位，窗口届满后的是否重置以当前链上时间及实际执行为准。Backend 预占与链上成功消费是两套独立计数，开始时间可能不同，不能用链上剩余额度代替 Backend 剩余额度；当前没有公开的 Backend 授权日额度查询接口。

### 5.7 充值成功事件

```solidity
event Deposited(
    address indexed user,
    address indexed token,
    uint256 requestedAmount,
    uint256 receivedAmount,
    uint256 wusdCredited,
    uint256 nonce
);
```

只有交易回执成功，且日志发出地址为本次校验的当前 Reserve，事件中的用户、代币和 nonce 与本次操作匹配，第三方才能展示“链上充值成功”。金额展示使用事件的 `receivedAmount` 和 `wusdCredited`，不要直接使用请求金额代替实际到账。

广播返回交易哈希并不代表成功。仍须按双方约定的链上确认策略处理确认中与最终确认；遇到链重组时重新核验回执和事件，不能永久保留已消失事件的成功状态。当前查询接口未提供最终性保证。

## 6. 提现对接

### 6.1 标准流程

```text
读取 active manifest
  -> 获取支持代币并核对 withdrawalEnabled
  -> 连接用户钱包并确认 Polygon 137
  -> 读取 UnifiedLedger.balanceOf(user)
  -> 调用 previewWithdraw 计算预计到账代币
  -> 检查 Reserve 代币余额和用户每日限额
  -> 用户确认收款地址与 minTokenOut
  -> simulateContract 模拟 withdraw
  -> 用户钱包确认 withdraw
  -> 等待交易回执和 Withdrawn 事件
  -> 刷新 UnifiedLedger 余额和钱包代币余额
  -> 等待 Indexer 生成提现历史
```

提现没有授权 API，不使用充值签名，不需要 Partner API Key，也没有管理员逐笔审核或 Safe 付款流程。每次由用户钱包确认；不能用合作商返佣结算的“冻结/待付款”状态代替用户提现状态。

Backend 的充值授权服务不可用不自动阻止提现；第三方只要掌握已核验的当前部署配置和 ABI，就可以通过 RPC 调用允许提现的合约。RPC 本身不可用、资产提现关闭、储备不足或用户超额等仍会阻止交易。

### 6.2 预计到账

```text
previewWithdraw(token, wusdAmount) -> expectedTokenAmount
```

`wusdAmount` 使用 UnifiedLedger 的 6 位小数最小单位。`minTokenOut` 是用户可接受的最少实际到账代币数量。

### 6.3 调用 Withdraw

```text
withdraw(
  token,
  wusdAmount,
  minTokenOut,
  recipient
)
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `token` | 希望收到的支持代币 |
| `wusdAmount` | 从调用钱包 UnifiedLedger 余额中扣除的 USD |
| `minTokenOut` | 用户接受的最少代币到账量 |
| `recipient` | Polygon 收款地址，可以与调用钱包不同 |

四个参数的 Solidity 类型依次为 `address / uint256 / uint256 / address`。提现不需要对 Ledger 做 ERC-20 Approve，也不需要提交充值时的 nonce。

用户不必提回充值时相同的币种：mUSDC 充值产生的 Ledger 余额，可以兑换为启用且储备充足的 mUSDT，反之亦然。必须使用选定目标资产的预览汇率、精度和提现限额；不能承诺任意币种一定有足够库存。

提现交易的 `msg.sender` 是被扣减 WUSD 的账户。第三方必须在确认页同时展示：

- 操作钱包；
- WUSD 扣减金额；
- 目标代币和预计到账；
- 完整收款地址；
- 网络和预计 Gas。

### 6.4 提现成功事件

```solidity
event Withdrawn(
    address indexed user,
    address indexed token,
    address indexed recipient,
    uint256 wusdDebited,
    uint256 tokenAmount
);
```

只有交易成功且出现 `Withdrawn` 事件后，第三方才能展示“提现成功”。

同样须验证日志发出地址、操作用户、代币、收款地址及扣减金额，并按确认策略处理最终性。提现扣账与转出在同一笔交易内原子完成，失败会回滚；失败交易仍可能消耗 Gas。当前 Reserve 的全局 `paused()` 只暂停充值，提现另由资产的 `withdrawalEnabled` 控制。

### 6.5 储备和额度预检查

- 目标资产余额：读取 `IERC20(token).balanceOf(Reserve)`；不能只检查另一种代币的储备，也不能把所有代币面值简单相加判断本次能否提现。
- `accountedReserve` 是会计统计，不是唯一兑付余额来源；实际代币余额和合约执行结果优先。
- 链上用户日窗口：`withdrawalWindows(user, token)`，结合 `assetConfigs(token).dailyWithdrawLimit` 读取；二者金额按 WUSD 6 位精度计算。
- 预检查只是当前快照，其他交易可能先消耗库存或用户余额；模拟通过后也必须核验最终回执。
- 收款人应为用户确认且可控的合法地址；不要填写零地址或 Reserve 自身，不要仅用缩略地址让用户确认。

## 7. 查询余额与历史

### 7.1 余额

链上事实来源：

```text
UnifiedLedger.balanceOf(user)
```

Indexer 便利接口：

```http
GET https://wf.vip/indexer/ledger/balance/{userAddress}
```

响应：

```json
{ "balance": "100000000" }
```

Indexer 可能有同步延迟。提交交易后应先根据交易回执刷新链上余额，再等待 Indexer 更新历史记录。

### 7.2 充值历史

```http
GET https://wf.vip/indexer/ledger/deposits/{userAddress}
```

单条记录包含：

- `id`：`${txHash}-${logIndex}`；
- `user`；
- `token`；
- `requestedAmount`；
- `receivedAmount`；
- `wusdCredited`；
- `nonce`；
- `blockNumber`；
- `blockTimestamp`；
- `txHash`。

### 7.3 提现历史

```http
GET https://wf.vip/indexer/ledger/withdrawals/{userAddress}
```

单条记录至少包含用户、代币、收款地址、扣减 WUSD、实际代币到账、区块、时间和交易哈希。

当前历史接口最多返回最近 50 条。正式大规模接入前应提供游标分页，第三方不得依赖无限历史一次返回。

提现列表的 `{userAddress}` 是被扣 Ledger 的调用地址，不是 `recipient`。例如 U1 提现到 U2，记录应通过 U1 查询，不能因 U2 的提现列表为空就判断 U2 没到账。到账可通过事件和 U2 的代币余额核验。

两个历史接口均直接返回 JSON 数组，无 `data` 或 `items` 外层；无记录返回 `[]`，按 `blockTimestamp` 倒序。代币金额使用各自代币精度，WUSD 金额使用 6 位精度，时间为 Unix 秒。金额按整数字符串处理，禁止转换成浮点数。

### 7.4 状态优先级

状态判断顺序：

1. Polygon 交易回执；
2. `Deposited` 或 `Withdrawn` 合约事件；
3. UnifiedLedger 和代币链上余额；
4. Indexer 历史记录；
5. 第三方本地展示状态。

Indexer 暂时查不到已确认交易时，应显示“链上已确认，索引同步中”，不能显示失败或再次提交。

查询无结果也不一定代表真实余额为零：当前余额接口在尚无索引记录时返回 `{"balance":"0"}`。新地址或刚充值地址应与链上 `balanceOf` 交叉验证，且必须把 HTTP/解析错误与有效的零余额分开。

### 7.5 第三方自行扫链

第三方可以不依赖协议 Indexer，自行通过 Polygon RPC 读取日志：

1. 固定本次 deploymentId、chainId、Reserve 地址和 `startBlocks.stablecoinReserve`。
2. 从该起点按受 RPC 限制的区块范围读取 Reserve 的 `Deposited` / `Withdrawn` 日志；不扫描所有同名事件。
3. 金额使用事件字段，时间使用事件所在区块时间；持久化 blockNumber、blockHash、txHash、logIndex 和状态。
4. 以 `(chainId, Reserve, txHash, logIndex)` 去重，游标更新与业务记录一起提交；重复扫描不重复入账。
5. 按联调约定的确认/最终性策略从“确认中”推进至“已确认”；重组时撤销孤块记录并重扫。
6. 建议保留重叠扫描窗口，定期与链上余额及交易回执核对；不要将单次 GET 返回的最近 50 条当作可靠增量消费队列。

协议不要求第三方上传交易 Hash，也不推送 Webhook；第三方自己保存 Hash 是为了查询和恢复，不是协议侧创建订单的前置条件。出入金归属按用户地址，不包含 partnerCode，不能从这些事件直接统计第三方购票返佣。

最终余额可能同时受到购票、领奖、退款影响；仅加总 `Deposited/Withdrawn` 不足以重建完整 Ledger 余额。完整余额读取 `balanceOf`，或扫描对应 Ledger 的全部相关事件。

## 8. 浏览器与服务端接入方式

### 8.1 浏览器直接接入

第三方前端可以直接读取 Indexer 和链上数据。充值授权 API 受 CORS 白名单保护，第三方正式接入前需要向协议运营方登记生产域名和测试域名。

当前未登记的第三方 Origin 无法从浏览器直接调用：

```text
POST /api/v1/deposit-authorizations
```

CORS 只控制浏览器访问，不是用户身份认证，也不能替代链上签名校验。

Origin 登记需包含协议、域名和非默认端口。例如 `https://partner.example` 与 `http://localhost:3000` 是两个不同 Origin。JSON POST 可能先触发 OPTIONS 预检；预检失败时检查允许的 Origin 和网关路径，不重复发授权。

Backend 会返回 `X-Request-Id`，但当前 CORS 配置未显式暴露该响应头给跨域 JavaScript。若脚本读不到，可在浏览器 Network 面板查看，或由第三方服务端记录；不要把读不到响应头误判为充值失败。

### 8.2 第三方 Backend 转发

在域名尚未加入 CORS 白名单时，第三方可以由自己的 Backend 转发充值授权请求，再把授权响应交给用户浏览器。

约束：

- 不修改 `userAddress`、`token`、`amount` 或响应字段；
- 授权仅可短期保存用于同一次用户操作的恢复，不跨用户、跨部署或用于多次充值；
- 不代表用户签署 Approve、Deposit 或 Withdraw；
- 不记录钱包签名、认证令牌或私钥；
- 保留协议返回的 HTTP 状态、错误代码和请求 ID；
- 当前授权接口按 Backend 识别到的来源 IP 每分钟最多 10 次，实际来源识别受反向代理配置影响，集中转发可能共享额度。

浏览器直连需登记域名；服务端转发需评估共享 IP 限流。两种方式均不代表已获得独立渠道配额或吞吐承诺，规模化接入前必须联调代理来源识别与限流容量。

## 9. 错误处理

### 9.1 Backend 错误

| HTTP | code | 含义 | 建议处理 |
| ---: | --- | --- | --- |
| 400 | `INVALID_REQUEST` | 地址、代币或金额格式错误 | 修正参数，不重试原请求 |
| 400 | `ZERO_AMOUNT` | 金额为零 | 要求用户输入正数 |
| 400 | `TOKEN_NOT_WHITELISTED` | Backend 不支持该代币 | 重新获取代币列表 |
| 403 | `AML_REJECTED` | 地址未通过风险策略 | 停止充值并展示合规提示 |
| 503 | `AML_ERROR` | 风险服务不可用或返回不确定 | 稍后退避重试，不绕过授权 |
| 403 | `EXCEEDS_SINGLE_TX_LIMIT` | 超过单笔限额 | 减少金额 |
| 403 | `EXCEEDS_DAILY_LIMIT` | 超过日限额 | 展示限额状态，等待窗口恢复 |
| 429 | `RATE_LIMITED` | 请求过于频繁 | 使用退避，不立即重复请求 |
| 500 | `INTERNAL_ERROR` | 服务端处理失败，授权/额度处理结果可能不确定 | 保存请求时间与请求 ID，联系支持，勿盲目重复申请 |

Backend 返回 HTML、空响应或非 JSON 时，客户端应保留 HTTP 状态与响应摘要，不能只显示 `Unexpected token '<'`。

业务错误示例：

```json
{
  "error": "充值地址筛查暂不可用，请稍后重试",
  "code": "AML_ERROR"
}
```

该示例对应 HTTP 503。无效请求的响应可能另外包含 `details` 字段；客户端应优先使用稳定的 `code` 分类，不依赖中文错误文本完全一致。网关 502/504、网络超时和钱包拒签也要分开处理。

### 9.2 Deposit 合约错误

| 错误 | 含义 |
| --- | --- |
| `AssetNotSupported` | 代币不是链上支持资产 |
| `DepositDisabled` | 该资产充值已暂停 |
| `EnforcedPause` | Reserve 全局充值暂停 |
| `ZeroAmount` | 请求金额、实际收款或换算后 WUSD 为零 |
| `SignatureExpired` | 授权已过期，需重新申请 |
| `NonceAlreadyUsed` | 授权已使用，先核对原交易 |
| `ExceedsAuthorizedAmount` | 提交金额超过授权金额 |
| `InvalidSignature` | 用户、代币、金额、部署或签名不匹配 |
| `SlippageExceeded` | 实际 WUSD 小于 `minWusdOut` |
| `ExceedsSingleDepositLimit` | 超过链上单笔限额 |
| `ExceedsDailyDepositLimit` | 超过链上每日限额 |
| ERC-20 allowance/balance 错误 | 钱包代币或授权额度不足 |

### 9.3 Withdraw 合约错误

| 错误 | 含义 |
| --- | --- |
| `AssetNotSupported` | 代币不受支持 |
| `WithdrawalDisabled` | 该资产提现关闭 |
| `ZeroAddress` | 收款地址为零地址 |
| `ZeroAmount` | 提现金额或换算后代币数量为零 |
| `InsufficientReserve` | Reserve 当前代币余额不足 |
| `ExceedsDailyWithdrawLimit` | 超过用户该资产的日提现限额 |
| `SlippageExceeded` | 实际代币到账小于 `minTokenOut` |
| `UnsupportedTransferSemantics` | 代币实际扣款行为不符合 Reserve 支持的规则 |
| Ledger 余额不足 | 用户可用 WUSD 不足 |

## 10. 幂等与重试

| 操作 | 是否可自动重试 | 规则 |
| --- | --- | --- |
| Manifest、代币、余额和历史 GET | 可以 | 使用有限次数指数退避 |
| 充值授权 POST | 不可以盲目重试 | 当前没有客户端幂等键；超时后先确认服务状态，避免重复占用限额和签发多个 nonce |
| Approve | 不可以盲目重发 | 先查询 allowance 和原交易回执 |
| Deposit | 不可以盲目重发 | 先查交易回执、`usedNonces(user, nonce)` 和 `Deposited` 事件 |
| Withdraw | 不可以盲目重发 | 先查交易回执、WUSD 余额和 `Withdrawn` 事件 |

客户端状态至少区分：

```text
待输入
等待钱包确认
已拒签
已广播
链上确认中
链上成功/索引同步中
已完成
失败
结果未知/需要核对
```

用户拒签时保留代币、金额和收款地址。交易结果未知时禁止把按钮立即恢复为可重复提交状态。

Deposit 确认回滚时，链上 nonce 消耗也随之回滚；这不等于 Backend 已释放预占额度。网络超时或 HTTP 500 也不保证没有签发授权或消耗额度。提现没有类似的业务 nonce 去重保护，更不能在回执未知时重新发起一笔新提现。原始已签交易的重广播与创建新的业务交易是不同操作。

### 10.1 页面关闭、超时与替换交易恢复

第三方自行维护的最小操作记录建议包含：本地 operationId、chainId、deploymentId、用户、token、金额、收款人、操作类型、阶段、各交易 Hash、创建/更新时间。operationId 只用于第三方界面和自身幂等管理，当前协议授权接口不识别它。

充值操作还需保留本次授权的 nonce/deadline 及本次请求金额以便核对。授权签名只短期用于本次流程恢复，不写入公开日志或长期持久化的浏览器存储；恢复时先检查是否已用/到期。不要持久化钱包私钥或原始私有登录信息。

| 已知情况 | 恢复操作 |
| --- | --- |
| 已有 Approve Hash，但页面关闭 | 查回执与 allowance；不要把它当 Deposit Hash |
| 已有 Deposit/Withdraw Hash，但查询超时 | 保持结果未知，继续查原 Hash；不自动创建新交易 |
| 钱包明确拒签且未返回 Hash | 显示取消，允许用户重新操作；充值先检查原授权有效性 |
| 钱包报网络错误且无 Hash | 不推定未发送，查钱包活动与匹配链上事件；无法确认时交由人工核对 |
| 钱包“加速”原交易 | 跟踪替代 Hash，并核对目标、calldata 和金额是否仍是原业务 |
| 钱包“取消”或同 nonce 换成别的交易 | 不能因替代交易回执成功就将原业务标成功 |
| Deposit 回执成功但事件用户/token 不匹配 | 不记账为本次成功，保留证据并告警 |
| 已确认后发生重组 | 回到核对状态，撤销链下成功投影，不能再次向用户重复记账 |

### 10.2 性能与用户提示

- 可并行读取余额、allowance、资产开关等互不依赖的信息；交易 nonce、授权 nonce 不能靠猜测递增来节省请求。
- 首次充值通常有 Approve 和 Deposit 两笔交易，提现通常一笔；每笔都需要 Gas 和钱包确认。
- 网站 RPC 的读取速度不代表 MetaMask 内部估算、安全检测和广播速度。不要因为钱包弹窗慢就提高 Gas 价格或关闭安全提示。
- 广播后仅轮询现有 Hash，可采用有界退避与后台恢复；具体轮询频率和确认数在联调时约定，不承诺“2 秒到账”。
- 用户切换账户、网络或部署后，丢弃尚未签署的旧操作快照并重新确认；已广播交易继续按原用户/网络跟踪，不切成新账户的成功状态。

## 11. 安全要求

第三方必须满足：

1. 每次写交易前校验 Chain ID、deploymentId 和目标合约地址；
2. 只从 active manifest 和链上配置读取合约及资产，不接受 URL 参数覆盖；
3. 充值授权响应中的用户、代币、金额必须与当前操作完全一致；
4. 不把充值授权签名当作登录令牌或 Partner 凭证；
5. 不收集助记词、私钥或钱包导出文件；
6. 不把第三方地址伪装成用户充值地址；
7. 完整展示提现收款地址，避免地址替换；
8. 金额全部使用 bigint/整数字符串，不使用 JavaScript 浮点数结算；
9. 不在日志中记录私钥、钱包签名、认证令牌或完整风控响应；
10. 使用 HTTPS，并对 Manifest 与合约地址变化设置告警；
11. 页面明确说明当前 mUSDT、mUSDC 是测试资产，不具有真实兑付价值；
12. 地区或产品限制不得隐藏用户已有的提现能力。

## 12. 接入验收清单

### 12.1 充值

- [ ] 能读取并校验 active manifest；
- [ ] 能展示 Backend 与链上共同支持的代币；
- [ ] 非 Polygon 网络不能直接提交；
- [ ] 钱包代币不足和 POL 不足有不同提示；
- [ ] allowance 不足时只执行一次 Approve；
- [ ] Approve 确认后再申请短期充值授权；
- [ ] 能校验授权响应并模拟 Deposit；
- [ ] Deposit 成功后展示交易哈希和实际 WUSD；
- [ ] Indexer 延迟时不重复充值；
- [ ] 过期签名、重复 nonce、超限和 AML 拒绝均有明确提示。

### 12.2 提现

- [ ] 能展示 WUSD 余额、目标代币和预计到账；
- [ ] 能使用与操作钱包不同的合法 Polygon 收款地址；
- [ ] 提交前完整确认收款地址；
- [ ] Reserve 不足、提现关闭和每日超限有明确提示；
- [ ] Withdraw 成功后 WUSD、钱包资产和历史记录一致；
- [ ] 结果未知时先查原交易，不重复提现。

### 12.3 数据一致性

- [ ] 链上余额是当前余额的最终来源；
- [ ] 出入金历史可关联交易哈希和区块浏览器；
- [ ] `requestedAmount`、`receivedAmount` 和 `wusdCredited` 不混为一个字段；
- [ ] 所有地址、金额和状态切换钱包后完整刷新；
- [ ] 数据读取失败显示 `--` 或不可用，不显示伪造的 `0`。

## 13. 当前测试环境限制与生产门槛

当前接口可以用于第三方测试联调，但不应直接视为真实资金生产就绪。已知限制：

| 优先级 | 当前限制 | 正式要求 |
| --- | --- | --- |
| P0 | mUSDT、mUSDC 是 Mock 资产 | 正式环境使用审批后的真实资产与独立 production manifest |
| P0 | 已实现 `chainalysis-sanctions` 制裁名单筛查；完整 TRM/Chainalysis 风险 API 仍是占位，环境也可配置 Mock | 联调前确认实际 provider；制裁名单检查不等于完整 AML、身份认证或合规批准，正式策略须独立评审 |
| P0 | 第三方浏览器 Origin 默认不在 CORS 白名单 | 审批接入域名并完成预检测试 |
| P0 | 当前测试签名可使用环境变量私钥 | 生产必须使用 KMS/HSM，并确保链上 signer 一致 |
| P1 | 充值授权 POST 没有客户端幂等键和授权状态查询 | 增加 requestId、查询接口和安全重试规范 |
| P1 | 链下日限额在签发授权时预占，未使用授权也可能占用额度 | 增加授权过期释放或按链上成功事件核销机制 |
| P1 | 授权接口按 IP 每分钟限制 10 次 | 增加钱包地址、设备和 IP 组合限流，给已批准渠道设置合理容量 |
| P1 | 出入金历史只返回最近 50 条 | 增加游标分页和最终性字段 |
| P1 | Backend 白名单与链上资产配置分别维护 | 部署检查必须验证两边一致并持续监控漂移 |

以上是已知检查项，不构成生产安全认证。真实资金上线还需完成合约与资金链路审计、端到端验收、额度与重试策略、监控和应急方案评审；不得仅以完成 P0 表格视为生产就绪。

## 14. 对接支持所需信息

第三方申请出入金联调时应提供：

- 测试和生产域名；
- 使用的钱包方案及支持的浏览器；
- 预计充值授权请求峰值；
- 测试钱包地址；
- 错误回调或技术联系人；
- 是否使用第三方 Backend 转发；
- 计划展示的资产和地区。

排查问题时提供：

- deploymentId；
- Chain ID；
- 用户钱包地址；
- 操作类型和代币地址；
- Backend 请求时间、HTTP 状态、错误 code 和 `X-Request-Id`；
- 交易哈希（如已广播）；
- 客户端显示的阶段；
- 不包含密钥和签名原文的错误日志。

## 15. 第三方完整联调样例

### 15.1 先准备什么

1. 登记第三方测试 Origin，或明确由第三方服务端转发授权请求。
2. 准备两个不同的测试钱包 U1、U2，分别登记完整地址；U1 具有少量真实 POL。
3. 从 `https://wusd.wf.vip/` 获取支持的测试资产，核对实际领取 token 与 manifest 一致。水龙头入钱包不等于 Ledger 已充值。
4. 确认当前链为 Polygon 137、Reserve/Ledger 与本次快照一致，`Reserve.ledger()` 指向当前 Ledger。
5. 读取资产配置及预览值。下面的数值演示仅适用于 mUSDC 6 位精度、1:1 汇率，且 U1 无并发其他资金操作的场景。

联调预算由负责人批准。下面 10 和 3 的金额是便于核算的测试例子，不是单笔最低要求；可按当前额度改为更小金额。不得用真实 USDT/USDC 替换 Mock 地址测试。

### 15.2 充值 10 mUSDC

前提：U1 钱包有 10 mUSDC，Ledger 初始余额为 0；不考虑已存在的其他操作。

| 顺序 | 操作 | 样例参数 | 检查点 |
| ---: | --- | --- | --- |
| 1 | 读取支持资产和余额 | token = 当前 mUSDC；amount = `10000000` | 10 × 10^6，不能传 `10` 代表 10 mUSDC |
| 2 | 查询 allowance | owner = U1；spender = Reserve | 已足够可跳过下一步 |
| 3 | 用户确认 Approve | token 合约 `approve(Reserve, 10000000)` | `value=0`，保存 approveTxHash，确认成功 |
| 4 | 请求充值授权 | `userAddress=U1`、`token=mUSDC`、`amount="10000000"` | 不提交 partnerCode/API Key；响应来自协议 Backend |
| 5 | 校验授权 | user/token/amount、nonce、deadline | 与当前用户和本次充值一致；不得拿文档里的示例签名使用 |
| 6 | 预览 | `previewDeposit(mUSDC, 10000000)` | 在本例前提下返回 `10000000` |
| 7 | 模拟和用户确认 Deposit | `amount=10000000`、`authorizedAmount=auth.amount`、`minWusdOut=10000000`，其他字段原样使用授权响应 | 本例要求无兑换损失；若预览不同先重新确认，不强制写死 1:1 |
| 8 | 检查回执及事件 | 当前 Reserve 的 `Deposited` | user=U1，token=mUSDC，nonce 匹配，received/credited 均为 `10000000` |
| 9 | 核对结果 | Ledger 与钱包资产、Indexer 历史 | Ledger 增加 10 WUSD，U1 mUSDC 减少 10，Reserve mUSDC 增加 10；Gas 从 POL 单独扣除 |

Deposit 的三个金额分别是：请求扣款 `amount`、授权上限 `authorizedAmount`、最低接受到账 `minWusdOut`。虽然本例三者相同，但它们不是同一个业务字段，不应混用。

### 15.3 提现 3 WUSD 到 U2

前提：上一步完成；U1 Ledger 为 10 WUSD，Reserve 有足够 mUSDC；无并发其他资金操作。

| 顺序 | 操作 | 样例参数 | 检查点 |
| ---: | --- | --- | --- |
| 1 | 确认调用钱包 | U1，Polygon 137 | 不是 U2，也不是第三方平台钱包 |
| 2 | 读取 Ledger/资产开关/储备 | Ledger U1 = `10000000`；mUSDC 允许提现 | 目标代币库存足够 |
| 3 | 预览提现 | `previewWithdraw(mUSDC, 3000000)` | 本例返回 `3000000` |
| 4 | 展示确认页 | 扣减 3 WUSD；接收 3 mUSDC；完整地址 U2 | U1 主动确认接收人；不是退回充值来源地址的强制规则 |
| 5 | 模拟并请求用户交易 | `withdraw(mUSDC, 3000000, 3000000, U2)` | `value=0`；不申请充值授权、不 Approve Ledger |
| 6 | 核验回执及事件 | 当前 Reserve 的 `Withdrawn` | user=U1，recipient=U2，token=mUSDC，wusdDebited/tokenAmount=`3000000` |
| 7 | 核对资产 | U1 Ledger、U2 mUSDC、Reserve mUSDC | U1 Ledger 变为 7 WUSD，U2 mUSDC 增加 3，Reserve mUSDC 减少 3 |
| 8 | 查询历史 | `/indexer/ledger/withdrawals/{U1}` | 显示扣账用户 U1 和接收人 U2；不要改用 U2 查询该扣账记录 |

### 15.4 必须覆盖的异常联调

| 场景 | 操作 | 预期结果 |
| --- | --- | --- |
| 非目标网络 | 在其他网络开始充值/提现 | 先切网；拒绝切网不发交易 |
| 钱包无 POL | 发起需要链上交易的步骤 | 明确提示网络费不足，不误报稳定币不足 |
| 取消 Approve/Deposit/Withdraw | 在对应钱包弹窗取消 | 不标成功；保留输入，按授权及原交易状态决定后续操作 |
| Approve 后授权过期 | 使用临近/已过期的授权模拟 | 不复用过期签名；重新申请前提示额度规则 |
| 成功授权重放 | 用已成功 nonce 再模拟 Deposit | `NonceAlreadyUsed`；不重复入账 |
| 账户切换 | 在申请授权后从 U1 切 U2 | 不使用 U1 授权为 U2 提交；丢弃未签操作快照 |
| 网络超时 | 已广播后中断浏览器网络，再恢复 | 跟踪原 Hash，不新发一笔充值/提现 |
| 索引延迟 | 交易成功，暂时查询不到历史 | 显示已上链/同步中，Ledger 以链上为准 |
| 不同收款人 | U1 提现到 U2 | U1 扣账，U2 收币，记录归 U1 查询 |
| 储备不足/提现关闭 | 隔离环境构造后模拟提现 | 明确拒绝，Ledger 不被单独扣减 |
| 风控服务故障 | 隔离环境模拟依赖异常 | HTTP 503 + `AML_ERROR`，不签发授权 |
| 仅转账到钱包 | 从另一钱包向 U1 转入 mUSDC | 钱包余额增加，Ledger 不变，仍需 Deposit |

重放、服务故障、资产停用、储备不足等场景由技术人员在隔离环境构造；这份文档不授权第三方修改共享线上合约配置或绕过地址风险策略。

### 15.5 联调通过标准

- U1 的充值、提现过程各完成一次，分别有正确目标合约、成功回执及匹配事件。
- 充值原始金额、实际入库量和 Ledger 入账量可以逐项核对；提现被扣用户与实际接收人可以分别核对。
- 拒签、超时和索引延迟不会导致重复发交易或误显示成功。
- SDK 可选；标准浏览器钱包无需导出原始已签交易也能完成接入。
- 只读查询、风控授权和钱包资金签名的权限边界符合本文，不要求第三方获取协议私钥或后台账户。
- 测试通过仅说明本次 Mock 联调可用，不代表真实资金合规/安全上线批准。

## 16. 常见问题

**充值一定要调用协议 HTTP 接口吗？**

当前需要先取得协议签发的 DepositAuthorization。接口只返回授权，不接收资金；资金由用户钱包通过 Reserve.deposit 转入合约。

**提现是否也需要先调用后台“申请提现”？**

不需要。当前用户提现直接调用 Reserve.withdraw，不走代理佣金后台付款、Safe 审批或人工审核。

**只接入充值提现，需要申请 partnerCode 吗？**

出入金接口和合约参数不使用 partnerCode。合作商务审批、域名准入和服务容量仍需按协议的接入要求办理；购票返佣是另一个流程。

**用户要先做 SIWE 登录吗？**

当前公开出入金授权/查询不要求 SIWE token，链上资金操作仍必须由用户钱包确认。私有通知及合作商账单需要身份鉴权；前台主动连接后出现登录签名不意味着该签名可以代替 Deposit 或 Withdraw。

**第三方充值授权 API 返回 200 就算到账吗？**

不算。200 只代表取得授权；Approve 也只代表允许扣款。必须等实际 Deposit 回执成功并匹配 Deposited 事件。

**提现到第三方指定接收地址可以吗？**

合约支持非调用人的 recipient，但必须由用户明确核对并签署。若第三方使用集中收款地址代管用户资金，会引入额外托管及合规责任，不属于本文推荐的自托管流程。

**mUSDC 充值后能提 mUSDT 吗？**

能否兑换取决于目标资产提现开关、预览汇率、储备及用户限额；Ledger 是统一余额，不按每笔充值币种锁定。

**没有 Webhook 或 Hash 提交接口，怎么知道成功？**

第三方保存用户交易 Hash，自行查询回执/扫链，或读取协议 Indexer。保存 Hash 与必须上传 Hash 是两件事。

**提现是否绝对不受暂停影响？**

不是。Reserve 全局 pause 只暂停充值，不拦截 withdraw；但资产的 withdrawalEnabled、余额、限额、合约权限关系及其他校验仍可能使提现失败。以当前合约状态和模拟/执行结果为准。

## 17. 本版核验说明

- 已只读核对线上 manifest 的部署标识、网络、Reserve 和 Ledger；未申请真实充值授权、未广播测试交易、未变更服务器或合约。
- API 路径、响应及错误码按当前仓库实现核对；第三方正式联调仍需验证实际部署接口和 CORS 配置。
- 修正旧版把 `AML_ERROR` 写为 HTTP 403 的说明，现为 503。
- 修正旧版“风控只有 Mock”的说明；当前已有制裁名单 Oracle 实现，但不将其描述为完整 AML 能力。
- 补充 SIWE 与资金权限区别、浏览器钱包广播限制、额度消耗、扫链、超时恢复及完整金额样例。
- 本次仅更新文档，没有将更新后的文档发布到线上 Docs 页面。

# WF 对接 Polymarket 方案调研与可行性分析

## 一、原始问题

WF 在 Polygon 上以 AA Wallet 作为用户主账户，并通过 Privy Signer 为用户管理 Polymarket 专用交易钱包。用户通过 WF 完成充值、下注、撤单、卖单、领取收益和提现，用户无需逐笔签名，由 WF 在受控授权范围内代用户完成 Polymarket API 调用和链上交易，同时维护用户资产、订单、持仓和结算账本。

需要基于 Polymarket 官方文档完成以下工作：

1. 调研 Polymarket 官方文档，梳理出具体可行性方案，或者不可行的分析方案。
2. 如果方案可行，详细描述每个业务场景的流程，以及使用 Polymarket 的哪个服务或接口。
3. 如果需求不明确，反馈需要进一步确认的关键问题。

---

## 二、总体结论

这个需求**有条件可行**，但不能直接按“WF AA Wallet = Polymarket 用户交易钱包”的方式落地。

Polymarket 官方当前推荐的账户模型是：

- **Deposit Wallet**：Polymarket 交易账户的智能钱包；
- **Owner Signer**：Deposit Wallet 的所有者签名器；
- **Session Key**：由 Owner Signer 授权的受限交易签名器；
- **CLOB**：订单、撤单、成交查询等交易接口；
- **Relayer/Builder API**：用于免 Gas 的钱包操作和账户创建。

推荐的账户架构如下：

```text
用户
  ↓ Privy Login
WF 用户账户
  ├── WF AA Wallet：主账户、充值/提现账户
  └── Polymarket Deposit Wallet：Polymarket 专用交易账户
          ├── Owner Signer：由 Privy 管理
          └── Session Key：WF 后端交易签名器，仅授权 CLOB
```

用户不需要逐笔签名，但 WF 需要在后台管理两类签名权限：

1. **Session Key**：负责日常下单、卖单、撤单；
2. **Owner Signer**：负责充值、提现、授权、领取收益、Session Key 管理等高权限操作。

### 最终判断

- 用户免逐笔签名：**可行**；
- WF 代用户完成 Polymarket CLOB 交易：**可行**；
- WF AA Wallet 直接作为 Polymarket Deposit Wallet：**不能直接假设可行，需要官方确认**；
- Session Key 直接提现：**不可行**；
- 所有操作只使用一个 Privy Signer：**不建议**，应区分 Owner Signer 与受限 Session Key；
- 完整资金闭环：**有条件可行**，前提是 Privy 签名能力、Builder/Relayer 权限、Deposit Wallet 模型和合规条件均确认。

---

## 三、官方文档确认的关键事实

### 3.1 Polymarket 的钱包类型

Polymarket 当前区分以下钱包类型：

| 钱包类型 | 用途 |
|---|---|
| Deposit Wallet | 2026 年 5 月 4 日之后创建的 Polymarket 账户默认钱包 |
| Proxy Wallet | 旧版 Magic Link、Google 登录账户 |
| Safe Wallet | 旧版外部钱包签名账户 |
| EOA | 直接由普通外部账户交易 |

官方推荐新集成使用 **Deposit Wallet**。

因此，原架构图中的“Polymarket Deposit Wallet”可以对应官方模型；但“Polymarket Wallet Batch”不是当前官方文档中的标准账户类型，需要进一步确认其真实含义。

相关文档：

- [Wallets and Authentication](https://docs.polymarket.com/trading/wallets-auth)
- [Contract Addresses](https://docs.polymarket.com/resources/contracts)

### 3.2 Session Key 的能力和边界

Polymarket 官方 Session Key 文档明确说明：

- Session Key 是独立的 EOA 签名账户；
- 由 Deposit Wallet Owner 授权；
- 默认有效期为 180 天；
- 可以限定为 CLOB、Combos 或全部支持的交易场景；
- 只能用于 Deposit Wallet；
- Session Key 不能提现吗；
- Session Key 泄露后可以撤销；
- 撤销时会取消该 Session Key 创建的未完成订单。

这与“用户免签名、WF 代签名”的日常交易场景高度匹配。

相关文档：

- [Session Keys](https://docs.polymarket.com/trading/session-keys)

### 3.3 免 Gas 不等于不需要签名

Polymarket 的免 Gas 和代签名机制分为两层。

#### 交易签名

CLOB 下单需要签名，可以由：

- Deposit Wallet Owner Signer 签名；
- 或经过授权的 Session Key 签名。

#### 链上钱包操作

以下操作通常需要 Owner Signer：

- ERC-20 授权；
- ERC-1155 授权；
- ERC-20 转账；
- Deposit Wallet 创建；
- Session Key 授权/撤销；
- Split；
- Merge；
- Redeem；
- 提现或资产转移。

这些操作可以通过 Polymarket Relayer API 或 Builder API 免 Gas 提交，但“免 Gas”不等于“不需要签名”。

---

## 四、推荐的可行架构

### 4.1 方案 A：每个用户一个 Deposit Wallet（推荐）

账户关系：

```text
Privy Login
      ↓
WF User ID
      ├── WF AA Wallet
      ├── Polymarket Deposit Wallet
      ├── Owner Signer
      └── Session Key
```

建议：

- 每个 WF 用户对应一个独立的 Polymarket Deposit Wallet；
- 每个 Deposit Wallet 对应独立的 Owner Signer；
- 每个用户的 Session Key 独立生成、独立存储；
- WF 后端不共用一个全局 Polymarket 钱包；
- 彩票资产与 Polymarket 资产分账、分地址或至少严格分账。

### 4.2 为什么不建议直接让 WF AA Wallet 作为 Polymarket 钱包

Polymarket 官方的 Deposit Wallet 模型是由 signer 派生或创建的专用账户。官方 SDK 的 `createSecureClient` 需要：

- `signer`；
- `wallet`；
- `Builder API Key` 或 `Relayer API Key`。

WF 的 AA Wallet 如果是智能账户，不能直接假定它可以作为 Polymarket CLOB 的标准交易账户。需要 Polymarket 官方确认该 AA Wallet 是否被支持为：

- Polymarket account wallet；
- CLOB maker address；
- Deposit Wallet Owner；
- 或 EOA allowlist 账户。

因此更稳妥的设计是：

- WF AA Wallet：WF 主账户；
- Polymarket Deposit Wallet：Polymarket 交易账户；
- WF AA Wallet 与 Deposit Wallet 之间进行资金划转。

---

## 五、各业务场景的详细流程

### 5.1 用户登录和账户初始化

#### 业务流程

1. 用户通过 Privy Login 登录 WF。
2. WF 根据 Privy 用户标识创建或查询 WF 用户账户。
3. WF 创建或关联：
   - WF AA Wallet；
   - Polymarket Deposit Wallet；
   - Owner Signer；
   - Session Key。
4. WF 保存账户关系：
   - `wf_user_id`；
   - `aa_wallet_address`；
   - `polymarket_wallet_address`；
   - `owner_signer_address`；
   - `session_key_address`；
   - `wallet_type`。
5. WF 完成交易授权设置。

#### Polymarket 能力

创建用户 Polymarket 账户时，官方文档使用：

- `createSecureClient`；
- `builderApiKey`；
- `privateKey` 或其他签名器适配器。

Deposit Wallet 创建由 Builder API 支持，且钱包地址可由 signer 确定性派生。

#### 注意事项

Builder API 的以下凭证必须仅保存在 WF 服务端，不能返回前端：

- API Key；
- Secret；
- Passphrase。

---

### 5.2 授权 Session Key

#### 业务流程

1. WF 为用户生成 Session Key。
2. Session Key 私钥保存到 HSM、KMS 或其他安全密钥服务。
3. WF 使用 Deposit Wallet Owner Signer 调用：

```text
authorizeSessionKey()
```

4. 授权范围建议仅设置为：

```text
SessionKeyKnownScope.CLOB
```

5. WF 保存：
   - Session Key 地址；
   - 生效时间；
   - 过期时间；
   - 授权范围；
   - 状态。
6. 交易服务使用 Session Key 创建 Polymarket Secure Client。
7. Session Key 异常时调用：

```text
revokeSessionKey()
```

#### 权限建议

日常交易 Session Key 只允许：

- 创建 CLOB 订单；
- 取消 CLOB 订单；
- 查询自己提交的订单和交易。

不要授予资金转移、提现或其他高权限。

---

### 5.3 用户充值到 WF

建议把“WF 充值”和“Polymarket 充值”分成两个步骤。

#### 业务流程

```text
用户外部钱包
      ↓
WF AA Wallet
      ↓
WF 账本记账
```

1. 用户向 WF AA Wallet 充值。
2. WF 监听 Polygon 链上入账。
3. 确认区块数和资产类型。
4. 更新 WF 用户可用余额。
5. 如果用户需要参与 Polymarket，再执行 AA Wallet 到 Polymarket Deposit Wallet 的资金划转。

用户充值到 WF AA Wallet 本身不是 Polymarket API 操作，而是 WF 自己的链上充值流程。

---

### 5.4 从 WF AA Wallet 充值到 Polymarket

#### 业务流程

```text
WF AA Wallet
      ↓ ERC-20 transfer
Polymarket Deposit Wallet
      ↓
Polymarket CLOB 交易余额
```

1. WF 检查 AA Wallet 余额。
2. 检查目标 Polymarket Deposit Wallet 地址。
3. 调用 AA Wallet 的 ERC-20 转账逻辑。
4. 等待 Polygon 交易确认。
5. 查询 Polymarket 钱包余额。
6. 更新：
   - WF 账户余额；
   - Polymarket 可用余额；
   - 资金划转记录。

#### Polymarket 相关能力

Polymarket SDK 中可以使用：

```text
transferErc20()
```

如果从 Deposit Wallet 继续进行链上操作，可以使用：

```text
SecureClient
Relayer API Key
Builder API Key
```

#### 必须确认

官方文档当前使用 `pUSD` 作为交易抵押资产示例。WF 需要确认：

- 当前 Polymarket Polygon 生产环境使用的具体 token 地址；
- token decimals；
- 是否需要先将其他资产兑换成 pUSD；
- 资金转入 Deposit Wallet 后是否还需要额外的交易授权。

不要仅按旧文档中的 USDC、USDC.e 或旧合约地址实现，应以官方最新 Contract Addresses 为准。

---

### 5.5 设置交易授权

在首次交易前，Deposit Wallet 需要配置交易合约授权。

#### 业务流程

1. WF 查询 Deposit Wallet 当前授权状态。
2. 调用：

```text
setupTradingApprovals()
```

3. 如缺少授权，Polymarket 自动提交：
   - ERC-20 授权；
   - ERC-1155 operator 授权。
4. 通过 Relayer 或 Builder API 进行免 Gas 提交。
5. 等待交易确认。
6. 将授权状态写入 WF。

官方说明：Deposit Wallet、Safe Wallet、Proxy Wallet 的交易授权可以通过免 Gas 交易提交。

---

### 5.6 查询市场和盘口

#### 业务流程

1. WF 查询 Polymarket 市场列表。
2. 用户选择某个市场和结果。
3. WF 获取：
   - 市场状态；
   - condition ID；
   - outcome token ID；
   - 最小价格增量；
   - 最小下单数量；
   - 交易延迟；
   - 当前盘口；
   - 交易费用。
4. WF 将可交易市场展示给用户。
5. 用户提交买入或卖出意图。

#### Polymarket 服务

使用 Public Client 或市场数据接口：

- `listMarkets()`；
- `fetchMarket()`；
- 价格和 Order Book 接口；
- 市场详情接口。

订单必须使用 outcome token ID，而不是直接使用市场名称或 slug。

相关文档：

- [Market Data](https://docs.polymarket.com/market-data/overview)
- [Prices and Order Books](https://docs.polymarket.com/market-data/prices-order-books)
- [Market Details](https://docs.polymarket.com/market-data/market-details)

---

### 5.7 用户下注/买入

“下注”在 Polymarket 中应抽象为买入某个 outcome token。

#### 限价买单

适合用户指定价格。

#### 业务流程

1. 用户选择：
   - 市场；
   - YES 或 NO；
   - 买入价格；
   - 数量；
   - GTC 或 GTD。
2. WF 校验：
   - 市场仍在交易；
   - 用户余额；
   - 最小订单金额；
   - 价格精度；
   - 数量精度；
   - 风控限额。
3. WF 使用 Session Key 创建 Secure Client。
4. 调用：

```text
placeLimitOrder()
```

5. Polymarket CLOB 返回：
   - order ID；
   - order status；
   - trade IDs；
   - transaction hashes，可能暂时为空。
6. WF 保存订单。
7. 使用订单查询或实时订阅持续更新状态。

#### 市价买单

可以使用：

```text
estimateMarketPrice()
placeMarketOrder()
```

买入时：

- `amount` 表示计划花费的美元金额；
- 可以使用 `maxPrice` 限制最大成交价；
- 可以使用 `maxSpend` 限制包含费用的总支出；
- 通常使用 FAK 或 FOK。

#### 订单成交的异步性

订单被 CLOB 接受不等于链上结算完成。

成交后应使用：

```text
waitForOrderFillSettlement()
```

等待交易结算，或使用实时订单更新机制监听。

相关文档：

- [Place Orders](https://docs.polymarket.com/trading/place-orders)
- [Order Lifecycle](https://docs.polymarket.com/concepts/order-lifecycle)

---

### 5.8 撤单

#### 业务流程

1. 用户在 WF 查看未完成订单。
2. 用户选择撤销某个订单。
3. WF 校验该订单属于当前用户。
4. WF 使用 Session Key 调用撤单接口。
5. 更新本地订单状态。
6. 通过实时订单流或再次查询确认订单已经取消。

#### Polymarket 接口

官方订单管理能力包括：

- `fetchOrder()`；
- `listOpenOrders()`；
- `cancelOrder()`；
- 批量取消订单；
- 取消全部订单。

建议优先使用单订单取消，只有在风险控制或账户异常时才使用账户级全部撤单。

部分成交订单撤单时，只会取消尚未成交的剩余数量。

相关文档：

- [Manage Orders](https://docs.polymarket.com/trading/manage-orders)

---

### 5.9 卖出持仓

“卖单”与“提现”不是一回事。

#### 卖单本质

卖单是将持有的 outcome token 通过 CLOB 卖给市场流动性，所得变成 Polymarket 账户中的交易余额。

#### 业务流程

1. WF 查询用户持仓。
2. 用户选择：
   - 市场；
   - outcome token；
   - 卖出数量；
   - 限价或市价。
3. WF 校验用户持有数量。
4. 调用：

```text
placeLimitOrder({
  side: SELL
})
```

或：

```text
estimateMarketPrice()
placeMarketOrder({
  side: SELL
})
```

卖出市价单时，官方要求使用：

- `shares` 表示卖出份额；
- `minPrice` 表示最低可接受价格。

5. 等待订单成交。
6. 等待链上结算。
7. 更新持仓、交易余额和盈亏。

---

### 5.10 查询订单、成交和持仓

WF 不应只依赖自身数据库，而应定期与 Polymarket 做对账。

#### 订单

```text
fetchOrder()
listOpenOrders()
```

#### 成交

```text
listAccountTrades()
```

#### 持仓

```text
listPositions()
listClosedPositions()
```

#### 账户活动

```text
listActivity()
fetchPortfolioValue()
fetchNotifications()
```

#### 实时同步

建议同时使用：

- CLOB WebSocket 用户订单流；
- 实时订单和成交更新；
- 钱包 Activity；
- Polygon 链上事件监听；
- 定时全量对账。

需要特别注意：Session Key 只能读取自己提交的订单和交易，Deposit Wallet Owner 不能直接读取 Session Key 创建的订单。因此 WF 的订单服务应使用正确的 Session Key 或使用账户级数据接口进行汇总。

---

### 5.11 市场结束后领取收益

Polymarket 官方将这个过程称为 Redeem，而不是普通 API 提现。

#### 业务流程

1. WF 查询市场是否已经 resolved。
2. 确认用户持有获胜 outcome token。
3. 检查 Deposit Wallet 是否已配置相关授权。
4. 使用 Owner Signer 创建 Secure Client。
5. 调用：

```text
redeemPositions()
```

6. 等待链上交易确认。
7. 获胜 token 转化为 pUSD。
8. 更新 WF 用户可提现余额。
9. 根据业务规则继续转回 AA Wallet。

#### 官方规则

- 获胜 token 可以兑换为 pUSD；
- 失败 token 兑换价值为 0；
- 没有强制领取截止时间；
- `redeemPositions()` 不需要传数量，会兑换钱包内对应市场的余额。

相关文档：

- [Manage Positions](https://docs.polymarket.com/trading/positions/manage)

---

### 5.12 提现回 WF AA Wallet

#### 业务流程

```text
Polymarket Deposit Wallet
      ↓ ERC-20 transfer
WF AA Wallet
      ↓
用户外部钱包
```

1. 用户发起提现。
2. WF 检查：
   - 可提现余额；
   - 未结算订单；
   - 未完成成交；
   - 风险冻结；
   - 最小提现金额；
   - 目标地址。
3. 如资金仍在 outcome token 形态，先执行：
   - `redeemPositions()`；
   - 或必要时 `mergePositions()`。
4. 使用 Owner Signer 调用：

```text
transferErc20()
```

5. 资金转入 WF AA Wallet。
6. 监听链上确认。
7. 更新 Polymarket 余额、WF 账本和提现记录。
8. 如有需要，再由 WF AA Wallet 转到用户外部地址。

#### 关键限制

Session Key 不能提现。因此提现不能只依靠交易 Session Key，必须使用 Deposit Wallet Owner Signer 或其他具备资金权限的授权方式。

---

## 六、对“用户免签名、WF 代签名”的可行性判断

### 6.1 交易操作：可行

以下操作可以通过 Session Key 实现用户免逐笔签名：

- 下限价单；
- 下市价单；
- 卖出；
- 撤单；
- 查询该 Session Key 创建的订单；
- 查询该 Session Key 相关交易。

推荐权限：

```text
SessionKeyKnownScope.CLOB
```

### 6.2 资金操作：有条件可行

以下操作需要 Owner Signer：

- Deposit Wallet 创建；
- ERC-20 授权；
- ERC-1155 授权；
- AA Wallet 与 Deposit Wallet 之间转账；
- Split；
- Merge；
- Redeem；
- Deposit Wallet 提现；
- Session Key 授权和撤销。

这些操作可以由 WF 后端自动发起，并通过 Relayer/Builder API 免 Gas，但必须由 WF 持有或调用 Owner Signer 完成签名。

### 6.3 完全依赖 Privy Signer：需要技术验证

Polymarket 官方示例使用：

```text
privateKey(...)
```

或其他支持的钱包签名适配器。

因此需要确认 Privy Signer 是否能满足以下要求：

1. 能在服务端执行 EVM EIP-712 签名；
2. 能签署 Polygon 链上交易；
3. 能作为 `createSecureClient` 的 signer；
4. 能安全处理 Deposit Wallet Owner 签名；
5. 不要求把私钥导出给 WF；
6. 能支持签名超时、失败重试和签名审计；
7. 能与 Builder API/Relayer API 配合。

如果 Privy 只提供前端用户登录，而不能提供后端受控签名，则不能直接实现 WF 代签名。

---

## 七、不建议继续沿用的表述

### 7.1 “Polymarket Trading Wallet”

建议正式命名为：

```text
Polymarket Deposit Wallet
```

因为这是官方当前使用的账户类型。

### 7.2 “Polymarket Wallet Batch”

该名称不是当前官方账户模型中的标准术语，需要确认其真实含义：

- 是否为批量钱包合约；
- 是否为旧版 Proxy Wallet；
- 是否为交易归集钱包；
- 是否为 Polymarket 内部服务组件；
- 是否仅用于资金批量转移。

在未确认前，不应把它作为核心账户模型设计。

### 7.3 “领取收益调用 Polymarket API”

更准确的说法是：

> 市场结算后，由 WF 使用 Owner Signer 调用 Polymarket SDK 的 `redeemPositions()`，提交链上赎回交易。

它不是简单的 CLOB 查询 API，而是链上持仓生命周期操作。

---

## 八、必须确认的关键问题

### A. 账户与签名

1. 每个 WF 用户是否创建独立的 Polymarket Deposit Wallet？
2. Privy Signer 是否作为每个用户 Deposit Wallet 的 Owner Signer？
3. Privy 是否支持服务端 EVM 交易签名和 EIP-712 签名？
4. Session Key 是由 WF 统一管理，还是每个用户独立管理？
5. Session Key 私钥是否存储在 HSM/KMS 中？
6. 是否接受 Session Key 当前最长 180 天的限制？
7. WF 是否需要支持提前撤销和密钥轮换？

### B. AA Wallet 与 Polymarket Wallet 的关系

8. WF AA Wallet 是否只作为充值/提现账户？
9. Polymarket Deposit Wallet 是否作为独立交易账户？
10. 是否要求用户在链上直接拥有 Deposit Wallet？
11. WF 是否承担 Polymarket 资产的托管责任？
12. 用户能否直接查看 Polymarket Deposit Wallet 地址和资产？

### C. 资金与资产

13. 当前 Polymarket 生产环境使用的抵押资产具体是什么？
14. 是否支持从 WF AA Wallet 直接转入 Deposit Wallet？
15. 充值后是否需要额外的 ERC-20 或 ERC-1155 授权？
16. 提现必须先回 AA Wallet，还是允许直接转到用户外部地址？
17. 用户是否允许把 Polymarket 资金转入彩票账户？
18. 彩票资金和 Polymarket 资金是否需要完全隔离？

### D. 交易业务

19. “下注”是否只包含买入，还是包含限价单和市价单？
20. 是否允许 GTC、GTD、FAK、FOK 等不同订单类型？
21. 用户是否允许挂单后长期持有？
22. 卖单是否只允许卖出已有持仓？
23. 是否需要自动撤单、价格保护和最大滑点控制？
24. Polymarket 交易延迟市场如何在 WF 中展示和处理？
25. 订单成交但链上结算延迟时，WF 如何展示状态？

### E. 结算和账务

26. WF 账本以 Polymarket API 结果为准，还是以链上最终状态为准？
27. 是否需要保存完整的 order、trade、transaction hash 和 block number？
28. 是否需要支持链上重组、交易失败和重复回调处理？
29. 市场结算后，是自动 redeem 还是用户点击领取？
30. 未领取的获胜仓位是否持续计入用户可提现余额？

### F. 合规和平台限制

31. WF 的用户地区是否满足 Polymarket 当前地理可用性要求？
32. 是否需要调用或集成 Polymarket Geoblock 检查？
33. 是否需要 KYC、AML、制裁名单和地区限制？
34. 是否需要与 Polymarket 申请 Builder Program？
35. 是否已获得 Session Key 管理权限？
36. 是否接受 Builder API、Relayer API 的密钥管理责任？

---

## 九、推荐的落地顺序

### 第一步：确认 Polymarket 账户模型

先验证：

- Deposit Wallet 创建；
- Builder API Key；
- Owner Signer；
- Privy Signer 兼容性。

### 第二步：完成最小交易闭环

只实现：

```text
创建 Deposit Wallet
→ 授权 Session Key
→ 充值 pUSD
→ 查询市场
→ CLOB 下单
→ 撤单
→ 查询成交
→ 查询持仓
```

### 第三步：完成持仓生命周期

加入：

```text
卖出
→ 市场结算
→ redeemPositions()
→ 转回 AA Wallet
```

### 第四步：完成异常和对账

重点测试：

- Session Key 过期；
- Session Key 撤销；
- 订单重复提交；
- 订单部分成交；
- CLOB 接受但链上尚未结算；
- redeem 失败；
- Relayer API 超时；
- Polygon 链上交易失败；
- Polymarket API 与链上状态不一致。

---

## 十、可直接用于项目立项的方案表述

> WF 可以以 Polygon AA Wallet 作为用户在 WF 内的主账户，并为每个用户创建独立的 Polymarket Deposit Wallet。通过 Privy 管理 Owner Signer，通过 Polymarket Session Key 实现 CLOB 交易代签名，用户可以免除下单、卖单和撤单时的逐笔钱包签名。充值、提现、授权、领取收益等资金和链上操作仍需要 Owner Signer 代签名，可通过 Polymarket Relayer/Builder API 实现免 Gas。WF 需要维护用户级订单、成交、持仓、资金和结算账本，并以 Polymarket API 与 Polygon 链上状态进行双向对账。

该方案的前置条件是：Privy 支持服务端 EVM/EIP-712 签名；WF 获得 Polymarket Builder/Relayer 相关权限；每个用户采用独立 Deposit Wallet；Session Key 仅授予 CLOB 权限；提现和收益领取由 Owner Signer 执行；同时完成地区可用性、KYC/AML 和平台合规确认。


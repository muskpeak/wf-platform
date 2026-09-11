# WF V4 代理商技术接入文档

项目合约 GitHub 仓库：[wf-protocol/wf-contracts](https://github.com/wf-protocol/wf-contracts)。

适用对象：在自有网站、App 或服务中接入 WF 彩票的第三方代理商开发团队。

适用版本：[v4 分支](https://github.com/wf-protocol/wf-contracts/tree/v4)，固定提交：[f8b498a4b431244659bf02e306932eb4e994bcd7](https://github.com/wf-protocol/wf-contracts/commit/f8b498a4b431244659bf02e306932eb4e994bcd7)，核对日期 2026-09-08。支持 Lotto3D 和 World Lotto UMA。

本文说明合约接入方式。HTTP API、SDK、线上地址和代理商务规则不属于该合约仓库已提供的接口，需要由 WF 另行交付。下文方法均在该提交源码中核对；生产部署和实际服务尚未在本文核验。

配套产品流程：[代理商用户流程全集](WF_V4_PARTNER_USER_FLOWS_ZH.md)，覆盖正常操作、异常恢复、赠票、领奖退款、提现及代理门户流程。

## 1. 接入流程

```text
获取部署配置与渠道编码
  -> 用户连接钱包、选择正确网络
  -> 充值稳定币获得 WUSD（余额不足时）
  -> 查询可售期次、选择号码、获取报价
  -> 创建带渠道编码的订单、用户确认或签名
  -> 提交购买交易
  -> 扫描确认事件，取得订单对应的全部票号
  -> 跟踪开奖、结算、领奖或取消退款
  -> 按已结算销售与 WF 核对渠道佣金
```

代理可以采用以下任一种购买方式：

| 方式 | 调用者 | 用户操作 | gas 支付者 |
| --- | --- | --- | --- |
| 用户直接购买 | 用户钱包调用 Ledger `executePurchaseV4` | 确认链上购买交易 | 发交易的钱包，或其钱包基础设施安排的支付方 |
| 代理代提交 | 代理 relayer 调用 Ledger `executePurchaseWithAuthorizationV4` | 签署一次 EIP-712 购买授权 | 代理 relayer |

两种方式都从请求中 `owner` 的 WUSD 余额扣款。普通代理转发有效购买签名不需要链上管理角色；合约不自动报销 relayer 的 gas。

## 2. 接入前获取的配置

向 WF 获取下表信息后，再配置目标网络和合约实例。

| 配置 | 内容 |
| --- | --- |
| 网络 | `chainId`、HTTP RPC、可选 WebSocket RPC、确认/最终性策略 |
| 部署版本 | 部署标识、源码提交、ABI 文件、各合约部署起始区块、proxy 和实现身份 |
| 公共合约 | UnifiedLedgerV4、StablecoinReserve、GameRegistry、ProtocolRevenueRouter 地址 |
| Lotto3D | WusdLotto3DGame、WusdLotto3DTreasury、Lotto3DVRFAdapter 地址 |
| World Lotto | WusdLottoRounds、WusdLottoTreasury、LottoSettlement、LottoOracleAdapter 地址 |
| 稳定币 | 支持的 token 地址；精度、折算率、开关及限额以 Reserve 配置为准 |
| 渠道 | 本代理 `partnerCode`、bytes32 编码规范、`wfOrderId` 生成和唯一性规则 |
| 充值服务 | 由 Reserve 配置 signer 签发充值授权的服务接入信息 |
| 对账服务 | 代理费率、结算周期、账单查询/交付方式、收款地址及付款凭证约定 |

**该版本要求全新部署。** 不能把旧版 Ledger 的地址、余额、nonce 或票号直接用于此版本。本文不填入未核验的生产地址，也不把本地测试链配置当成线上配置。

### 2.1 需要用到的公共合约

下表的合约名对应应使用的 ABI。所有地址均由 WF 按目标网络和部署版本提供；一个代理接入同一部署的两种彩票时，共用 Ledger、Reserve、Registry 和 Router。

| 合约名称 | 是否需要 | 用途及主要交互 |
| --- | --- | --- |
| `UnifiedLedgerV4` | 必需 | 统一 WUSD 余额和购买入口；调用 balanceOf、purchaseNonces、executePurchaseV4 / executePurchaseWithAuthorizationV4；监听 PurchaseExecutedV4 和账本余额事件 |
| `GameRegistry` | 必需 | 查询游戏是否可用以及对应 Treasury；调用 getGameConfig、isActive；监听 GameStatusChanged、GameReviewChanged 等配置事件 |
| `StablecoinReserve` | 提供充值/提现时必需 | 查询资产配置和报价，调用 deposit / withdraw；监听 Deposited、Withdrawn 和资产配置事件 |
| 实际稳定币 ERC-20 合约，如部署支持的 USDT / USDC | 提供充值/提现时必需，按币种配置 | 读取 decimals、balanceOf、allowance，用户调用 approve 授权 Reserve；实际可用 token 地址以 WF 部署清单和 Reserve.assetConfigs 为准 |
| `ProtocolRevenueRouter` | 查询分配版本历史、监听全局费率变更时需要 | 调用 activeAllocation、allocation(uint32 version)；监听 RevenueAllocationUpdated。订单历史费率以对应 Treasury 的期次快照为准 |

WUSD 不需要另配 ERC-20 token 地址；WUSD 余额查询使用 Ledger.balanceOf，稳定币授权的 spender 使用 Reserve 地址。

### 2.2 接入 Lotto3D 需要的合约

| 合约名称 | 是否需要 | 用途及主要交互 |
| --- | --- | --- |
| `WusdLotto3DGame` | 接入 3D 必需 | 购买请求的 game 填此地址；查询期次、报价和票据，调用 claim / batchClaim / refundTicket；监听 LedgerPurchase、TicketPurchased、RoundSettled 等游戏事件 |
| `WusdLotto3DTreasury` | 3D 渠道对账和完整资金/领奖期限索引必需 | 查询 roundRevenueAllocation、partnerReserveAccrued 等；监听 RoundAllocationSnapshotted、RoundRevenueFinalized、PartnerReserveClaimed 和奖金责任/过期事件。普通代理不直接调用其派奖或渠道池提取方法 |
| `Lotto3DVRFAdapter` | 展示随机数请求进度或承担 keeper 时需要 | 监听 DrawRequested、RandomnessStored 等；承担 keeper 时按权限调用 requestDraw，按状态调用 finalizeDraw |

3D 的查询、报价、领奖和退款入口都是 Game；购买交易入口仍为 Ledger，Treasury 不是用户购票入口。

### 2.3 接入 World Lotto UMA 需要的合约

| 合约名称 | 是否需要 | 用途及主要交互 |
| --- | --- | --- |
| `WusdLottoRounds` | 接入 World 必需 | 购买请求的 game 填此地址；查询期次、报价、票据，调用 refundTicket；监听 LedgerPurchase、TicketPurchased、DrawSubmitted、RoundCancelled 等 |
| `LottoSettlement` | 接入 World 必需 | 查询 getRoundSettlement，持票人调用 claim；监听 SettlementPosted、PrizeClaimed；承担结算推进时调用 processSettlement / postSettlement |
| `WusdLottoTreasury` | World 渠道对账和完整资金/领奖期限索引必需 | 查询期次分配快照和渠道池；监听 RoundRevenueFinalized、PartnerReserveClaimed、RoundPrizesReserved、RoundPrizesExpired 等 |
| `LottoOracleAdapter` | 展示 UMA 断言/争议详情或承担 oracle 运维时需要 | 读取 getDrawRequest，监听 DrawAssertionRequested、DrawAssertionDisputed 等；按权限和状态调用 assertDraw、settleAssertion、finalizeAssertionOutcome |

World 的购买请求指向 Rounds，领奖调用 Settlement，退款调用 Rounds，分佣资金事件来自 Treasury。这四类地址不能互换。

### 2.4 协议内部或外部依赖合约

以下不是普通代理售票必须直接调用的合约；需要专项功能时再获取相应地址和 ABI。

| 合约/配置地址 | 何时需要 | 普通代理的接入边界 |
| --- | --- | --- |
| `partnerPayoutSafe` 配置的收款/归集地址 | 核验渠道归集收款方；代理另行承担 Safe 归集管理时 | 从各 Treasury.partnerPayoutSafe() 读取；只有配置地址可调用 claimPartnerReserve。需要通过 Safe 执行时，另行使用已核验 Safe 部署和 ABI |
| `DatRevenueVault` | 展示或审计 DAT 收入时 | 属于 DAT 收入去向，不是代理佣金领取入口；普通代理不需要接入其 claim 方法 |
| Chainlink VRF Coordinator | 承担 VRF 订阅运维或核查底层随机数请求时 | 普通代理通过 Lotto3DVRFAdapter 获取游戏相关状态，无需直接请求 Coordinator |
| UMA Optimistic Oracle V3 | 参与 UMA 争议或核查底层断言时 | 普通代理通过 LottoOracleAdapter 和 Rounds 跟踪结果；直接参与争议需另行遵循 UMA 接口和保证金规则 |

### 2.5 地址交付与最小配置

按“使用已有 WUSD、售票、查询结果、领奖退款和渠道对账”的范围，3D 需要 Ledger、Registry、3D Game、3D Treasury；World 需要 Ledger、Registry、World Rounds、Settlement、World Treasury。需要充值提现时增加 Reserve 与实际 token；需要详细开奖进度时增加相应 Adapter；需要全局分配版本历史时增加 Router。

上述 WF 合约中，Ledger、Reserve、Registry、两个游戏、两个 Treasury、Settlement 和两个 Adapter 使用业务 proxy 地址调用和扫描；Router 在该版本是普通合约，使用其部署地址。实现地址用于版本核验，不替代业务 proxy 地址。

WF 应为每个需要接入的地址交付 `chainId`、合约名、业务地址、部署区块和匹配 ABI；proxy 另附实现地址/身份。代理启动时复核 Ledger.gameRegistry()、游戏的 ledger()/treasury()、World Settlement.rounds()/treasury() 等关联关系，避免混用不同部署。

## 3. 通用数据约定

| 字段 | 含义与约定 |
| --- | --- |
| WUSD | Ledger 内部余额，固定 6 位小数，`1 WUSD = 1_000_000`；不是本分支提供的可自由转账 ERC-20 |
| `owner` / `payer` | 付款人，购买时扣除其 WUSD |
| `beneficiary` / 购票事件中的 `buyer` | 持票人，中奖后有权领奖 |
| `submitter` | 提交 Ledger 购买调用的地址，可能是 relayer；不能用来判断渠道归属 |
| `partnerCode` | bytes32 渠道标识，按与 WF 约定的编码使用 |
| `wfOrderId` | bytes32 订单标识；非零值在同一 Ledger 内跨用户、跨游戏只能成功使用一次 |
| `receiptId` | 合约输出的购买回执标识，用于关联 Ledger 订单与游戏购买记录 |
| `ticketId` | 单张彩票标识，一笔购买可以生成多张票；必须结合游戏地址使用 |
| `roundId` | 游戏期号，结合游戏地址使用；游戏方法通常为 uint40，收入事件为 uint256 |
| `nonce` | Ledger 中每个 owner 的递增购买序号，跨游戏共享；不是钱包发交易的 transaction nonce |
| `deadline` | Unix 秒级过期时间，购买请求类型为 uint48；不要传毫秒 |

所有金额和大整数用 BigInt 或十进制字符串传递和存储，不能用浮点数计算资金。

## 4. 合约方法：查询与购买

### 4.1 查询方法

| 合约 | 方法 | 返回/用途 |
| --- | --- | --- |
| Registry | `getGameConfig(address game)` | 游戏 Treasury、oracleAdapter、实现/规则哈希和状态；返回结构以 ABI 为准 |
| Registry | `isActive(address game)` | bool；下单前确认游戏可用，包含实现哈希匹配检查 |
| Ledger | `balanceOf(address account)` | uint256；用户 WUSD 余额 |
| Ledger | `purchaseNonces(address owner)` | uint256；下一笔购买使用的 nonce |
| Ledger | `usedWfOrderIds(bytes32 wfOrderId)` | bool；检查非零订单号是否已成功使用 |
| Ledger | `hashPurchaseAuthorizationV4(PurchaseRequestV4 request)` | bytes32；校验本地生成的 EIP-712 摘要 |
| 3D Game / World Rounds | `latestRoundId()` | uint40；最新创建的期号，不保证当前可售 |
| 3D Game / World Rounds | `getRound(uint40 roundId)` | 各游戏 RoundData；读取存在标记、状态和销售时间等，二者结构不同 |
| 3D Game / World Rounds | `ticketPrice()` | uint256；六位 WUSD 计价的单份票价 |
| 3D Game / World Rounds | `quotePurchase(address payer, address beneficiary, bytes purchaseData)` | uint256；本次购买金额，包含游戏侧号码/期次等校验 |
| Ledger / 3D Game / World Rounds | `paused()` | bool；辅助判断购买是否可用 |

可售检查必须同时看链上状态和时间。未收到 `SalesClosed` 或 `latestRoundId()` 有值，不表示该期可以购买。报价成功也不保证正式执行成功，仍须模拟 Ledger 购买交易并处理状态变化。

### 4.2 编码 purchaseData

| 游戏 | 编码类型，顺序不可改变 | 规则 |
| --- | --- | --- |
| Lotto3D | 标准 ABI 编码 `uint40 roundId, uint16[] numbers` | 号码 0..999，显示补齐 3 位；无倍数；每个持票地址每期最多 10 张；`owner` 必须等于 `beneficiary` |
| World Lotto UMA | 标准 ABI 编码 `uint40 roundId, uint32[] numbers, uint16[] multipliers` | 号码 0..9,999,999，显示补齐 7 位；两个数组非空等长，单次最多 100 张；倍数 1..该期 maxMultiplierPerTicket；允许 owner 与 beneficiary 不同 |

使用 ABI encoder，例如 ethers 的 AbiCoder 或 viem 的 encodeAbiParameters。不得用 JSON 字符串或 packed 编码替代。

3D 金额为 `ticketPrice * numbers.length`；World 为 `ticketPrice * sum(multipliers)`。以 `quotePurchase` 返回值填入请求 `amount`。

### 4.3 构造购买请求

以下结构作为方法参数中的 tuple，字段顺序和整数宽度必须与 ABI 一致：

```solidity
struct PurchaseRequestV4 {
    address owner;
    address game;
    address beneficiary;
    uint256 amount;
    bytes32 purchaseDataHash;
    bytes32 wfOrderId;
    bytes32 partnerCode;
    uint256 nonce;
    uint48 deadline;
}
```

填充规则：`purchaseDataHash = keccak256(purchaseData)`；`game` 填 3D Game 或 World Rounds 地址；`nonce` 从 Ledger 读取。代理渠道购买应填写同时非零的 `wfOrderId` 和 `partnerCode`；无渠道购买才将二者同时置零。不能只填其中一个。

`partnerCode`、`wfOrderId` 的字符串转换/哈希算法由双方约定，合约不定义该算法，也不验证该 code 是否属于获批代理。代理商务身份仍需在 WF 的渠道系统确认。

### 4.4 用户签名与提交

EIP-712 domain：

| 字段 | 值 |
| --- | --- |
| `name` | `UnifiedLedger` |
| `version` | `4` |
| `chainId` | 目标网络 chainId |
| `verifyingContract` | 本次部署的 Ledger proxy 地址 |

primaryType 为 `PurchaseRequestV4`，types 按上面的 struct 定义。签名者必须是 `owner`，不是代理。该购买授权支持 EOA 与 ERC-1271 合约钱包。完整 type string 为：

```text
PurchaseRequestV4(address owner,address game,address beneficiary,uint256 amount,bytes32 purchaseDataHash,bytes32 wfOrderId,bytes32 partnerCode,uint256 nonce,uint48 deadline)
```

| 合约 | 写入方法 | 调用要求 |
| --- | --- | --- |
| Ledger | `executePurchaseV4(PurchaseRequestV4 request, bytes purchaseData)` | owner 直接调用；无需额外的 EIP-712 购买签名 |
| Ledger | `executePurchaseWithAuthorizationV4(PurchaseRequestV4 request, bytes purchaseData, bytes signature)` | 任意提交者携带 owner 的有效授权；适用于代理代付 gas |
| Ledger | `invalidatePurchaseNonce(uint256 newNonce)` | owner 调用，newNonce 必须大于当前值；使旧序号的未执行授权失效，暂停时仍可用 |

两种购买方法返回 bytes32 receiptId；普通发交易接口首先返回的是 txHash，实际 receiptId 应从成功回执事件提取。不得由代理直接调用游戏的 `purchaseFromLedgerV4`，该入口只接受 Ledger。

`allocationVersion` 和 `partnerBps` 由合约读取期次快照后输出，不是用户签名字段。修改已经签名的购买字段，或切换链/部署地址，都需要重新获得有效授权。

同一 owner 的多个订单需协调 nonce，并处理其他站点/钱包同时消费 nonce 的情况。失败的购买会回滚合约购买 nonce 和订单号占用；成功后即使该期取消退款，wfOrderId 仍不可重复使用。

## 5. 合约方法：充值、提现、领奖和退款

### 5.1 充值和提现

代理仅使用现有 WUSD 余额售票时，可不自建充值界面；需要集成钱包资金功能时使用以下接口。

| 合约 | 方法 | 用途/调用者 |
| --- | --- | --- |
| Reserve | `assetConfigs(address token)` | 读取支持状态、充值/提现开关、精度、折算率和限额 |
| Reserve | `previewDeposit(address token, uint256 tokenAmount)` | 预估可获得 WUSD |
| Reserve | `previewWithdraw(address token, uint256 wusdAmount)` | 预估换出 token；实际收款以事件为准 |
| 稳定币 ERC-20 | `approve(address spender, uint256 amount)` | 用户授权 Reserve 使用稳定币，spender 为 Reserve 地址 |
| Reserve | `deposit(address token, uint256 amount, uint256 authorizedAmount, uint256 minWusdOut, uint256 deadline, uint256 nonce, bytes signature)` | 用户发起充值，返回 received 和 wusdCredited |
| Reserve | `withdraw(address token, uint256 wusdAmount, uint256 minTokenOut, address recipient)` | WUSD 所有人发起提现，可指定收款人；返回实际收到的 tokenAmount |
| Reserve | `usedNonces(address user, uint256 nonce)` | 检查充值授权是否使用，独立于 Ledger 的购买 nonce |

充值顺序为：获取 WF 充值授权，检查/完成 ERC-20 allowance，再调用 deposit。充值授权的签名者是 Reserve 配置的 `signer`，不是购买请求中的用户签名；普通代理不能自行签发，除非其受控签名地址被配置为 signer。

充值 domain 为 `name = WUSDStablecoinReserve`、`version = 1`，绑定目标 chainId 和 Reserve proxy；签名类型为：

```text
DepositAuthorization(address user,address token,uint256 authorizedAmount,uint256 deadline,uint256 nonce)
```

`amount` 不得大于 authorizedAmount；该 nonce 成功使用一次即失效。充值金额 token 使用其自身精度，minWusdOut 使用六位 WUSD 精度。提现的 wusdAmount 使用六位 WUSD 精度，minTokenOut 使用所选 token 精度。

充值按合约实际收到的 token 数量折算。直接向 Reserve 转 token 不会自动记入用户 WUSD。提现只扣调用者余额，不支持普通代理 EOA 代扣其他用户提现。充值暂停不自动禁止提现，但提现仍受币种开关、限额和真实储备约束。

### 5.2 票据查询、领奖和退款

| 合约 | 方法 | 用途/要求 |
| --- | --- | --- |
| 3D Game | `tickets(uint256 ticketId)` | buyer、roundId、number、claimed、refunded |
| 3D Game | `roundClaimDeadline(uint40 roundId)` | 该期结算后的实际领奖截止时间 |
| 3D Game | `claim(uint256 ticketId)` | 持票人调用，奖金记入其 WUSD |
| 3D Game | `batchClaim(uint256[] ticketIds)` | 持票人批量领取，最多 10 张；需处理无奖跳过和非法票导致整笔失败的情况 |
| 3D Game | `refundTicket(uint256 ticketId)` | 取消期次可用；任何人可触发，退回 buyer 的 WUSD |
| World Rounds | `getTicket(uint256 ticketId)` | buyer、payer、roundId、号码、倍数、paid 和领取/退款状态 |
| World Settlement | `getRoundSettlement(uint40 roundId)` | posted、各级 payout、中奖份数、carryNext、实际 claimDeadline |
| World Settlement | `claim(uint256 ticketId)` | 持票人调用，按最高中奖级别和 multiplier 支付，无需 Merkle proof |
| World Rounds | `refundTicket(uint256 ticketId)` | 取消期次可用；任何人可触发，退回 payer 的 WUSD |

World 领奖调用 **Settlement**，退款调用 **Rounds**；当前 World Settlement 没有 batchClaim。3D 的付款人与持票人相同；World 可不同，中奖归持票人，取消退款归付款人。

购买签名不赋予代理代领奖权。用户领奖需要其钱包作为调用者；代理可代付 gas 触发取消退款，收款人由合约决定。两类游戏均不在取消时自动逐票退款。

实际领奖期限按上表读取，尤其不能把 World Rounds 的初始 claimDeadline 当成最终期限。奖金/退款先到账 WUSD，需要再提现才收到稳定币。Ledger 暂停会影响 Treasury 派奖/退款的内部转账。

## 6. 必须监听的合约事件

### 6.1 订单、票据和期次

| 来源合约 | 事件 | 必须保存/处理的信息 |
| --- | --- | --- |
| Ledger | `PurchaseExecutedV4` | receiptId、owner、game、beneficiary、treasury、amount、purchaseDataHash、wfOrderId、partnerCode、allocationVersion、partnerBps、nonce、submitter；确认渠道订单 |
| 3D Game / World Rounds | `LedgerPurchase` | receiptId、roundId、payer、beneficiary、amount；连接订单与期次 |
| 3D Game | `TicketPurchased` | ticketId、roundId、buyer、number；创建票据 |
| World Rounds | `TicketPurchased` | ticketId、roundId、buyer、number、multiplier、paid；创建票据 |
| 3D Game / World Rounds | `RoundCreated` | 新增期次，补读 getRound；World 事件只有 roundId |
| 3D Game / World Rounds | `SalesClosed` | 更新停售状态，同时保留按时间停售的判断 |
| 3D Game | `RoundSettled` | 最终 winningNumber、prizePool、各级 prizePerUnit 与 winUnits；可以进一步判断领奖资格 |
| World Rounds | `DrawSubmitted` | 最终 winningNumber、sourceBundleHash；标记号码已确认，仍待奖金结算 |
| World Settlement | `SettlementPosted` | 各级 payout、winUnits、carryNext；标记奖金结算完成并读取实际领奖期限 |
| 3D Game / World Rounds | `RoundCancelled` | 该期进入可退款状态，取消相应佣金预估 |
| 3D Game / World Rounds | `TicketRefunded` | 按 ticketId 保存退款金额和收款人；多票订单可能部分退款 |
| 3D Game / World Settlement | `PrizeClaimed` | 按 ticketId 保存实际领奖地址、tier、amount |
| 3D Treasury | `RoundAccountingFinalized`、`RoundClaimsExpired` | 实际领奖期限、奖金责任和到期回收状态 |
| World Treasury | `RoundPrizesReserved`、`RoundPrizesExpired` | 实际领奖期限、奖金准备和到期回收状态 |

### 6.2 资金与渠道对账

| 来源合约 | 事件 | 必须保存/处理的信息 |
| --- | --- | --- |
| Reserve | `Deposited` | user、token、requestedAmount、receivedAmount、wusdCredited、nonce；实际充值结果 |
| Reserve | `Withdrawn` | user、token、recipient、wusdDebited、tokenAmount；实际提现结果 |
| Ledger | `ReserveCredit`、`ReserveDebit` | reserve、account、amount、newBalance；账本充值/提现变动 |
| Ledger | `BalanceTransferred` | from、to、amount；购买、派奖、退款和其他内部转账的余额变动 |
| Ledger | `ProtocolAccountFunded` | funder、account、amount；协议注资业务标记，与转账关联 |
| Ledger | `PurchaseNonceInvalidated` | owner、previousNonce、newNonce；使本地旧授权失效 |
| 两个 Treasury | `RoundAllocationSnapshotted` | roundId、version、prizeBps、datBps、partnerBps、opsBps；保存本期固定分配比例 |
| 两个 Treasury | `RoundRevenueFinalized` | sourceKey、roundId、allocationVersion、finalNetSales、prizeAmount、datAmount、partnerAmount、opsAmount；确认本期渠道池累计额 |
| 两个 Treasury | `PartnerReserveClaimed` | collectionId、accountingRoot、amount、reserveRemaining；记录渠道 Safe 归集，与链下账单关联 |

仅做销售/票据展示可不维护全账户余额索引；一旦展示用户完整资金流水，就必须覆盖相关 Ledger 余额事件，不能只用购票或充值事件计算余额。

### 6.3 开奖进度与配置变化

| 来源合约 | 监听事件 | 接入处理 |
| --- | --- | --- |
| 3D VRF Adapter | `DrawRequested`、`RandomnessStored`、`DrawFulfilled`、`DrawFinalized`、`TimedOutRequestCancelled` | 展示开奖进度；RandomnessStored 尚未完成结算，最终游戏状态看 RoundSettled / RoundCancelled |
| World Rounds | `DrawAssertionMarkedPending`、`DrawAssertionDisputed`、`DrawAssertionClearedForRetry` | 展示候选号码、证据和重试状态；候选号码不得展示为最终结果 |
| World Oracle Adapter | `DrawAssertionRequested`、`DrawAssertionDisputed`、`DrawAssertionResolved`、`DrawAssertionResolutionDeferred`、`DrawAssertionAbandoned` | 展示等待、争议、延迟落地等过程，结合 Rounds 状态判断 |
| World Settlement | `SettlementCountingProgress` | 展示 processed / total；processed 是累计值 |
| Registry | `GameRegistered`、`GameStatusChanged`、`GameReviewChanged` | 刷新所接游戏状态及配置；不要自动上架未经双方确认的新游戏 |
| Router | `RevenueAllocationUpdated` | 刷新新期可用分配版本；历史期仍按 Treasury 快照 |
| Reserve | `AssetAdded`、`AssetStatusUpdated`、`AssetRiskUpdated`、`SignerUpdated` | 更新充值/提现可用性和授权服务配置 |
| 适用合约 | `Paused`、`Unpaused`、`Upgraded`、`RoleGranted`、`RoleRevoked` | 更新可用性；升级或权限变化后复核部署与 ABI |

同名的 DrawAssertionDisputed 必须区分 Adapter 和 Rounds 来源：Adapter 的事件可能只表示争议开始，此时仍不能重试断言。部分配置变化不发专用事件，启动、升级和交易前还应读合约复核。

## 7. 事件解码与订单关联

### 7.1 关键事件的准确声明

```solidity
event PurchaseExecutedV4(
    bytes32 indexed receiptId,
    address indexed owner,
    address indexed game,
    address beneficiary,
    address treasury,
    uint256 amount,
    bytes32 purchaseDataHash,
    bytes32 wfOrderId,
    bytes32 partnerCode,
    uint32 allocationVersion,
    uint16 partnerBps,
    uint256 nonce,
    address submitter
);

event LedgerPurchase(
    bytes32 indexed receiptId,
    uint40 indexed roundId,
    address indexed payer,
    address beneficiary,
    uint256 amount
);
```

`partnerCode` 和 `wfOrderId` 未 indexed，不能放入 eth_getLogs 的 topics 直接过滤。扫描指定 Ledger 的 PurchaseExecutedV4 后解码 data，再按本代理 partnerCode 筛选。完整事件 ABI 使用 WF 提供的对应版本文件；不要仅凭事件名称生成解码器。

### 7.2 关联步骤

1. 按交易回执收集并按 logIndex 排序全部相关日志，校验发出事件的合约地址。
2. 使用 `PurchaseExecutedV4.receiptId` 匹配游戏的 `LedgerPurchase.receiptId`，取得 roundId。
3. 每次购买会先发出一组 TicketPurchased，再发出该次 LedgerPurchase。按游戏来源和购买段关联这一组票，再核对数量、金额和购买参数；有歧义时复核调用轨迹。
4. 形成 `wfOrderId -> receiptId -> game + roundId -> ticketIds[]`，保存 partnerCode、owner、beneficiary 和链上证据。
5. 后续使用 `game + ticketId` 更新领奖/退款，使用 `game + roundId` 更新开奖/取消，使用 `treasury + roundId` 关联收入。

不能假设一笔 txHash 只有一个订单，智能钱包批处理可能一次调用多笔购买。TicketPurchased 本身没有 partnerCode 或 receiptId，单独监听出票事件不能完整恢复渠道订单。

3D PrizeClaimed 的前两项为 `ticketId, roundId`，World Settlement 则为 `roundId, ticketId`。World TicketRefunded 的字段虽然名为 buyer，实际值是退款收款人 payer。按各自 ABI 解码，不共用参数位置。

### 7.3 成功判定与防重

- 广播成功只记“待确认”。交易成功、目标事件存在且达到约定最终性后，才确认出票或资金到账。
- 原始日志保存 chainId、address、blockNumber、blockHash、txHash、transactionIndex、logIndex，支持幂等、链重组撤销和区间补扫。
- 数据按 chainId 和部署地址隔离；ticketId、roundId 和 collectionId 都不能跨合约单独作为主键。零 wfOrderId 不可作为唯一订单键。
- 余额只从 Ledger 的 ReserveCredit、ReserveDebit、BalanceTransferred 计算；Deposited、Withdrawn、PrizeClaimed、Treasury ClaimPaid 等作为同笔业务的说明，不能重复加减余额。
- 过期回收可能同时在 Treasury 和外层 Game/Settlement 发同名事件，以 Treasury 为资金回收主记录；时间超过领奖期限即不可领奖，不必等待回收事件。
- 断线后从已完成区块补扫，保留最终确认区块高度供业务判断数据新鲜度；按同一区块读取余额/期次状态与索引对账。

## 8. 代理佣金与归集

代理通过 PurchaseExecutedV4 的 partnerCode 识别自己的销售，通过对应期次的 RoundRevenueFinalized 确认渠道资金池已累计，再按与 WF 约定的合同费率和账单核定应付。

| 合约 | 查询方法 | 用途 |
| --- | --- | --- |
| 对应 Treasury | `roundRevenueAllocation(uint256 roundId)` | 查询该期分配快照，含 version 和 partnerBps |
| 对应 Treasury | `partnerReserveAccrued()` | 查询该游戏当前未归集的全部渠道池金额 |
| 对应 Treasury | `partnerPayoutSafe()` | 查询允许归集的配置地址 |
| 对应 Treasury | `partnerBatchProcessed(bytes32 collectionId)` | 查询该 Treasury 是否已处理指定归集批次 |

整期渠道池为 `floor(finalNetSales * partnerBps / 10000)`。partnerBps 是渠道总池比例，**不是本代理最终费率**；该池也包含未标渠道销售对应的份额。最终以整期事件金额为准，避免逐订单取整后相加造成尾差。取消期次不累计渠道收入，3D 零销售结算可能不发收入事件。

`claimPartnerReserve(bytes32 collectionId, bytes32 accountingRoot, uint256 amount)` 仅允许配置的 partnerPayoutSafe 调用。普通代理没有凭 partnerCode 领取的合约方法，持有用户购买签名也不能提取渠道池。

PartnerReserveClaimed 只证明资金从 Treasury 进入该 Safe 的 WUSD 余额；accountingRoot 不由合约验证为逐代理权益。代理“已收款”必须关联实际向约定收款地址付款的交易或账单凭证，不能仅凭归集事件确认。

## 9. 开奖结算接口的接入边界

普通代理销售接入负责读取开奖结果、展示结算状态。创建期次、发起 oracle 请求、准备 World 证据和推进结算，需与 WF 明确由谁运行。只有另行承担这部分工作时才接入下表方法。

| 合约 | 方法 | 权限/前提 |
| --- | --- | --- |
| 3D VRF Adapter | `requestDraw(uint40 roundId)` | Adapter KEEPER；销售已截止且在请求期限内 |
| 3D VRF Adapter | `finalizeDraw(uint40 roundId)` | 公开调用；随机数已存储，前序期次满足结算条件 |
| World Oracle Adapter | `assertDraw(uint40 roundId, uint32 winningNumber, bytes32 sourceBundleHash, bytes32 normalizedDataHash, string normalizedDataUriOrSummary)` | ASSERTION_MANAGER；证据、保证金和期次条件满足 |
| World Oracle Adapter | `settleAssertion(bytes32 assertionId)` | 公开调用；UMA 已达到可裁决条件 |
| World Oracle Adapter | `finalizeAssertionOutcome(bytes32 assertionId)` | 公开调用；延迟落地状态满足重试条件 |
| World Settlement | `processSettlement(uint40 roundId, uint256 maxTickets)` | 公开调用；已确认号码且前序期已处理，分批统计到 cursor 等于票数 |
| World Settlement | `postSettlement(uint40 roundId)` | 公开调用；统计完成，或未开始统计且不超过 100 张可自动统计 |

“公开调用”仍需要 gas 和合约状态校验。3D RandomnessStored 后还需 finalize；World DrawSubmitted 后还需奖金结算。World 源数据、国家排序和证据包内容不能仅从链上哈希恢复，相关展示需要 WF 提供链下数据。

## 10. 错误处理与联调验收

| 情况/错误示例 | 代理处理 |
| --- | --- |
| `GameNotActive`、`RoundNotOpen`、暂停 | 刷新 Registry/期次/模块状态；停止提交不再可售的订单 |
| `InvalidPurchaseNonce`、`PurchaseExpired` | 先核查订单是否已成功，再重新读取 nonce/期限并请求用户重新确认；不修改签名后直接重发 |
| `WfOrderAlreadyUsed` | 查询已有链上订单并关联结果，不自动换新订单号重复购买 |
| `InvalidPurchaseSignature`、`PurchaseDataHashMismatch` | 核对 domain、owner、types、purchaseData 与 hash；修正后重新签名 |
| `InsufficientBalance`、`PurchaseAmountMismatch` | 分辨余额不足或报价不匹配；重新报价/充值，并更新用户授权 |
| `UnsupportedBeneficiary`、`MaxTicketsReached`、`InvalidMultiplier` | 按游戏限制修正购买数据，重新取得有效授权 |
| 购买已上链但接口超时 | 查回执、wfOrderId 和事件，幂等恢复订单，避免重复出票/扣款 |
| `AlreadyClaimed`、`AlreadyRefunded`、领奖过期 | 复核票据和实际截止时间，刷新用户状态 |

接入完成至少验证以下场景：

- 用户直购和代理代提交各一笔，订单、渠道、金额、期号和所有票号关联正确。
- 同一 owner 并发、过期授权、重复订单号、交易回滚和服务超时后恢复正确。
- 充值/提现按实际到账记账；同笔业务多层事件不会重复改变余额。
- 两种游戏完整走通开奖、结算、领奖；World 受益人不同场景的取消退款确实回 payer。
- 取消多票订单支持部分退款，中奖但未领奖、领奖过期和 oracle 待结算状态展示正确。
- 渠道池累计、归集和代理实际收款独立核对；扫链补扫、重复日志和重组可恢复。

## 11. 源码与 ABI 依据

以下链接固定到本文版本。使用对应编译产物的完整 ABI，包含继承事件和自定义错误；不要将本文节选声明当作完整 ABI。

- [独立 V4 部署说明](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/docs/STANDALONE_V4.md)
- [Ledger 购买接口](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/wusd/IUnifiedLedgerV4.sol) / [实现与事件](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/wusd/UnifiedLedgerV4.sol)
- [Reserve 充值提现](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/wusd/StablecoinReserve.sol)
- [Lotto3D Game](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/wusd/lotto3d/WusdLotto3DGame.sol) / [继承事件定义](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/lotto3d/interfaces/ILotto3DGame.sol)
- [World Rounds](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/wusd/lotto7uma/WusdLottoRounds.sol) / [继承接口](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/lotto7uma/interfaces/ILottoRounds.sol) / [World Settlement](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/lotto7uma/LottoSettlement.sol)
- [3D Treasury](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/wusd/lotto3d/WusdLotto3DTreasury.sol) / [World Treasury](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/wusd/lotto7uma/WusdLottoTreasury.sol)
- [3D VRF Adapter](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/lotto3d/Lotto3DVRFAdapter.sol) / [World Oracle Adapter](https://github.com/wf-protocol/wf-contracts/blob/f8b498a4b431244659bf02e306932eb4e994bcd7/src/games/lotto7uma/LottoOracleAdapter.sol)

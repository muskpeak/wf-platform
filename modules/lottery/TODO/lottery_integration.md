# 三方彩票游戏 (Polygon) 接入计划

（由于当前平台底层多链架构优先级更高，此对接计划暂时搁置在此，待基座搭建完毕后恢复执行）

## 1. 架构目标
为 WF 平台建立针对三方彩票游戏（Lotto3D / World Lotto）的适配层。

## 2. 交互 UX 决策
**采用“明确划转”模式（玩家买筹码）**。
- 考虑到三方充值流程（Backend 风控授权 -> 链上 Deposit -> 等待区块确认 -> Indexer 刷新）耗时较长，强制打包在“下注”按钮中体验较差。
- 在游戏界面提供【资金划转面板】，用户先将 AA 钱包里的 U（测试币）充值换成游戏内的 WUSD（筹码），然后再顺滑下注。

## 3. 具体实施步骤
### 3.1 适配器层 (`modules/lottery/src/adapter`)
- `LotteryAdapterProvider`：负责拉取三方的 `Manifest`，提供全局合约地址与当前环境上下文。
- `useFunding`：
  - 充值逻辑：`Approve` -> 申请 Backend `DepositAuthorization` -> 调用 `deposit`。
  - 提现逻辑：预估滑点 -> 调用 `withdraw`，目标地址设为当前用户的 AA 钱包。

### 3.2 UI 改造 (`modules/lottery/src/components`)
- `FundingPanel`：新建划转面板组件。展示【钱包余额】和【游戏内筹码(WUSD)】。
- `Lottery3DView` / `LotteryWorldView`：在现有的静态 UI 上绑定状态，当下注额度超过 WUSD 余额时，提示先划转。执行 `executePurchaseWithAuthorizationV4` 时发起 EIP-712 签名。

## 4. 候选环境合约清单 (待定)
- 详见：[STANDALONE_V4_CANDIDATE_ADDRESSES.md](./STANDALONE_V4_CANDIDATE_ADDRESSES.md)


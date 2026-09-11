# Polygon Mainnet Standalone V4 Candidate 合约地址清单 (待定)

> **来源文件**：`wf-frontend/packages/deployment/manifests/polygon-mainnet-standalone-v4.candidate.json`  
> **状态**：`candidate` (演练/候选环境，待定)  
> **网络**：Polygon Mainnet (ChainId: 137)  
> **部署批次 ID**：`polygon-mainnet-mock-standalone-v4-20260908`  
> **部署起始区块**：93431093  
> **代码版本 Commit**：`f8b498a4b431244659bf02e306932eb4e994bcd7`  

---

## 1. 核心资金与协议基础设施 (Core Infrastructure)

| 合约名称 | 作用说明 | 合约地址 | 起始区块 |
| :--- | :--- | :--- | :--- |
| **UnifiedLedger** (V4) | 平台统一游戏记账本（管理用户 WUSD 筹码与授权划转） | `0xC93f8062932bAFA24832B427d29A505395bc759D` | 93431120 |
| **StablecoinReserve** | 稳定币储备池（充值 mUSDC 兑换 WUSD、提现回 AA 钱包） | `0x68B6bf1EE6c464562A7296687a98cE40e334072C` | 93431145 |
| **GameRegistry** | 游戏注册中心（登记受信任游戏模块与权限路由） | `0x5afe077dAe1889fc05C22630c2EfAB991A4E3103` | 93431100 |
| **ProtocolRevenueRouter** | 协议收入分发路由器（处理 Partner 分润与金库归集） | `0xad246907C6967a8E2Ff26a51BCCe0E15825eeB6B` | 93431201 |
| **DatRevenueVault** | DAT 收益保险库 | `0x043B0C0bb9F46Cd7B42e9a9e09a9Dc919E13CeD2` | - |

---

## 2. 演练测试代币 (Tokens / GameTokens)

| 代币符号 | 代币类型 | 精度 | 合约地址 |
| :--- | :--- | :--- | :--- |
| **mUSDC** | 测试 USDC (充值储备池所用) | 6 | `0xc65577f875eBA302e4Ba5cDF429351b0Ce00A8bF` |
| **mUSDT** | 测试 USDT | 6 | `0x3aCF6C9F443b8806206dFac85205CaF15efae528` |

---

## 3. 彩票游戏业务合约 (Lottery Games)

### 3.1 World Lotto (Lotto7 UMA 版)
| 合约角色 | 对应合约实现 | 合约地址 | 起始区块 |
| :--- | :--- | :--- | :--- |
| **rounds** | `WusdLottoRounds` (期次管理、下注入口、倒计时与单价) | `0x9276F34f332d83e87Ee1810dd54237c732759420` | 93431315 |
| **treasury** | `WusdLottoTreasury` (奖金池资金库) | `0xB9710123FFB86080ef760ebE1005cBCA0eDD885A` | - |
| **settlement** | `LottoSettlement` (开奖与中奖结算合约) | `0xBCf4CeBD48e59335B8bbB58e8721506a3D63b8B8` | 93431333 |
| **oracleAdapter** | `LottoOracleAdapter` (UMA 预言机仲裁适配器) | `0xd11202491942Fa33E778667411927e8cf3FB1A69` | 93431345 |

### 3.2 Lotto 3D (经典 3D 彩票)
| 合约角色 | 对应合约实现 | 合约地址 | 起始区块 |
| :--- | :--- | :--- | :--- |
| **game** | `Lotto3DGame` (3D 游戏合约) | `0x18595d711ED9f58991ddb8cEA8B10032a56f600d` | 93431254 |
| **treasury** | `Lotto3DTreasury` (3D 资金库) | `0xa23370702EA2386ac7eCC814F5030A23AD4F26CA` | - |
| **vrfAdapter** | `Lotto3DVrfAdapter` (链上随机数适配器) | `0x54C5F9933d5E98C9cD5A428B5c64C7854C32b0D4` | 93431266 |

### 3.3 Lotto 7 (经典版 - 当前未在此环境启用)
| 合约角色 | 合约地址 |
| :--- | :--- |
| game | `0x0000000000000000000000000000000000000000` (未部署/Blocked) |
| treasury | `0x0000000000000000000000000000000000000000` |
| vrfAdapter | `0x0000000000000000000000000000000000000000` |

---

## 4. 待定与接入注意事项

1. **与 Active 生产环境对比**：
   - 生产 Active 环境使用 `0x0fCe21B4526FF050d3C6520b8Dbca7F8659FAc72` 作为 World Lotto 的 `rounds`。
   - 本清单中为 `0x9276F34f332d83e87Ee1810dd54237c732759420`，属于 Standalone V4 演练测试批次。
2. **渠道归因机制**：
   - `protocolV4.attribution = "EIP712_PARTNER_CODE"`，下注调用需附带 `partnerCode` 和 `wfOrderId`。

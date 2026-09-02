# Web3 Platform Frontend Architecture Specification

**Version:** 1.0.0  
**Status:** Recommended / Team Standard  
**Target:** Next.js + TypeScript + Web3 Platform + Multi-chain + Privy + AA  

---

## 1. Document Purpose

本文档是项目的前端架构规范（Architecture Specification），用于：

1. 约束 AI 编码助手的代码生成方式。
2. 约束现有开发者的目录、依赖和职责边界。
3. 作为新人加入项目后的第一份开发规范。
4. 保证平台可以持续接入 Lottery、Prediction、Swap、Bridge、Game、第三方特色项目等业务模块。
5. 避免 Privy、AA、RPC、Chain、API、业务逻辑彼此耦合，降低长期维护成本。

**核心原则：架构边界先于具体实现。**

项目不是“一个 DApp”，而是一个 **Web3 Platform（Web3 平台）**：平台可以持续增加新的业务模块，但共享基础能力必须保持稳定。

---

# 2. Architecture Goals

项目需要满足以下目标：

### 2.1 Platform-first

平台是第一层概念，业务模块只是平台中的一个个独立能力单元。

```text
WEB3 PLATFORM
    │
    ├── Module A
    ├── Module B
    ├── Module C
    └── Module ...
```

### 2.2 Business isolation

不同业务模块之间默认隔离，业务模块不能互相直接依赖内部实现。

### 2.3 Infrastructure abstraction

业务不得直接绑定 Privy、ZeroDev、Pimlico、Alchemy 等具体基础设施供应商。

### 2.4 Multi-chain ready

从第一天开始按多链设计：Chain、Wallet、Account、AA、Transaction 均不能假设单链。

### 2.5 Multi-account ready

不能假设全平台只有一个 `smartAccountAddress`。账户必须至少与 `chainId` 建立关联。

### 2.6 Team-friendly

目录和依赖规则必须让新人无需询问原开发者，就能判断“这个新文件应该放在哪里”。

### 2.7 Third-party friendly

第三方接入统一视为一个 `Module`，不因为“自研/第三方”而复制两套目录体系。

### 2.8 Progressive but predefined

从第一天就定义模块边界和依赖规则，但不提前实现未来没有实际需求的复杂基础设施。

---

# 3. Top-level Architecture

推荐使用：

```text
web3-platform/
│
├── apps/                 # Application Layer / 应用层
│   └── web/              # Main Next.js application / 主站
│
├── modules/              # Business Module Layer / 业务模块层
│   ├── lottery/
│   ├── prediction/
│   ├── swap/
│   ├── bridge/
│   └── ...
│
├── packages/             # Shared Platform Capabilities / 平台公共能力层
│   ├── auth/
│   ├── web3/
│   ├── api/
│   ├── ui/
│   ├── navigation/
│   ├── chain-config/
│   ├── contracts/
│   ├── analytics/
│   ├── permissions/
│   ├── feature-flags/
│   ├── config/
│   └── utils/
│
├── tooling/              # Engineering Tooling / 工程规范层
│   ├── eslint/
│   ├── prettier/
│   └── typescript/
│
├── docs/                 # Architecture / Engineering Docs
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

# 4. Layer Responsibilities

## 4.1 `apps/` — Application Layer（应用层）

### Definition

`apps` 是运行应用的容器，不是业务逻辑仓库。

### Current target

```text
apps/web
```

### Responsibilities

- Next.js App Router
- Route entry
- Layout
- Provider composition
- Middleware
- Global error handling
- Global loading / not-found
- SEO metadata
- Global application shell

### Allowed

```text
apps/web/app
apps/web/public
apps/web/middleware.ts
```

### Forbidden

不要在 `apps/web/app/**/page.tsx` 里堆积：

- Lottery 业务逻辑
- Prediction 业务逻辑
- Swap 计算
- Privy 初始化逻辑
- ZeroDev/AA 具体实现
- RPC 细节

### Rule

**App 负责“页面如何进入系统”，Module 负责“进入页面以后做什么”。**

---

# 5. `modules/` — Business Module Layer（业务模块层）

## 5.1 Definition

`modules` 是用户实际使用的业务能力。

例如：

```text
modules/
├── lottery/
├── prediction/
├── swap/
├── bridge/
├── staking/
└── game-a/
```

每一个目录代表一个相对独立的业务模块。

**模块可以是自研，也可以是第三方合作项目。**

不通过目录区分“自研”和“第三方”。如确有需要，通过 Module Metadata / Registry 标识其来源。

## 5.2 Why one unified Module layer?

因为当前无法确定未来一定有：

- 自有产品
- 第三方合作产品
- 临时活动
- 独立游戏
- 外部项目接入

所以不提前强制划分：

```text
products/
partners/
```

统一使用：

```text
modules/
```

这样平台只关心“它是不是一个可以独立挂载的业务模块”。

## 5.3 Standard module structure

```text
modules/lottery/
├── components/        # Module UI / 模块 UI
├── hooks/             # Module React hooks / 模块 Hook
├── services/          # Business services / 业务服务
├── api/               # Module-specific API / 模块接口
├── model/             # Domain model / 领域模型
├── types/             # TypeScript types / 类型
├── config/            # Module configuration / 模块配置
├── constants/         # Module constants / 常量
├── assets/            # Module assets / 资源
├── index.ts            # Public module API / 模块公开入口
└── README.md           # Module documentation
```

不要求每个模块一开始创建所有目录；但新增代码必须服从职责边界。

---

# 6. Module Internal Folder Rules

## 6.1 `components/` — UI of this module

放“只属于该模块”的界面组件。

Examples:

```text
LotteryCard
LotteryTicket
LotteryResult
PredictionMarketCard
PredictionOrderPanel
```

不要放通用 Button / Modal / Dialog。

通用 UI 进入：

```text
packages/ui
```

---

## 6.2 `hooks/` — React hooks of this module

放模块自己的 hooks。

Examples:

```text
useLotteryHistory()
useLotteryPurchase()
usePredictionMarket()
```

不要把 `useAuth()`、`useSmartAccount()` 之类平台级 Hook 放这里。

---

## 6.3 `services/` — Business logic / 业务服务

放“完成业务动作所需的业务流程编排”。

Examples:

```text
calculateLotteryReward()
createLotteryOrder()
placePredictionOrder()
getSwapQuote()
```

业务 Service 可以调用公共平台能力：

```text
Module Service
    ↓
packages/api
packages/web3
packages/ui（通常由 UI 层使用）
```

业务 Service 不得绕过平台能力直接初始化基础设施。

---

## 6.4 `api/` — Module-specific API

只放该模块专属接口定义或 API adapter。

例如：

```text
modules/lottery/api/getLotteryList.ts
modules/prediction/api/getMarket.ts
```

真正的 HTTP client、认证、拦截器、重试策略进入：

```text
packages/api
```

---

## 6.5 `model/` — Domain model / 领域模型

用于定义业务实体和业务数据转换。

例如：

```text
Lottery
LotteryRound
LotteryTicket
PredictionMarket
PredictionOrder
```

不要在这里保存 React UI 状态。

---

## 6.6 `config/` — Module configuration

放业务配置，例如：

```text
Lottery categories
Prediction mode
Module-level feature config
Contract mapping reference
```

链的基础配置仍应进入 `packages/chain-config`。

---

# 7. `packages/` — Shared Platform Capabilities（平台公共能力层）

这是全平台的“基础设施与公共能力”。

判断规则：

> 删除某一个业务模块后，这个能力仍然有价值 → `packages/`。

例如：

- Auth
- Web3
- Wallet
- Chain
- AA
- Transaction
- API Client
- UI
- Navigation
- Analytics
- Permission
- Feature Flag

---

# 8. `packages/auth/` — Authentication（身份认证）

## Responsibility

回答：

> **Who is the user?（用户是谁？）**

负责：

- Privy integration
- Login / logout
- User session abstraction
- Authentication state
- Current user identity

### Example API

```ts
useAuth()
login()
logout()
getCurrentUser()
```

### Important boundary

Auth != Wallet

认证身份和签名钱包必须分开。

```text
Authentication
    ↓
User Identity

Wallet
    ↓
Signer
```

业务模块不得到处直接调用 Privy SDK。

---

# 9. `packages/web3/` — Blockchain Infrastructure（区块链基础设施）

这是整个 Web3 平台最核心的基础能力层。

### Meaning

可以把它理解成：

> **“区块链操作系统层”**

所有业务都应该通过它与区块链交互。

推荐结构：

```text
packages/web3/
├── client/              # RPC/Public/Wallet clients
├── wallet/              # Wallet abstraction
├── chain/               # Chain abstraction
├── account/             # EOA / Smart Account abstraction
├── aa/                  # Account Abstraction
│   ├── erc4337/
│   ├── erc7702/
│   ├── bundler/
│   ├── paymaster/
│   └── providers/
├── transaction/         # Transaction execution/tracking
├── contract/            # Generic contract operations
├── token/               # ERC20/token utilities
├── signature/           # Signature utilities
└── index.ts
```

---

# 10. `web3/client/` — Blockchain Clients

Responsibilities:

- Public client
- Wallet client
- RPC transport
- RPC provider abstraction
- Chain-aware client creation

Business code must not repeatedly call:

```ts
createPublicClient(...)
```

inside every feature.

Use a centralized factory/registry.

---

# 11. `web3/wallet/` — Wallet Management

回答：

> 用户有哪些钱包？当前使用哪个钱包？

支持例如：

- Privy embedded wallet
- MetaMask
- WalletConnect
- Coinbase Wallet
- Other EVM wallets

Responsibilities:

```text
getConnectedWallets()
getEmbeddedWallet()
getActiveWallet()
```

Wallet != Smart Account。

---

# 12. `web3/chain/` — Chain Management

回答：

> 当前操作的是哪条链？这条链有什么能力？

必须考虑：

- chainId
- chain name
- RPC
- explorer
- native currency
- contract addresses
- feature/capability flags

例如：

```ts
chain.capabilities.eip4337
chain.capabilities.eip7702
chain.capabilities.paymaster
```

禁止在业务目录散落：

```text
chainId === 137
chainId === 8453
RPC_URL
EntryPoint address
```

统一进入 chain configuration。

---

# 13. `web3/account/` — Account Management

回答：

> 当前用户在当前 Chain 上使用哪个 Account？

不能使用全局单值模型：

```ts
smartAccountAddress
```

推荐概念模型：

```text
User
 ├── Chain A → Account A
 ├── Chain B → Account B
 └── Chain C → Account C
```

最少应支持：

```ts
getAccount({ user, chainId })
```

Account 可以是：

- EOA
- Smart Account

---

# 14. `web3/aa/` — Account Abstraction（账户抽象）

这里专门放 AA 能力。

重要原则：

> **AA != ZeroDev**

ZeroDev、Pimlico、Alchemy 等属于具体 provider / adapter；AA 是抽象能力。

建议：

```text
web3/aa/
├── erc4337/
├── erc7702/
├── bundler/
├── paymaster/
└── providers/
    ├── zerodev/
    ├── pimlico/
    └── alchemy/
```

### Business code

业务只应该看到类似：

```ts
accountManager.getAccount(...)
aaManager.execute(...)
transactionManager.send(...)
```

业务不应该直接依赖：

```ts
createKernelAccount()
```

---

# 15. `web3/transaction/` — Transaction Execution

统一处理链上执行生命周期：

```text
Prepare
  ↓
Simulate
  ↓
Estimate
  ↓
Sign
  ↓
Send
  ↓
Track
  ↓
Receipt
```

支持：

- EOA transaction
- ERC-4337 UserOperation
- ERC-7702 based execution
- Batch transaction
- Gas / Paymaster handling
- Transaction status tracking

业务模块不应各自维护一套 transaction executor。

---

# 16. `web3/contract/` — Generic Contract Operations

放通用的：

- Contract read
- Contract write
- ABI helpers
- Contract error parsing
- Generic call encoding

注意：

**通用能力放这里；具体业务合约属于对应模块。**

例如：

```text
ERC20 generic functions
    → packages/web3/contract or token

LotteryContract ABI
    → modules/lottery/config/contracts
```

---

# 17. `web3/token/` — Token Infrastructure

负责通用 token 能力：

- token metadata
- balance
- decimals
- allowance
- permit
- token utilities

例如：

```ts
getTokenBalance()
getAllowance()
```

具体业务 token 逻辑属于具体 Module。

---

# 18. `packages/chain-config/` — Chain Registry

统一管理：

```text
Chains
Tokens
Networks
Contract addresses
Chain capabilities
Provider settings reference
```

推荐概念：

```ts
getChainConfig(chainId)
getTokenConfig(chainId, token)
getContractAddress(chainId, contract)
```

不要在业务模块中复制一份 Polygon / Base / Arbitrum 配置。

---

# 19. `packages/contracts/` — Shared Contract Definitions

适合放真正跨多个模块通用的合约定义，例如：

- ERC20
- ERC721
- Permit standards
- Common protocol contracts

**业务私有 ABI 优先放业务模块内。**

这样可以避免 `packages/contracts` 最终成为所有业务 ABI 的“垃圾场”。

---

# 20. `packages/api/` — Backend/API Infrastructure

它负责：

- HTTP client
- authentication headers
- token refresh
- request/response normalization
- retry strategy
- error handling
- API transport

示例：

```text
packages/api/client
packages/api/auth
packages/api/user
```

业务模块的具体接口仍可放：

```text
modules/lottery/api
modules/prediction/api
```

---

# 21. `packages/ui/` — Design System（通用 UI）

放跨模块通用组件：

```text
Button
Input
Modal
Dialog
Tabs
Select
Toast
Table
Card
Tooltip
```

不放：

```text
LotteryCard
PredictionCard
SwapTokenInput
```

这些属于对应 Module。

---

# 22. `packages/navigation/` — Navigation Registry（导航系统）

平台有很多导航入口，因此导航不能硬编码在 Header/Sidebar 中。

建议采用 Registry：

```ts
registerModule({
  id: 'lottery',
  title: 'Lottery',
  path: '/lottery',
  category: 'games',
  enabled: true,
})
```

导航项可以包含：

- id
- title
- path
- category
- icon
- auth requirement
- chain requirement
- feature flag
- permission
- visibility

### Why

支持：

- 模块上线/下线
- 灰度
- 权限控制
- 第三方接入
- 导航动态配置

---

# 23. `packages/analytics/` — Analytics（埋点）

统一处理：

- page view
- click event
- transaction event
- conversion
- business metrics

业务模块不应自行接不同的 analytics SDK。

---

# 24. `packages/permissions/` — Permission（权限）

负责统一判断：

- 登录权限
- Role / permission
- Module access
- Admin access
- Region/feature restrictions

业务只调用统一权限能力。

---

# 25. `packages/feature-flags/` — Feature Flag（功能开关）

用于：

- Module enable/disable
- A/B testing
- Gradual rollout
- Temporary kill switch

重要业务模块必须具备紧急关闭能力。

---

# 26. `packages/config/` — Global Configuration（全局配置）

存放非业务、非链专属的全局配置：

- environment configuration
- application metadata
- runtime config references

环境变量应统一由配置层读取和校验，不允许业务模块到处直接 `process.env.*`。

---

# 27. `packages/utils/` — Utilities（工具函数）

只能放真正跨模块通用、无明显业务归属的工具。

例如：

```text
formatAddress
formatNumber
sleep
assert
```

禁止把业务逻辑扔进 utils。

反例：

```text
calculateLotteryReward()
```

它应该属于：

```text
modules/lottery/services
```

---

# 28. Dependency Rules（依赖规则）

这是最重要的团队规范之一。

## 28.1 Allowed dependency direction

```text
                         APPS
                          │
                          ▼
                       MODULES
                          │
                          ▼
                       PACKAGES
                          │
                          ▼
                  External Libraries
```

更准确地说：

```text
apps  → modules → packages → external SDKs
```

## 28.2 Forbidden dependencies

禁止：

```text
packages → modules
modules/A → modules/B/internal-file
packages/ui → packages/auth
packages/web3 → specific business module
```

如确有跨模块共享需求，优先提炼成公共 Package，而不是跨模块互相引用内部实现。

---

# 29. Module-to-Module Rules

默认：

```text
Module A  ❌  Module B internal code
```

例如：

```ts
// Forbidden
import { PredictionEngine } from '@/modules/prediction/services/PredictionEngine'
```

如两个模块真的需要相同能力：

1. 判断是不是平台通用能力。
2. 是 → 提取到 `packages/*`。
3. 不是 → 保持业务隔离，重新定义模块自己的适配逻辑。

---

# 30. Public API Rule

每个 Package / Module 必须尽量通过 `index.ts` 暴露 Public API。

推荐：

```ts
import { useAuth } from '@platform/auth'
import { getPublicClient } from '@platform/web3'
```

不推荐业务大量使用深层路径：

```ts
import { xxx } from '@platform/web3/src/internal/xxx'
```

内部目录可以调整，而 Public API 应尽量稳定。

---

# 31. Privy Integration Rules

Privy 是基础设施供应商，不是业务模型。

正确：

```text
Module
  ↓
Auth / Wallet abstraction
  ↓
Privy adapter
```

错误：

```text
Lottery
  ↓
usePrivy()
  ↓
ZeroDev SDK
```

原则：

- Privy 初始化集中管理。
- Privy SDK 调用集中在 `packages/auth` / `packages/web3/wallet` 的适配层。
- Module 不直接依赖 Privy SDK。

---

# 32. Multi-chain Rules（多链规范）

绝对禁止业务假设单链：

```ts
const smartAccount = '0x...'
```

推荐：

```ts
const account = await getAccount({ chainId })
```

或：

```ts
getAccount({
  userId,
  chainId,
  accountType: 'smart',
})
```

所有链相关数据必须显式考虑：

```text
chainId
accountAddress
provider
capabilities
```

---

# 33. AA Rules

业务不要假设：

```text
AA = ERC-4337
AA = ZeroDev
AA = Kernel
```

AA 是能力抽象。

具体实现必须可替换：

```text
AA Provider
 ├── ZeroDev
 ├── Pimlico
 └── Alchemy
```

协议层：

```text
ERC-4337
ERC-7702
```

执行层：

```text
Bundler
Paymaster
```

这几个概念要保持分离。

---

# 34. State Management Rules（状态管理）

## 34.1 React State

只处理页面/组件局部 UI 状态：

```text
modalOpen
tab
inputValue
hover
```

## 34.2 Global Client State

仅用于真正全局的客户端状态：

```text
selectedChain
UI preferences
small session state
```

可使用 Zustand / Context，但必须控制范围。

## 34.3 Server/RPC State

优先使用 TanStack Query：

```text
balance
allowance
quote
market data
transaction status
API response
```

不要把所有 RPC 数据塞入一个巨大的全局 Store。

---

# 35. Query Key Rules

Query key 必须包含真正影响数据结果的上下文。

例如不要：

```ts
['balance']
```

推荐：

```ts
['balance', chainId, accountAddress, tokenAddress]
```

原因：多链、多账户切换时避免缓存污染。

---

# 36. Transaction Lifecycle Rules

统一生命周期：

```text
User Intent
   ↓
Prepare
   ↓
Validate
   ↓
Simulate
   ↓
Execute
   ↓
Track
   ↓
Confirm
   ↓
Refresh related queries
```

业务模块只描述“我要完成什么动作”；Transaction layer 决定“使用 EOA / AA / 4337 / 7702 如何执行”。

---

# 37. Example: Add a Lottery Module（新增 Lottery）

## Route

```text
apps/web/app/(platform)/lottery/page.tsx
```

该文件只做页面入口，例如：

```tsx
export default function LotteryPage() {
  return <LotteryScreen />
}
```

## Module

```text
modules/lottery/
├── components/
│   ├── LotteryScreen.tsx
│   ├── LotteryCard.tsx
│   └── LotteryBuyDialog.tsx
├── hooks/
│   ├── useLotteryList.ts
│   └── useLotteryPurchase.ts
├── services/
│   ├── lotteryService.ts
│   └── rewardService.ts
├── api/
│   └── getLotteryList.ts
├── model/
│   └── lottery.ts
├── config/
│   └── contracts.ts
├── types/
│   └── lottery.types.ts
├── constants/
│   └── lottery.constants.ts
└── index.ts
```

## Blockchain

Lottery 调用：

```text
modules/lottery
   ↓
packages/web3
   ↓
account / transaction / contract
   ↓
blockchain
```

不要：

```text
Lottery
   ↓
createKernelAccount()
```

---

# 38. Example: Add a Third-party Game Module（接入第三方游戏）

第三方项目同样进入：

```text
modules/game-a/
```

然后通过 Module Registry 注册：

```ts
registerModule({
  id: 'game-a',
  title: 'Game A',
  path: '/game-a',
  source: 'external',
  enabled: true,
})
```

目录不因第三方身份改变。

如第三方模块生命周期结束，可以整体移除：

```text
modules/game-a
```

而无需重构整个平台。

---

# 39. Module Metadata

建议每个模块定义标准 Metadata：

```ts
type ModuleManifest = {
  id: string
  title: string
  path: string
  category?: string
  icon?: string
  enabled: boolean
  source?: 'internal' | 'external'
  authRequired?: boolean
  supportedChains?: number[]
  featureFlag?: string
}
```

用途：

- Navigation
- Permission
- Feature Flag
- Module discovery
- Analytics
- Platform configuration

---

# 40. Navigation Rules

导航必须由 Registry 产生，不允许在 Header / Sidebar 里大量硬编码：

```tsx
// Forbidden
<Link href="/swap">Swap</Link>
<Link href="/lottery">Lottery</Link>
<Link href="/prediction">Prediction</Link>
```

推荐：

```text
Module Manifest
      ↓
Navigation Registry
      ↓
Navigation UI
```

这样模块可以独立上线、下线、隐藏或灰度。

---

# 41. Route Rules

Next.js `app/` 是路由入口。

推荐：

```text
apps/web/app/(platform)/swap/page.tsx
apps/web/app/(platform)/lottery/page.tsx
apps/web/app/(platform)/prediction/page.tsx
```

但实际业务代码位于：

```text
modules/swap
modules/lottery
modules/prediction
```

**Route file should be thin.（路由文件必须薄。）**

---

# 42. Environment Variable Rules

不要：

```ts
process.env.PRIVY_APP_ID
```

在全项目任意文件直接读取。

推荐：

```text
Global config
    ↓
Validated env
    ↓
Public runtime config / server config
```

统一做 schema validation（例如 Zod）。

环境变量按类别管理：

```text
PUBLIC_*
SERVER_*
WEB3_*
API_*
```

真正的命名以项目实际规范为准，但必须统一。

---

# 43. Error Handling

至少分为：

```text
UI Error
API Error
Wallet Error
User Rejection
RPC Error
Contract Error
AA Error
Transaction Error
```

禁止每个模块自行随意解析底层错误。

公共错误归一化放在：

```text
packages/web3
packages/api
```

业务只处理业务可理解的错误类型。

---

# 44. Logging / Monitoring

统一处理：

- Error reporting
- Transaction failure
- RPC failure
- Module failure
- Auth failure

业务模块不要直接初始化多个监控 SDK。

---

# 45. Testing Rules

建议三层：

### Unit Test

测试：

- services
- utilities
- model transformations
- Web3 adapters

### Integration Test

测试：

- Module + API
- Module + Web3
- Transaction flow

### E2E Test

测试：

- Login
- Connect wallet
- Switch chain
- Execute transaction
- Module core flow

---

# 46. Coding Rules for AI（AI 编码规则）

AI 在修改或新增代码时必须遵守：

## Rule A — Identify ownership first

先判断代码属于：

```text
App
Module
Package
Tooling
```

再创建文件。

## Rule B — Do not create global junk folders

禁止随意新增：

```text
src/hooks
src/utils
src/services
src/components
```

除非该目录在架构中已有明确用途。

## Rule C — Prefer existing capabilities

新增功能前先搜索：

```text
packages/auth
packages/web3
packages/api
packages/ui
packages/navigation
```

避免重复实现。

## Rule D — Do not couple business to vendors

不要在业务 Module 中直接引入：

```text
Privy SDK
ZeroDev SDK
Pimlico SDK
Alchemy SDK
```

除非该代码明确位于对应 infrastructure adapter 中。

## Rule E — Respect dependency direction

不能为了“方便”跨层 import。

## Rule F — Keep route files thin

`page.tsx` 只做 route composition。

## Rule G — Prefer public APIs

优先从 package/module `index.ts` 导入。

## Rule H — Multi-chain by default

所有钱包、账户、交易、缓存、配置逻辑必须考虑 `chainId`。

## Rule I — No giant provider/store

不要建立一个包含 Auth + Wallet + AA + API + Business State 的超级 Provider/Store。

---

# 47. Developer Decision Tree（新文件应该放哪里）

开发者新增文件前依次问：

### Q1: 它是 Next.js route / layout / middleware？

是 → `apps/web/app`

### Q2: 它只服务一个具体业务模块？

是 → `modules/<module-name>`

### Q3: 删除这个业务模块后，它仍然有价值吗？

是 → `packages/*`

### Q4: 它是不是平台公共基础设施？

例如：

- Auth
- Web3
- Chain
- API
- UI
- Navigation
- Analytics

是 → `packages/*`

### Q5: 它只是工程规范/工具？

是 → `tooling/*`

---

# 48. Common Placement Examples

| Requirement | Correct location |
|---|---|
| Privy login abstraction | `packages/auth` |
| Privy adapter | `packages/auth` |
| Wallet manager | `packages/web3/wallet` |
| Chain registry | `packages/web3/chain` / `packages/chain-config` |
| Smart Account manager | `packages/web3/account` |
| ERC-4337 adapter | `packages/web3/aa/erc4337` |
| ERC-7702 adapter | `packages/web3/aa/erc7702` |
| Bundler | `packages/web3/aa/bundler` |
| Paymaster | `packages/web3/aa/paymaster` |
| Transaction manager | `packages/web3/transaction` |
| Generic ERC20 balance | `packages/web3/token` |
| Lottery contract ABI | `modules/lottery/config/contracts` |
| Lottery page | `apps/web/app/(platform)/lottery/page.tsx` |
| Lottery UI | `modules/lottery/components` |
| Lottery hook | `modules/lottery/hooks` |
| Lottery business service | `modules/lottery/services` |
| Lottery API definition | `modules/lottery/api` |
| Common Button | `packages/ui` |
| Common Modal | `packages/ui` |
| Navigation registry | `packages/navigation` |
| Global env parsing | `packages/config` |
| Generic address formatter | `packages/utils` |

---

# 49. What Not To Do（禁止事项）

## Forbidden 1

```text
Lottery → ZeroDev SDK directly
```

## Forbidden 2

```text
Lottery → Privy SDK directly
```

## Forbidden 3

```text
packages/web3 → Lottery
```

## Forbidden 4

```text
modules/lottery → modules/prediction/internal
```

## Forbidden 5

```text
random global utils/hooks/services folders
```

## Forbidden 6

```text
hard-coded RPC / chainId / AA provider inside business UI
```

## Forbidden 7

```text
one giant Web3Provider / AppStore containing everything
```

---

# 50. Recommended Project Dependency Graph

```text
                         WEB3 PLATFORM
                         Web3 平台
                              │
                              ▼
                         APPS / 应用层
                              │
                              ▼
                    MODULES / 业务模块层
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
         Lottery          Prediction            Swap
          彩票               预测                兑换
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                              ▼
               SHARED PLATFORM CAPABILITIES
                  平台公共基础能力层
                              │
       ┌──────────┬───────────┼──────────┬────────────┐
       │          │           │          │            │
       ▼          ▼           ▼          ▼            ▼
      AUTH       WEB3        API        UI       NAVIGATION
      认证       Web3        接口       UI组件      导航
                   │
         ┌─────────┼──────────┐
         │         │          │
         ▼         ▼          ▼
      WALLET     CHAIN     ACCOUNT
       钱包       链         账户
                             │
                       ┌─────┴─────┐
                       │           │
                       ▼           ▼
                      EOA          AA
                     普通账户       智能账户
                                  │
                         ┌────────┼────────┐
                         │        │        │
                         ▼        ▼        ▼
                       4337      7702   PAYMASTER
                       AA标准    授权模式     Gas代付
                         │        │
                         └────────┼────────┘
                                  ▼
                             TRANSACTION
                               交易执行
                                  │
                                  ▼
                              BLOCKCHAIN
                                区块链
```

---

# 51. Platform vs Module vs Package — One-line Definitions

| Layer | One-line definition |
|---|---|
| `apps` | How the platform runs（平台怎么运行） |
| `modules` | What the platform provides（平台提供什么业务） |
| `packages` | What capabilities all modules can reuse（所有业务可以复用什么能力） |
| `tooling` | What rules developers follow（开发者按什么工程规则开发） |

---

# 52. Architectural Philosophy

本项目遵循以下长期原则：

### Principle 1 — Module-first business organization

业务按模块组织，不按“components/hooks/utils”横向堆积。

### Principle 2 — Shared capability is extracted downward

发现能力被多个模块真正复用时，再进入 `packages`。

### Principle 3 — Infrastructure must not know business

Web3/Auth/API/UI 等平台基础设施不反向依赖具体业务模块。

### Principle 4 — Business should speak in business language

业务应该调用：

```text
getAccount
executeTransaction
getTokenBalance
useAuth
```

而不是：

```text
createKernelAccount
customRpcCall
rawPrivyApi
```

### Principle 5 — Vendor replacement should be localized

更换 Privy / AA provider / RPC provider 时，影响应主要限制在 adapter / infrastructure 层。

### Principle 6 — New modules should be cheap to add and cheap to remove

添加：

```text
modules/new-module
```

即可完成业务边界；删除模块也不应导致平台大面积重构。

---

# 53. Definition of Done for a New Module

新增一个业务模块，至少满足：

- [ ] 有独立 `modules/<name>` 目录。
- [ ] 有独立 README。
- [ ] 有独立 Module Manifest。
- [ ] 路由位于 `apps/web/app`。
- [ ] Route 文件保持薄。
- [ ] UI 放在模块内部。
- [ ] 模块专属业务逻辑不进入 `packages`。
- [ ] 复用平台能力必须从 `packages` 获取。
- [ ] 不直接依赖 Privy / ZeroDev / 其他供应商 SDK。
- [ ] 多链逻辑显式考虑 `chainId`。
- [ ] Transaction 使用统一 transaction layer。
- [ ] 导航通过 Navigation Registry 接入。
- [ ] 必要时接入 Feature Flag。
- [ ] 必要时接入 Permission。
- [ ] 核心业务路径有测试。

---

# 54. AI Coding Agent Contract

任何 AI 在本仓库工作时，都必须把本文档视为最高级别的前端架构约束之一。

在实现需求前，AI 应执行以下顺序：

```text
1. Identify the business owner
   判断功能属于哪个 Module

2. Identify reusable capability
   判断是否应该使用已有 Package

3. Check existing implementation
   先搜索，避免重复实现

4. Respect dependency direction
   遵守 apps → modules → packages

5. Keep infrastructure abstracted
   不把供应商 SDK 带入业务层

6. Keep route thin
   不把业务逻辑塞进 page.tsx

7. Consider chain/account context
   默认考虑多链、多账户

8. Update module manifest/navigation when needed
   新模块接入平台必须注册
```

AI 不得为了“快速完成需求”而破坏以上边界。

如果现有代码违反本文档，新增代码优先遵循本文档，而不是继续扩大旧问题；如需兼容旧代码，应通过 adapter / wrapper / migration 逐步收敛。

---

# 55. Engineering Constraints & Tooling (工程化强制约束)

真正的架构约束不能仅仅停留在“文档规范”和“君子协议”上（“大家请不要乱 import”）。
借鉴顶级 Web3 团队（如 Uniswap）的最佳实践，项目必须通过底层的工具链（Linter / 编译工具）强制拉起警戒线。一旦违反架构边界，必须在 IDE 阶段标红，并阻止代码提交。

## 55.1 强制约束 1：禁止深层导入 (No Deep Imports)

**规则**：业务模块 (`apps/`, `modules/`) 绝对禁止直接深入引用 `packages/` 内部深层的源文件。
**示例**：
- ❌ 错误（越权）：`import { Button } from '@packages/uikit/src/components/Button'`
- ✅ 正确（规范）：`import { Button } from '@packages/uikit'`

**实现手段 (ESLint / Oxlint)**：
配置 `no-restricted-imports`，拦截对 `@packages/*/src/**` 的直接访问，强迫所有的 Package 必须暴露出清晰的 API (`index.ts`)，作为一个封装良好的黑盒提供给上层使用。

## 55.2 强制约束 2：禁止绕过抽象层调用底层库

**规则**：当平台封装了统一的抽象层（如 `packages/web3-core`）后，严禁业务代码直接使用底层的第三方库（如原生的 `wagmi` hook 或 `ethers.js`）。
**示例**：
- ❌ 错误（绕过抽象）：直接在业务组件中 `import { useAccount } from 'wagmi'`
- ✅ 正确（遵守抽象）：使用自己封装好的 `import { usePlatformAccount } from '@packages/web3-core'`

**实现手段 (ESLint / Oxlint)**：
在 `no-restricted-imports` 中加入对第三方特定 API 的限制，如果开发者试图直接 `import { xxx } from 'wagmi'`，Lint 会报错提示：“请使用封装好的自定义 Hook”。

## 55.3 强制约束 3：禁止越权读取环境变量

**规则**：前端读取 `process.env` 容易引发不可预期的错误，应统一收口到 `config` 包提供的方法中读取。
**实现手段**：
使用 `no-restricted-syntax` 拦截 `MemberExpression[object.name='process'][property.name='env']`。当开发者输入 `process.env` 时，Linter 强制拦截并提示：“禁止直接读取环境变量，请改用 getConfig() 方法”。

## 55.4 强制约束 4：隔离实验性/不稳定的包

**规则**：如果 `packages/` 下包含一些处于研发中、不稳定的功能（如 `packages/labs/`），严禁将其导入到线上的主应用（`apps/web`）中。
**实现手段**：
在 Linter 中配置针对 `labs/**` 模式的限制，一旦主线业务尝试引入，在编译和 Commit 阶段直接失败。

这些“硬性底线”是确保项目“新人进组，不需要培训，看着 IDE 报错就能写对代码”的最有效抓手。

---

# 56. Final Rule

> **Do not optimize the repository for the current developer. Optimize it for the next developer.**
>
> **不要为当前开发者优化仓库，要为下一个开发者优化仓库。**

本架构的最终目的不是让目录看起来“高级”，而是让：

- 新人能快速找到代码
- AI 能正确生成代码
- 不同团队可以并行开发
- 第三方可以按规则接入
- 多链和 AA 可以持续演进
- Privy / AA Provider / RPC 可以替换
- 单个模块可以上线、下线、重构，而不拖垮整个前端

**当团队开始犹豫“这个文件到底放哪”时，应优先检查模块边界和依赖方向，而不是再新增一个全局目录。**

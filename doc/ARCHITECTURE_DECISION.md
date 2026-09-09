# Web3 大型项目前端架构分析与决策文档

## 一、 为什么研究 PancakeSwap 前端架构？
随着项目业务（主站、彩票、预测、合作方接入等）的不断扩张，传统的单体前端应用 (`src` 下一把梭) 将面临极高的代码耦合风险、编译缓慢以及“改一处崩全站”的灾难。
PancakeSwap 采用的 **Turborepo + pnpm workspaces** 驱动的 **巨石型 Monorepo (单体仓库)** 架构，是目前应对 Web3 复杂业务的最佳实践。

## 二、 PancakeSwap 核心架构解剖

整个代码库在宏观上分为三大块：

1. **`apps/` (应用层 - 独立业务线)**
   - **特点**：每个文件夹都是一个完全独立运行的网站。
   - **作用**：隔离不同品类的业务。例如 `apps/web` 是核心主站，`apps/aptos` 是异构链主站，`apps/blog` 和 `apps/games` 是生态扩展。它们可以独立部署，拥有独立的运行端口。
2. **`packages/` (模块层 - 引擎与弹药库)**
   - **特点**：被抽离的纯逻辑、UI 或配置包，不包含具体的页面路由。
   - **作用**：提供极其极致的复用能力。例如 `packages/uikit` 统一全站 UI，`packages/swap-sdk` 封装纯数学计算和交易逻辑，`packages/wagmi` 封装钱包与链上交互。
3. **工程化配置 (根目录)**
   - **特点**：通过 `pnpm-workspace.yaml` 和 `turbo.json` 统筹全局。
   - **作用**：实现跨目录的包引用，以及基于缓存的极速并行编译。

## 三、 该架构的利与弊

### ✅ 利 (我们的目标)
1. **天然的“挂载”与隔离能力**：未来的彩票、预测项目可以作为单独的 `apps/lottery` 存在。合作方的代码写得再烂，哪怕内存泄漏，也**绝对不会导致核心主站 (`apps/web`) 崩溃**。
2. **极端的解耦与复用**：如果要开发移动端或桌面端，可以直接无缝复用 `packages/` 下的所有链交互 SDK 和数据结构。
3. **分工极其明确**：UI 同事写 `packages/uikit`，Web3 同事写 `packages/web3-core`，业务同学写 `apps/`。物理层面的代码隔离彻底解决了多人协作的合并冲突噩梦。

### ❌ 弊 (我们需要避坑的地方)
1. **过度工程化 (Over-engineering)**：Pancake 拆了 40 多个包，对于初期项目来说心智负担极大，调试链路过长。
2. **环境配置复杂**：多个 `.eslintrc` 和 `tsconfig.json` 的互相继承很容易配错导致 IDE 报错。
3. **沉重的历史包袱**：直接拿它的脚手架魔改会遇到很多不可预知的暗桩。

---

## 四、 我们的架构落地策略：“进可攻，退可守”

**核心方针：只学思想，不抄骨架。从零用 `npx create-turbo` 搭建纯净的 Monorepo 底座。**

前期 `packages/` 目录下只保留最核心的几个包（如：`uikit`、`web3-core`、`config`），避免过度拆分。
针对未来“挂载第三方合作项目”的痛点，我们制定了**两套渐进式的融合方案**：

### 方案 A：重量级隔离（物理隔离，最安全，需运维配合）
*   **做法**：主站跑在 `apps/web`，彩票等复杂业务跑在 `apps/lottery`。
*   **部署**：打出两个不同的 Docker 镜像，部署两个容器。
*   **网关层融合**：由运维配置 Nginx 反向代理（或使用 Next.js URL Rewrites）。当用户访问 `yourdomain.com/lottery` 时，流量无缝转发给彩票容器。
*   **结论**：强烈推荐。真正的微前端体验，项目间互不影响，做到主站交易功能的绝对安全。

### 方案 B：轻量级隔离（组件融合，前端完全掌控）
*   **做法**：如果我们没有运维资源配合加 Nginx 规则，我们就退一步。依然使用 Monorepo，但将彩票业务写成一个包 `packages/lottery`。
*   **部署**：在主站 `apps/web` 中 `import` 彩票包的代码，最终 `pnpm build` 出**唯一的一个 Docker 容器**进行部署。
*   **结论**：作为妥协方案。优点是不求人、零运维改动；缺点是失去了运行时的物理隔离，如果第三方代码有致命 Bug，可能会拖垮主站 Node.js 进程。

### 总结
无论最终运维是否配合方案 A，**采用 Monorepo 搭建底层架构都是绝对正确的第一步**。它让我们在开发阶段实现了代码的模块化，并在未来真正需要隔离部署时，拥有随时平滑切换到方案 A 的底气。

---

## 五、 API 与网络层架构规范 (Domain-Driven API Design)

结合 PancakeSwap 和 Uniswap 的大厂最佳实践，我们确立了**“底层工具集中化，具体业务离散化”**的 API 存放准则：

### 1. 基础网络层 (Infrastructure Layer)
- **存放位置**：`packages/web3-core/src/api/httpClient.ts` (或其他底层包)。
- **职责**：封装最原生的 HTTP/Fetch 能力，统一处理 JWT Token 注入、超时控制（AbortController）、JSON 解析以及全局错误的抛出。它只提供“发请求的枪”，**绝对不包含任何业务请求**。

### 2. 主站自有业务层 (Domain Layer)
- **存放位置**：主项目 `apps/web/src/features/[功能模块]/api/`
- **规则**：遵循高内聚原则。例如“个人中心”的 API，必须存放在 `apps/web/src/features/user-center/api/getUserInfo.ts`。
- **优势**：未来如果要重构或删除该业务模块，只需删掉整个文件夹，不会在全局 API 目录里留下任何垃圾代码。

### 3. 三方集成业务层 (Integration Layer)
- **存放位置**：对应的集成包，例如 `packages/integrations-lottery/src/api/`
- **规则**：针对外部对接的三方彩票或预测系统，所有对应的 API 请求（如 `fetchLotteryDraws.ts`）**必须且只能**封闭在 `integrations-lottery` 包内。
- **优势**：主项目 `apps/web` 完全不知道底层的 API URL 和参数，它只负责调用该包暴露出来的标准化 React Hooks（如 `useLotteryTickets`）来渲染 UI。彻底隔离三方逻辑。

# W 平台前端大底座：目录结构与代码分布终极蓝图

为了让你在敲下第一行代码前，对整个项目“长什么样、代码放哪里”有一个上帝视角，我为你梳理了这份终极蓝图。这完美解答了你刚才连珠炮般的实战疑问。

---

## 1. 仓库整体长什么样？(Monorepo 骨架)
整个项目基于 Turborepo 构建。拉下代码后，根目录最核心的就是 `apps/`（跑在网上的应用程序）和 `packages/`（内部共享的底层引擎包）。

```text
w-platform-monorepo/
├── apps/
│   ├── web/               <-- 【主站大底座】(Next.js App Router项目)
│   └── polymarket/        <-- 【三方游戏】(如果要物理隔离，就建在这里)
├── packages/
│   ├── web3-core/         <-- 【核心链上逻辑】(私钥、AA、钱包全在这里)
│   ├── uikit/             <-- 【UI 组件库】(纯视觉组件)
│   ├── config/            <-- 【公共配置】(如 ESLint, Prettier)
├── turbo.json             <-- (大管家配置，管理多包缓存)
└── package.json           <-- (管理全局 pnpm 依赖)
```

---

## 2. 你的核心疑问逐一解答，代码到底放在哪？

### Q1: 怎么区分环境？(Env 怎么放？)
*   **放在哪里**：**只放在 `apps/web/.env.development` 和 `apps/web/.env.production` 里。**
*   **严格架构规矩**：`packages/` 里的代码（比如 `web3-core`）**绝对不允许**写 `process.env.XXX`。`packages` 只提供函数，由 `apps/web` 启动时读取 `.env`，然后把秘钥当做参数传给 `packages`。这样保证了底层的纯洁性。

### Q2: Privy 登录结合 ZeroDev 生成 AA 的代码放在哪里？
*   **绝对不要放在主站！** 放在 `packages/web3-core/src/providers/` 里。
*   **怎么封装**：你在 `web3-core` 里写一个 `<W3Provider>`。在这个包里搞定 Privy 和 ZeroDev 的神仙打架。
*   **主站怎么用**：主站 `apps/web/src/app/layout.tsx` 只需要写一行 `import { W3Provider } from '@w-platform/web3-core'` 把整个网页包起来。主站的页面开发人员，根本不需要懂什么叫 AA 钱包。

### Q3: 充值、提现的代码放在哪里？
这属于“包含重度业务逻辑的 UI 功能”。
*   **UI 页面层**：放在 `apps/web/src/app/wallet/page.tsx`。
*   **接口逻辑层**：放在 `apps/web/src/features/wallet/`（专门处理查余额、调后端充提接口的逻辑）。
*   *(注：只有纯区块链的签名打包代码，才下沉到 `packages/web3-core`)*。

### Q4: 顶部的动态导航栏 (TopNav) 放在哪里？怎么设计？
*   **存放位置**：主框架放在 `apps/web/src/app/layout.tsx`，核心逻辑组件放在 `apps/web/src/components/layout/TopNav.tsx`。
*   **为什么是动态的**：因为它要根据不同状态显示不同内容（未登录显示“连接钱包”，已登录显示“头像 + 余额 WU”，切到不同游戏显示不同高亮）。
*   **最佳实践（傻瓜与聪明分离）**：
    1. 在 `packages/uikit` 里写一个纯视觉的 `<Navbar>` 组件，只接收参数（比如传入 `avatarUrl`、`balance`、`menuItems`）。
    2. 在 `apps/web/src/components/layout/TopNav.tsx` 里写业务逻辑。它去调用 Privy 获取登录状态，调用 Zustand 获取 WU 余额，然后把这些数据当作 props 喂给 `uikit` 的 `<Navbar>`。
    3. 这样导航栏的代码既干净，又能随时跟着用户状态动态更新。

### Q5: 有必要封装组件吗？什么样的封装？放在哪里？
*   **极其有必要！** 这是大厂和草台班子的分水岭。
*   **放在哪里**：全部放在 `packages/uikit/src/`。
*   **封装什么**：封装 Button (按钮)、Modal (弹窗)、Input (输入框)。
*   **怎么封装**：把 TailwindCSS 的长串代码锁死在里面。主站的开发人员写代码时，只允许写 `<Button variant="primary">提交</Button>`，**绝对不允许**在主站业务代码里到处写 `class="bg-blue-500 hover:bg-blue-600 rounded-lg p-4"`。这就是保证后期样式统一、一键换肤的关键。

### Q6: 基座内部的“记录列表 (账单流水)”代码放在哪里？
*   这是标准的 Web2 业务列表。
*   **路由/页面**：放在 `apps/web/src/app/records/page.tsx`。
*   **组件**：放在 `apps/web/src/features/records/components/`（比如 `RecordTable.tsx`）。状态管理用我们敲定的 Zustand + React Query 去查后台 API。

### Q7: 如果对接 Polymarket，到底怎么创建？页面怎么挂载？
这是做“大底座生态”最核心的难点：如何在用户看起来是一个网站的情况下，把三方游戏无缝嵌进去。业内有三种主流挂载方案：

#### 方案 A：微前端/同源多路由挂载 (最专业，如 PancakeSwap 做法)
*   **代码位置**：建一个独立应用 `apps/polymarket/`。
*   **怎么让头部导航栏看起来一样？**：把 `TopNav` 抽离成一个共享包 `packages/shared-layout`。`apps/web` 和 `apps/polymarket` 都在 `layout.tsx` 里引入同一个 `TopNav`。
### Q7: 如何实现“进可攻，退可守”？(既能独立运行，又能合并打包)
你刚才提出的这个想法：**“我希望 Polymarket 能单独运行，W 也能单独运行；后端不配合我就合并，配合我就分开部署”**。
这是一个极其高级的架构思想！这在架构学上叫做 **“业务逻辑与宿主壳 (Host Shell) 分离”**。完全可以实现，而且只有 Turborepo 能把它做得很优雅。

**这套终极架构是这样分布的：**

1. **业务核心 (真正的代码存放处)**：
   把 Polymarket 所有复杂的页面、接口、组件，全部写在 `packages/games-polymarket` 里。它不依赖任何 Next.js 的路由，它就是一个纯粹的 React 业务组件包。

2. **退可守（后端不配合，打成 1 个包）**：
   在底座主站 `apps/web/src/app/polymarket/page.tsx` 中，直接 `import` 引入。
   - *结果*：`pnpm build` 打包 `apps/web` 时，整个游戏代码会被揉进去，最终只产出一个 Docker 镜像，主站直接把游戏渲染出来。

3. **进可攻（后端配合，打成 2 个包隔离部署）**：
   在 apps 目录下，新建一个极轻量的“空壳”应用：`apps/polymarket-host`。
   这个空壳应用里只有一行代码，就是把 `packages/games-polymarket` 引入进来并渲染。
   - *结果*：你可以单独对 `apps/polymarket-host` 运行 `pnpm build` 和部署。它会跑在独立的端口上（比如 3001）。运维在 Nginx 配一个反向代理，把流量分发过去。主站就算挂了，它也照样能独立运行！

**为什么这是神级操作？**
因为无论你们公司后期的运维架构怎么变、怎么折腾，**你开发人员写核心业务代码的地方永远只有一个：`packages/games-polymarket`。** 你只需要改一下外面的“挂载壳子”，就能在“单体应用”和“微前端”之间随意无缝切换，这就叫真正的架构弹性！

---

## 💡 梳理总结

通过这个蓝图，你可以清晰地看到我们设计的“大底座单容器”护城河：
1. **脏活累活**（各种链的签名、AA 钱包）被关进了 `packages/web3-core` 的笼子里。
2. **样式重复** 被关进了 `packages/uikit` 的笼子里。
3. **第三方游戏** 被关进了独立的 `packages/games-polymarket` 笼子里（开发态隔离）。
4. 唯独居中调度的、最轻盈的 **`apps/web`**，只负责组装这些积木，展现极其清爽的 Web2 充提界面，并最终打包出**唯一的一个部署服务**！

这也是为什么 PancakeSwap 和 Uniswap 能支撑上百人协同开发而不崩溃的终极秘密。你觉得这个目录结构，是不是完美契合了咱们“不求人、自己掌控全盘”的初衷？

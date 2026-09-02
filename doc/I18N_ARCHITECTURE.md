# 多语言 (i18n) 架构与新增标准

## 1. 为什么字典文件要放在根目录 `wf-platform/locales`？
刚才开发时我为了让代码迅速跑起来，图省事把字典建在了 `apps/web/src/locales` 里，**这是一个严重的架构失误**，感谢你的指正，我现在已经将它们全部移到了根目录的 `locales/` 下。

### 为什么必须放在根目录？ (大厂的标准做法)
在一个纯正的 Monorepo（如 PancakeSwap 或 Uniswap）中：
1. **资产下沉，全局共享**：翻译字典属于最底层的“资产 (Assets)”。未来的 `packages/uikit` 里的组件、`packages/games-polymarket` 里的页面、甚至未来的 `apps/mobile`，它们都需要读取同一份“确定”和“取消”的翻译。
2. **避免数据冗余**：如果放在 `apps/web/src` 里，那么其他子项目就无法优雅地引用它，最后会导致每个子项目都有自己的一份翻译文件，维护起来将是灾难（改一个词要在 5 个项目里找）。
3. **PancakeSwap 的做法**：PancakeSwap 虽然最后把 JSON 放在了 Web 的 `public` 文件夹供网络动态请求，但他们的源文件（搭配 Crowdin 翻译协作平台时）依然是有一个全局唯一的真实来源（Single Source of Truth）的。我们直接放在根目录是最标准的解法。

## 2. 国际化 (i18n) 为什么要采用混合架构？
我们的 `LanguageProvider` 融合了 Uniswap 和 PancakeSwap 的优势：
*   **PancakeSwap 强项（无感切换）**：不在 URL 里强行插入 `/zh/` 等目录结构，依赖 `localStorage` 进行本地无感记忆，对以 DApp 为主的应用来说，性能最高，不会闪屏跳路由。
*   **Uniswap 强项（强推广属性）**：我们在初始化时，会嗅探 URL 中的 `?lng=zh-CN`。这意味着你可以把带有中文参数的网址直接分享给其他国家的用户，他们打开瞬间就是中文，极大地提升了裂变传播体验。

## 3. 后续新增语言/国家的标准流程 (SOP)
如果未来业务拓展需要增加新语言（如日语、韩语），必须严格按照以下三步执行：

### Step 1: 在根目录增加字典文件
在 `/locales` 目录下创建对应的 JSON 文件。命名必须严格遵守 **ISO 639 语言代码 + ISO 3166 国家代码** 规范。
*   例如日语：`/locales/ja-JP.json`
*   例如繁体中文（台湾）：`/locales/zh-TW.json`

### Step 2: 在 `packages/uikit` 中注册新语言
修改 `packages/uikit/src/providers/LanguageProvider.tsx` 中的配置数组：
```typescript
export const SUPPORTED_LANGUAGES: Language[] = [
  { locale: "en-US", name: "English" },
  { locale: "zh-CN", name: "简体中文" },
  { locale: "ja-JP", name: "日本語" }, // 新增的语言
];
```
一旦在这里注册，全平台所有的下拉菜单、URL 嗅探器将自动生效并接管这种新语言。

### Step 3: 在 `apps/web` (或其他项目) 中引入字典
修改 `apps/web/src/app/layout.tsx`，将新增的字典对象合并进资源配置中：
```typescript
import jaJP from '../../../../../locales/ja-JP.json'

const resources = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "ja-JP": jaJP, // 注入新语言字典
}
```
*注：未来如果字典过于庞大（超过 1MB），我们需要将此处改为懒加载 (Lazy Load) 或网络动态加载 (Fetch Public JSON) 的模式，以提升首屏速度。目前在起步阶段，静态导入是最稳健的做法。*

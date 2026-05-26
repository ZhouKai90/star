# star — 星星存钱罐

儿童行为奖励系统（星星存钱罐）。家长通过完成任务奖励星星、扣除坏习惯星星、兑换礼物。
已从单页 PWA 改造为**微信小程序**，同时保留 `index.html`（Web 版）。

- 仓库: https://github.com/ZhouKai90/star
- 分支: `main`
- 微信小程序入口: 由微信开发者工具打开本项目根目录（`app.json` 为配置入口）
- 原始 Web 版入口: `index.html`（1311 行，React + CDN，已不再维护）

## 技术栈

纯原生微信小程序开发（无第三方框架/依赖）：

| 技术 | 说明 |
|---|---|
| WXML | 模板语言（类似 HTML） |
| WXSS | 样式（类似 CSS，rpx 单位） |
| JS | 逻辑层（ES6+） |
| wx.setStorageSync / wx.getStorageSync | 数据持久化 |
| npm | 无 npm 依赖，项目没有 `node_modules` 和 `package.json` |

## 微信小程序文件结构

```
star/
├── app.json              # 小程序全局配置（页面注册、窗口设置）
├── app.js                # 全局逻辑 + 数据管理 + localStorage 持久化
├── app.wxss              # 全局样式（Tailwind 风格 utility class）
├── project.config.json   # 微信开发者工具项目配置（共享，appid 占位）
├── project.private.config.json  # 个人开发者配置（本地覆盖，不提交）
├── sitemap.json          # 搜索索引配置
├── index.html            # 原始 Web 版（保留参考）
├── utils/
│   └── util.js           # 日期工具函数
└── pages/
    ├── index/            # 主页面：星星展示 + 3 标签（赚/扣/换）
    ├── history/          # 历史记录页面
    └── manage/           # 管理设置页面
```

## 开发命令

使用**微信开发者工具**打开项目根目录即可预览/调试/上传。无需任何安装步骤。

## 数据持久化

所有数据通过 `wx.setStorageSync`/`wx.getStorageSync` 存储，键名前缀 `starJar_`：

| storage 键 | 类型 | 说明 |
|---|---|---|
| `starJar_stars` | number | 当前星星总数 |
| `starJar_tasks` | JSON | 任务列表（赚星星） |
| `starJar_rewards` | JSON | 奖励列表（换礼物） |
| `starJar_history` | JSON | 历史记录（按时间倒序） |
| `starJar_badHabits` | JSON | 坏习惯列表（扣星星） |

> 数据在 `app.globalData` 中统一管理，通过 `app.saveData()` 写回 storage。
> **修改数据后必须调用 `app.saveData()` 持久化。**

## 页面路由

| 路径 | 功能 | 导航方式 |
|---|---|---|
| `pages/index/index` | 主页面（星星 + 3 标签） | 默认首页 |
| `pages/history/history` | 历史记录 | `wx.navigateTo` |
| `pages/manage/manage` | 管理设置 | `wx.navigateTo` |

主页面 `activeTab` 控制三个子视图：

| 值 | 功能 | 颜色主题 |
|---|---|---|
| `earn` | 赚星星（完成任务） | 黄 |
| `deduct` | 扣星星（坏习惯） | 红 |
| `spend` | 换礼物（消耗星星） | 粉 |

## 重要业务约束

1. **同日可重复奖励** — 同一任务在同一天可以多次奖励，不可关闭。
2. **未来日期限制** — 不能为未来日期赚星星；扣星星和换礼物总是当前日期。
3. **星星不能为负** — 扣星操作通过 `Math.max(0, stars - value)` 防止负数。
4. **所有交互需确认** — 扣星、兑换、修改星星、删除项目/历史、重置数据都经过模态框二次确认。
5. **模态框模式** — 通过 `modalActionType` 字符串区分不同操作，在 `handleModalConfirm` 中 switch 分发。
6. **自定义输入** — 三个标签都有自定义输入表单（自定义奖励/扣星/兑换），与预设列表并存。

## 小程序特有约束

1. **所有页面使用 `navigationStyle: "custom"`** — 隐藏原生导航栏，所有页面顶部返回栏为自定义组件。
2. **WXML 限制** — 不支持 `bindtap="{{condition ? 'a' : 'b'}}"` 表达式；函数调用须在 `data` 中预计算。
3. **Component mode** — 日历条和模态框为内联在页面 WXML 中，未使用自定义组件。
4. **图标** — 统一使用 Emoji 代替 SVG 图标（原 Web 版使用 lucide-react）。
5. **通知** — 通过 `showNotification(msg, type)` 显示底部浮层通知，2 秒自动消失。
6. **发布前需在 `project.config.json` 中替换 `appid`** — 默认占位 `YOUR_APP_ID`。`project.private.config.json` 中的配置会覆盖共享配置。

## 编码规范

- 缩进: 2 空格
- 命名: camelCase（变量/函数），`handle*` 事件处理
- 日期处理: 使用 `utils/util.js` 中的工具函数（`isSameDay`、`getWeekDays`、`formatDateTime`）
- 数据刷新: 每次页面 `onShow` 调用 `refreshData()`/`loadData()` 从 `app.globalData` 同步
- 所有 UI 文本使用简体中文

## 修改注意事项

- 添加新的 `localStorage` 键时，必须在 `app.js` 的 `loadData()` 和 `saveData()` 中同步添加。
- 修改 `app.globalData` 后必须调用 `app.saveData()` 持久化。
- 新增页面必须在 `app.json` 的 `pages` 数组中注册。
- WXML 模板中不能直接调用 JS 方法 — 所有展示数据需在 JS 中预计算后通过 `setData` 传递。
- 原始 `index.html` 保留作为功能参考，不要修改。
- 两个 config 文件共存：`project.config.json`（共享）和 `project.private.config.json`（本地，不提交）。后者优先级更高。
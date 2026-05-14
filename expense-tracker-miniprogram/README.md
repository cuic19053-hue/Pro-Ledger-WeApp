# CH 记账 - 微信小程序

一款专为大学生和年轻用户设计的极简记账小程序，界面清新简洁，功能实用高效。支持本地存储与微信云开发双模式，数据安全可靠。

## 功能特性

### 核心功能
- 📊 **首页概览**：展示本月收支结余、预算使用情况，支持数字动画效果
- 📝 **快速记账**：支持支出/收入分类记账，一键快速记账模板
- 📋 **账单明细**：按时间查看所有账单记录，支持详情查看与删除
- 📈 **统计分析**：支出/收入分类统计、趋势分析、数据可视化
- 💰 **预算管理**：设置月度总预算与分类预算，实时监控预算使用
- 🤖 **智能分析**：基于消费数据的智能分析与建议
- 👤 **个人中心**：用户信息管理、数据备份、隐私协议、使用帮助

### 高级功能
- 🌙 **自动主题切换**：根据时间自动切换浅色/深色主题
- ☁️ **云同步**：微信云开发支持，多设备数据同步
- 📤 **数据导出**：支持账单数据导出（高级功能）
- 🔄 **离线队列**：网络异常时自动缓存，恢复后同步
- 🎯 **快速记账模板**：自定义常用记账模板，一键快速记账

## 技术架构

### 前端
- 微信小程序原生开发（WXML + WXSS + JS）
- CSS 变量实现动态主题配色
- 自定义组件：粒子背景、骨架屏
- 数字动画、页面转场动画

### 后端
- 微信云开发（云数据库 + 云函数）
- 云函数：`login`（用户登录与 openid 获取）
- 数据安全规则：基于 `_openid` 的用户数据隔离

### 数据层
- **本地存储**：`wx.setStorageSync` 缓存账单、预算、用户信息
- **云数据库**：`bills`、`users` 集合，支持多端同步
- **离线队列**：网络异常时的操作缓存与重试机制

### 测试体系
- 单元测试（Jest）：`utils/` 工具函数
- 集成测试：页面交互与数据流
- E2E 测试：完整用户旅程

## 项目结构

```
expense-tracker-miniprogram/
├── app.js                    # 应用入口，全局数据与生命周期
├── app.json                  # 全局配置：页面路由、窗口、tabBar
├── app.wxss                  # 全局样式与 CSS 变量
├── pages/                    # 页面目录
│   ├── splash/               # 启动页
│   ├── login/                # 登录页
│   ├── home/                 # 首页（收支概览、预算、最近账单）
│   ├── bills/                # 账单列表页
│   ├── bill-detail/          # 账单详情页
│   ├── add/                  # 记账页（支出/收入）
│   ├── add-bill/             # 添加账单页
│   ├── stats/                # 统计分析页
│   ├── budget/               # 预算管理页
│   ├── analysis/             # 智能分析页
│   ├── profile/              # 个人中心页
│   ├── quick-bills-manage/   # 快速记账模板管理
│   ├── agreement/            # 用户协议
│   ├── privacy/              # 隐私政策
│   └── help/                 # 使用帮助
├── components/               # 自定义组件
│   ├── particle-background/  # 粒子背景动画
│   └── skeleton/             # 骨架屏加载
├── utils/                    # 工具函数
│   ├── dataManager.js        # 数据管理器（本地+云端）
│   ├── helpers.js            # 通用辅助函数（日期、金额格式化）
│   ├── validators.js         # 表单验证
│   ├── animationUtils.js     # 动画工具
│   ├── numberAnimator.js     # 数字滚动动画
│   ├── exportUtils.js        # 数据导出
│   ├── offlineQueue.js       # 离线操作队列
│   └── quickBills.js         # 快速记账模板管理
├── cloudfunctions/           # 云函数
│   └── login/                # 登录云函数（获取 openid）
├── tests/                    # 测试目录
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   ├── e2e/                  # E2E 测试
│   └── test-utils/           # 测试工具与 mock
├── docs/                     # 项目文档
│   ├── database-security-rules.md  # 数据库安全规则
│   └── mcp-usage-guide.md          # MCP 使用指南
└── images/                   # 静态图片资源（tabBar 图标等）
```

## 快速开始

### 环境要求
- 微信开发者工具（最新稳定版）
- 微信小程序 AppID（或测试号）
- Node.js（用于运行测试）

### 安装与运行

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd expense-tracker-miniprogram
   ```

2. **安装依赖（测试用）**
   ```bash
   npm install
   ```

3. **导入微信开发者工具**
   - 打开微信开发者工具
   - 点击「导入项目」
   - 选择项目目录
   - 填写 AppID（或使用测试号）
   - 点击「确定」

4. **配置云开发（可选，用于数据同步）**
   - 在微信开发者工具中点击「云开发」
   - 开通云开发环境，获取环境 ID
   - 修改 `app.js` 中的 `env` 配置
   - 部署 `cloudfunctions/login` 云函数
   - 创建数据库集合：`bills`、`users`
   - 配置安全规则（参考 `docs/database-security-rules.md`）

5. **运行测试**
   ```bash
   npm test              # 运行全部测试
   npm run test:unit     # 单元测试
   npm run test:coverage # 覆盖率报告
   ```

## 配置说明

### 主题配色
主题色通过 CSS 变量定义，支持自动切换：

```css
/* app.wxss */
:root {
  --primary: #167C74;      /* 主色调 - 深青绿 */
  --primary-light: #E8F5F0; /* 浅主色背景 */
  --accent: #FF7C70;       /* 强调色 - 珊瑚红 */
  --bg: #F4EFE6;           /* 页面背景 - 暖米色 */
  --card-bg: #FFFDF8;      /* 卡片背景 - 米白色 */
  --text: #2C3A32;         /* 主文字 - 深墨绿 */
  --text-secondary: #7B8790; /* 次要文字 */
}
```

### 预算配置
默认预算在 `app.js` 的 `globalData.budget` 中配置，用户可在「预算管理」页修改。

### 分类配置
支出/收入分类在 `app.js` 的 `globalData.categories` 中定义，支持用户自定义扩展。

## 数据流设计

```
用户操作
  │
  ▼
Page（页面层）───► dataManager（数据管理层）
  │                    │
  │                    ├──► 本地存储（wx.setStorageSync）
  │                    │
  │                    └──► 云数据库（wx.cloud.database）
  │
  ▼
UI 更新（this.setData）
```

### 数据同步策略
1. **启动时**：从云端拉取数据，合并到本地
2. **记账时**：优先写入云端，失败则加入离线队列
3. **网络恢复**：自动处理离线队列，同步未完成的操作

## 开发规范

### 代码风格
- 使用 ES6+ 语法
- 异步操作使用 `async/await`
- 错误处理使用 `try/catch`

### 性能优化
- 避免频繁的 `setData`，合并数据更新
- 使用 `lazyCodeLoading` 按需加载页面
- 图片资源使用压缩后的 PNG

### 安全规范
- 用户数据通过 `_openid` 隔离
- 云函数验证用户身份
- 敏感操作（删除数据）需要二次确认

## 文档索引

| 文档 | 说明 |
|------|------|
| `docs/database-security-rules.md` | 数据库安全规则配置指南 |
| `docs/mcp-usage-guide.md` | MCP 工具使用指南 |
| `UPLOAD_CHECKLIST.md` | 小程序上传发布检查清单 |
| `重构完成报告-工具函数统一.md` | 代码重构记录 |
| `tests/comprehensive-test-report.md` | 测试报告 |

## 技术栈

- **框架**：微信小程序原生框架
- **样式**：WXSS + CSS 变量
- **存储**：本地存储 + 微信云开发数据库
- **后端**：微信云函数
- **测试**：Jest
- **工具**：微信开发者工具、Trae CN（AI 辅助开发）

## 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2026-04 | 初始版本，核心记账功能 |

## 开发者

基于 HTML Demo 转化并持续迭代，保留核心交互逻辑，新增云同步、主题切换、快速记账等高级功能。

## 开源协议

MIT License

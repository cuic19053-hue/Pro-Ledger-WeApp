# 账单管理小程序 - 极简商务 3.0 The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 建立极简商务 3.0 设计系统
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 配色系统：深空黑（#1C1C1E）、商务银（#F2F2F7）、爱马仕橙（#FF8F00）
  - 字体系统：iOS 系统字体，字重 500/400
  - 直角设计：全站 border-radius: 0px
  - 间距系统：8px 网格，大间距（24/32/48px）
  - 动效规范：0.2s ease-in-out
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-9]
- **Test Requirements**:
  - `programmatic` TR-1.1: 所有 CSS 变量已定义（深空黑、商务银、爱马仕橙）
  - `programmatic` TR-1.2: 所有容器直角（border-radius: 0px）
  - `programmatic` TR-1.3: 字体使用 iOS 系统字体
  - `programmatic` TR-1.4: 动效时长 0.2s

## [ ] Task 2: 重做首页（数据概览）
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 顶部隐藏标题栏，大面积负空间
  - 巨大本月结余数字（48-64px，深空黑）
  - 直角列表项（无分割线，间距区分）
  - 深空黑直角 FAB 按钮（右下角，白色+号）
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-4, AC-8]
- **Test Requirements**:
  - `programmatic` TR-2.1: 结余数字 48-64px
  - `programmatic` TR-2.2: 所有容器直角
  - `human-judgement` TR-2.3: 巨大负空间
  - `human-judgement` TR-2.4: FAB 按钮深空黑直角

## [ ] Task 3: 重做记账页（Modal 弹出层）
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 页面像 Modal 弹出层，压缩高度
  - 巨大金额输入框（半屏，橙色#FF8F00）
  - 分类选择使用 picker view（滚轮，无图标）
  - 底部直角完成按钮（占满宽度，纯黑，白色文字）
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-5]
- **Test Requirements**:
  - `programmatic` TR-3.1: 金额输入框橙色
  - `programmatic` TR-3.2: 所有容器直角
  - `human-judgement` TR-3.3: Modal 弹出层效果
  - `human-judgement` TR-3.4: 完成按钮纯黑直角

## [ ] Task 4: 重做统计页（专业可视化）
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 极细圆环图（细线，无填充）
  - 纯线框折线图（无填充，有网格线）
  - 增加坐标轴小数字
  - 支持左右滑动切换周/月/年
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-6]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 圆环图极细
  - `human-judgement` TR-4.2: 折线图纯线框
  - `human-judgement` TR-4.3: 有网格辅助线
  - `programmatic` TR-4.4: 所有容器直角

## [ ] Task 5: 重做我的页（iOS 设置风格）
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 完全复刻 iOS 设置页面
  - 极简线框图标
  - 直角列表项（左侧图标、中间名称、右侧箭头）
  - 去掉复杂个人信息，仅保留简洁头像和用户名
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-7]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 像 iOS 设置页面
  - `human-judgement` TR-5.2: 极简线框图标
  - `programmatic` TR-5.3: 所有容器直角
  - `human-judgement` TR-5.3: 简洁头像和用户名

## [ ] Task 6: 全局验证与调整
- **Priority**: P1
- **Depends On**: Task 2, Task 3, Task 4, Task 5
- **Description**: 
  - 检查全站直角设计
  - 检查配色系统
  - 检查负空间是否充足
  - 检查动效是否正确
  - 真机测试
  - 准备上线
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-8, AC-9, AC-10]
- **Test Requirements**:
  - `programmatic` TR-6.1: 全站直角
  - `programmatic` TR-6.2: 配色正确
  - `human-judgement` TR-6.3: 负空间充足
  - `human-judgement` TR-6.4: 动效正确
  - `human-judgement` TR-6.5: 体现严谨、高智、昂贵

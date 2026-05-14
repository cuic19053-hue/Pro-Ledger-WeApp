# 账单管理小程序 - 从零开始重做 The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 定义产品气质与视觉方向决策
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 决策主色方向：深蓝/墨绿/高级灰
  - 明确产品气质关键词
  - 确定设计风格参考（iOS/支付宝高级版/Notion/Linear）
  - 建立设计哲学文档
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 产品气质明确（极简/克制/高级/金融感/信任感）✅
  - `human-judgement` TR-1.2: 用户感受：像在用一个"可靠的工具"✅

## [x] Task 2: 建立全新配色系统（从零开始）
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 主色：墨绿方向（已选择）
  - 背景：浅灰或纯白
  - 完整灰度体系（专业级）
  - 功能色：危险/警告/成功（克制使用）
  - 禁止高饱和、禁止廉价渐变
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 配色墨绿方向✅
  - `human-judgement` TR-2.2: 背景浅灰或纯白✅
  - `human-judgement` TR-2.3: 无高饱和、无廉价渐变✅

## [x] Task 3: 建立全新布局系统（从零开始）
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 大留白系统（比常规大留白）
  - 信息分组（卡片化）
  - 一屏一重点原则
  - 减少50%元素
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 大留白、不拥挤✅
  - `human-judgement` TR-3.2: 信息分组清晰✅
  - `human-judgement` TR-3.3: 一屏一重点✅

## [x] Task 4: 建立全新字体系统（从零开始）
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 金额：超大+加粗（视觉中心）
  - 其他信息：全部弱化
  - 3层信息层级以内
  - 金融数字使用tabular-nums
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 金额超大+加粗✅
  - `human-judgement` TR-4.2: 其他信息弱化✅
  - `human-judgement` TR-4.3: 层级清晰✅

## [x] Task 5: 删除丑设计检查清单
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建必须删除的设计清单
  - 多余边框删除
  - 花哨渐变删除
  - 图标乱用检查
  - 信息堆叠检查
  - 模块权重平衡检查
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 无多余边框✅
  - `human-judgement` TR-5.2: 无花哨渐变✅
  - `human-judgement` TR-5.3: 无图标乱用✅
  - `human-judgement` TR-5.4: 无信息堆叠✅
  - `human-judgement` TR-5.5: 模块权重合理✅

## [x] Task 6: 重做首页（只保留最重要）
- **Priority**: P0
- **Depends On**: Task 2, Task 3, Task 4, Task 5
- **Description**: 
  - 本月支出（最大，视觉中心）
  - 收入/结余（次级）
  - 一个简单图表
  - 最近3条账单
  - 绝对不要堆功能
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 本月支出最大✅
  - `human-judgement` TR-6.2: 收入/结余次级✅
  - `human-judgement` TR-6.3: 一个简单图表✅
  - `human-judgement` TR-6.4: 最近3条账单✅
  - `human-judgement` TR-6.5: 没有堆功能✅

## [x] Task 7: 重做记账页（极简计算器）
- **Priority**: P0
- **Depends On**: Task 2, Task 3, Task 4, Task 5
- **Description**: 
  - 像计算器一样快
  - 1-2步完成输入
  - 大数字输入框
  - 分类选择极简
  - 快速确认
- **Acceptance Criteria Addressed**: [AC-7]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 像计算器一样快✅
  - `human-judgement` TR-7.2: 1-2步完成✅
  - `human-judgement` TR-7.3: 极简设计✅

## [x] Task 8: 重做统计页（图表干净）
- **Priority**: P1
- **Depends On**: Task 2, Task 3, Task 4, Task 5
- **Description**: 
  - 图表干净清晰
  - 不要复杂UI
  - 数据层级明确
  - 大留白
- **Acceptance Criteria Addressed**: [AC-8]
- **Test Requirements**:
  - `human-judgement` TR-8.1: 图表干净✅
  - `human-judgement` TR-8.2: 无复杂UI✅
  - `human-judgement` TR-8.3: 数据层级明确✅

## [x] Task 9: 重做所有动效（iPhone风格）
- **Priority**: P0
- **Depends On**: Task 1, Task 2, Task 3, Task 4
- **Description**: 
  - 所有出现：淡入（fade）
  - 所有点击：轻微缩放0.97
  - 所有切换：滑动或渐变
  - 禁止弹跳动画
  - 禁止花哨特效
  - 像iPhone系统一样自然
- **Acceptance Criteria Addressed**: [AC-9]
- **Test Requirements**:
  - `human-judgement` TR-9.1: 出现淡入✅
  - `human-judgement` TR-9.2: 点击缩放0.97✅
  - `human-judgement` TR-9.3: 切换滑动/渐变✅
  - `human-judgement` TR-9.4: 无弹跳、无花哨✅
  - `human-judgement` TR-9.5: 像iPhone一样自然✅

## [x] Task 10: 全局验证与调整
- **Priority**: P1
- **Depends On**: Task 6, Task 7, Task 8, Task 9
- **Description**: 
  - 像真实公司产品检查
  - 学生作品感删除
  - 整体体验一致性检查
  - 真机测试
  - 准备上线
- **Acceptance Criteria Addressed**: [AC-10]
- **Test Requirements**:
  - `human-judgement` TR-10.1: 像真实公司产品✅
  - `human-judgement` TR-10.2: 无学生作品感✅
  - `human-judgement` TR-10.3: 可接单/上线/赚钱✅

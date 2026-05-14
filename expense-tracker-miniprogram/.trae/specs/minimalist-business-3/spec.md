# 账单管理小程序 - 极简商务 3.0 重做 Product Requirement Document

## Overview
- **Summary**: 将现有设计全面升级为"极简商务 3.0"风格，采用直角设计、深空黑/商务银配色、爱马仕橙点缀，打造严谨、高智、昂贵的资产管理工具
- **Purpose**: 从"墨绿极简"升级为"极简商务 3.0"，更符合高阶商务人士定位，强调专业性和严谨感
- **Target Users**: 高阶商务人士、资产管理工具用户（追求极致效率、专业严谨）

## Goals
- 全站使用直角设计（border-radius: 0px），建立秩序感
- 引入深空黑（#1C1C1E）和商务银（#F2F2F7）配色体系
- 使用爱马仕橙（#FF8F00）作为唯一强调色，精准使用
- 图表重构：极细圆环、纯线框折线图、增加网格线
- 排版优化：增加行高，大面积负空间，营造"昂贵"呼吸感
- 字体使用 iOS 系统字体，字重严谨区分

## Non-Goals (Out of Scope)
- ❌ 不修改后端逻辑和数据结构
- ❌ 不添加新功能，只重做现有 UI
- ❌ 不进行国际化
- ❌ 不添加深色模式（当前阶段）

## Background & Context
用户明确要求：
- 风格迭代：极简商务 3.0（严谨、高智、昂贵）
- 色调升级：深空黑 + 商务银 + 爱马仕橙
- 形状调整：全站直角（R0），无圆角
- 图表重构：极细圆环、纯线框、网格线
- 排版优化：大行高、纯白负空间

## Functional Requirements
- **FR-1**: 建立极简商务 3.0 设计系统（直角、深空黑、商务银、爱马仕橙）
- **FR-2**: 重做首页（巨大结余数字、直角列表项、深空黑 FAB）
- **FR-3**: 重做记账页（Modal 弹出层、巨大金额输入、直角完成按钮）
- **FR-4**: 重做统计页（极细圆环、纯线框折线图、网格线）
- **FR-5**: 重做我的页（iOS 设置风格、极简线框图标）
- **FR-6**: 全站直角设计，无任何圆角

## Non-Functional Requirements
- **NFR-1**: 所有容器必须使用直角（border-radius: 0px）
- **NFR-2**: 主色必须是深空黑（#1C1C1E）、商务银（#F2F2F7）、爱马仕橙（#FF8F00）
- **NFR-3**: 字体必须使用 iOS 系统字体，字重严谨区分（500/400）
- **NFR-4**: 图表必须极细、专业、有网格线
- **NFR-5**: 必须有大量负空间，营造"昂贵"呼吸感
- **NFR-6**: 动效必须轻微、快速（0.2s ease-in-out）

## Constraints
- **Technical**: 微信小程序平台，使用 WXML/WXSS/JS
- **Business**: 必须可直接上线，不能有破坏性变更
- **Dependencies**: 依赖现有数据结构和业务逻辑

## Assumptions
- 现有业务逻辑和数据结构稳定，无需修改
- 用户熟悉当前的基本操作流程
- 目标设备以 iOS 为主，兼顾 Android
- 小程序版本支持最新的 CSS 特性

## Acceptance Criteria

### AC-1: 直角设计严格执行
- **Given**: 设计完成
- **When**: 检查所有容器
- **Then**: 所有按钮、输入框、容器必须使用直角（border-radius: 0px），无任何圆角
- **Verification**: `programmatic`

### AC-2: 配色系统正确
- **Given**: 配色系统建立
- **When**: 检查所有颜色使用
- **Then**: 主色必须是深空黑（#1C1C1E）、商务银（#F2F2F7）、爱马仕橙（#FF8F00），无其他颜色
- **Verification**: `programmatic`

### AC-3: 字体系统正确
- **Given**: 字体系统建立
- **When**: 检查所有文字
- **Then**: 必须使用 iOS 系统字体，主要信息 500 字重，次要信息 400 字重
- **Verification**: `programmatic`

### AC-4: 首页重做
- **Given**: 首页设计完成
- **When**: 查看首页
- **Then**: 必须有巨大结余数字（48-64px）、直角列表项、深空黑 FAB 按钮
- **Verification**: `human-judgment`

### AC-5: 记账页重做
- **Given**: 记账页设计完成
- **When**: 查看记账页
- **Then**: 必须像 Modal 弹出层、巨大金额输入框（橙色）、直角完成按钮
- **Verification**: `human-judgment`

### AC-6: 统计页重做
- **Given**: 统计页设计完成
- **When**: 查看统计页
- **Then**: 必须有极细圆环图、纯线框折线图、网格辅助线
- **Verification**: `human-judgment`

### AC-7: 我的页重做
- **Given**: 我的页设计完成
- **When**: 查看我的页
- **Then**: 必须像 iOS 设置页面、极简线框图标、直角列表项
- **Verification**: `human-judgment`

### AC-8: 负空间充足
- **Given**: 所有页面完成
- **When**: 检查页面布局
- **Then**: 必须有大量负空间（纯白），组件间距 24/32/48px，营造"昂贵"呼吸感
- **Verification**: `human-judgment`

### AC-9: 动效正确
- **Given**: 动效设计完成
- **When**: 测试所有动效
- **Then**: 所有过渡必须是 0.2s ease-in-out，数字刷新轻微淡入
- **Verification**: `programmatic`

### AC-10: 整体气质
- **Given**: 全部设计完成
- **When**: 整体体验
- **Then**: 必须体现：严谨、高智、资产管理、iOS 原生感、昂贵且专业
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要调整底部 Tab 栏的设计为直角？
- [ ] 是否需要重新设计图标为纯线框风格？

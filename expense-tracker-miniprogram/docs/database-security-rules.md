# 数据库安全规则配置指南

## 概述
本文档说明如何配置微信云开发数据库的安全规则，确保用户数据安全。

## 安全规则配置

### 1. bills 集合（账单数据）
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```
**说明**：用户只能读写自己的账单数据

### 2. users 集合（用户信息）
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```
**说明**：用户只能读写自己的用户信息

### 3. categories 集合（分类数据）
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```
**说明**：所有人可读，但只能修改自己的分类

### 4. budgets 集合（预算数据）
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```
**说明**：用户只能读写自己的预算数据

## 配置步骤

### 方法一：通过微信开发者工具配置
1. 打开微信开发者工具
2. 点击顶部菜单「云开发」
3. 进入「数据库」标签页
4. 选择对应集合，点击「设置」-「权限设置」
5. 选择「自定义安全规则」，粘贴上述规则
6. 点击「确定」保存

### 方法二：通过云开发控制台配置
1. 访问 https://console.cloud.tencent.com/tcb
2. 选择对应的云开发环境
3. 进入「数据库」-「集合管理」
4. 选择集合，点击「权限设置」
5. 配置自定义安全规则

## 验证规则配置

配置完成后，可以通过以下方式验证：

### 1. 测试读取他人数据
```javascript
// 尝试读取其他用户的数据，应该失败
wx.cloud.database().collection('bills')
  .where({
    _openid: 'other-user-openid'
  })
  .get()
  .then(res => {
    console.log('应该无法获取到数据')
  })
  .catch(err => {
    console.log('权限验证成功:', err)
  })
```

### 2. 测试写入数据
```javascript
// 写入自己的数据，应该成功
wx.cloud.database().collection('bills').add({
  data: {
    type: 'expense',
    amount: 100,
    category: 'food',
    date: new Date().toISOString()
  }
})
.then(res => {
  console.log('写入成功:', res)
})
```

## 最佳实践

### 1. 数据隔离
- 始终使用 `_openid` 字段进行用户数据隔离
- 云函数中也要验证用户身份

### 2. 定期审查
- 定期检查安全规则配置
- 监控异常访问日志

### 3. 数据备份
- 定期备份数据库
- 配置数据库回收站

### 4. 权限最小化原则
- 只授予必要的读写权限
- 避免使用过于宽松的规则

## 常见问题

### Q: 为什么我无法读取数据？
A: 检查安全规则是否正确配置，确保 `_openid` 匹配。

### Q: 如何允许管理员访问所有数据？
A: 可以使用云函数绕过安全规则，或者配置管理员白名单。

### Q: 安全规则修改后多久生效？
A: 通常立即生效，最多不超过 1 分钟。

## 相关文档
- 微信云开发数据库安全规则：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/security-rules.html
- 云开发最佳实践：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/best-practices/

function validateAmount(amount) {
  const errors = {}

  if (!amount || amount.trim() === '') {
    errors.amount = '请输入金额'
    return { isValid: false, errors }
  }

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount)) {
    errors.amount = '请输入有效金额'
    return { isValid: false, errors }
  }
  if (numAmount <= 0) {
    errors.amount = '金额必须大于0'
    return { isValid: false, errors }
  }
  if (numAmount > 999999) {
    errors.amount = '金额不能超过999999'
    return { isValid: false, errors }
  }

  errors.amount = ''
  return { isValid: true, errors }
}

function validateCategory(selectedCategory) {
  const errors = {}
  if (!selectedCategory) {
    errors.category = '请选择分类'
    return { isValid: false, errors }
  }
  errors.category = ''
  return { isValid: true, errors }
}

function formatAmountInput(value) {
  if (!value) return ''

  let formatted = value.replace(/[^\d.]/g, '')

  const parts = formatted.split('.')
  if (parts.length > 2) {
    formatted = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts[1] && parts[1].length > 2) {
    formatted = parts[0] + '.' + parts[1].slice(0, 2)
  }

  return formatted
}

function validatePhone(phone) {
  if (!phone) {
    return '请输入手机号'
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return '请输入正确的11位手机号'
  }
  return ''
}

function validateCode(code) {
  if (!code) {
    return '请输入验证码'
  }
  if (code.length !== 6) {
    return '请输入6位验证码'
  }
  if (!/^\d{6}$/.test(code)) {
    return '验证码必须是6位数字'
  }
  return ''
}

module.exports = {
  validateAmount,
  validateCategory,
  formatAmountInput,
  validatePhone,
  validateCode
}
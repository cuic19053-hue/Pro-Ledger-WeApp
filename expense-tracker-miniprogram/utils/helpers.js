function formatTime(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

function formatAmount(amount, options = {}) {
  const { prefix = '', decimalPlaces = 2 } = options
  if (typeof amount === 'string') {
    amount = parseFloat(amount)
  }
  if (isNaN(amount) || amount === null || amount === undefined) {
    return prefix + '0.00'
  }
  if (Math.abs(amount) >= 1e8) {
    return prefix + (amount / 1e8).toFixed(2) + '亿'
  }
  if (Math.abs(amount) >= 1e4) {
    return prefix + (amount / 1e4).toFixed(2) + '万'
  }
  return prefix + amount.toFixed(decimalPlaces)
}

function getRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return formatDate(date)
    }
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

function formatBillDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  if (diff < 86400000) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `今天 ${hours}:${minutes}`
  } else if (diff < 172800000) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `昨天 ${hours}:${minutes}`
  } else {
    const month = (date.getMonth() + 1).toString()
    const day = date.getDate().toString()
    return `${month}月${day}日`
  }
}

function validateAmount(amount) {
  if (typeof amount === 'string') {
    amount = parseFloat(amount)
  }
  
  if (isNaN(amount) || amount <= 0) {
    return false
  }
  
  if (amount < 0.01 || amount > 9999999.99) {
    return false
  }
  
  // 检查小数位数
  const amountStr = amount.toString()
  const decimalIndex = amountStr.indexOf('.')
  if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
    return false
  }
  
  return true
}

function formatMonth(monthStr) {
  if (!monthStr) return ''
  const [year, month] = monthStr.split('-')
  return `${year}年${parseInt(month)}月`
}

function formatDateWithWeekday(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 ${weekday}`
}

function getMonthDateRange(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`

  let nextMonth = month + 1
  let nextYear = year
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear++
  }
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  return { startDate, endDate }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) {
    return '夜深了'
  } else if (hour < 12) {
    return '早上好'
  } else if (hour < 14) {
    return '中午好'
  } else if (hour < 18) {
    return '下午好'
  } else {
    return '晚上好'
  }
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  })
}

function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

function hideLoading() {
  wx.hideLoading()
}

function showModal(title, content, options = {}) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      confirmColor: options.confirmColor || '#5EA77A',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        if (res.confirm) {
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail: reject
    })
  })
}

module.exports = {
  formatTime,
  formatDate,
  formatAmount,
  getRelativeTime,
  formatBillDate,
  validateAmount,
  formatMonth,
  formatDateWithWeekday,
  getMonthDateRange,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  getGreeting
}
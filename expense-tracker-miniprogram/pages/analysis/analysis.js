const app = getApp()
const dataManager = app.getDataManager()
const { formatMonth, formatAmount } = require('../../utils/helpers.js')

Page({
  data: {
    selectedMonth: '',
    totalExpense: 0,
    totalIncome: 0,
    balance: 0,
    totalExpenseFormatted: '0.00',
    totalIncomeFormatted: '0.00',
    balanceFormatted: '0.00',
    expenseDetails: [],
    isLoading: false,
    isAIMode: false,
    showAIFeature: false,
    timeRanges: ['本月', '近3个月', '近6个月', '本年'],
    timeRangeIndex: 0,
    analysisTypes: ['消费结构分析', '趋势分析', '预算对比', '分类排名'],
    analysisTypeIndex: 0,
    quickPrompts: ['帮我省钱', '消费建议', '异常支出检测', '月度总结'],
    selectedPrompt: -1,
    question: '',
    analyzing: false,
    showResult: false,
    analysisResult: ''
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    if (this.data.selectedMonth) {
      this.loadStats()
    }
  },

  initPage() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const monthStr = `${year}-${month}`

    this.setData({
      selectedMonth: monthStr,
      selectedMonthFormatted: formatMonth(monthStr)
    })

    this.loadStats()
  },

  loadStats() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...', mask: true })

    try {
      const { selectedMonth } = this.data
      const bills = this.getMonthBills(selectedMonth)
      this.processStatsData(bills)
    } catch (err) {
      console.error('加载统计数据失败:', err)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ isLoading: false })
      wx.hideLoading()
    }
  },

  getMonthBills(monthStr) {
    const [year, month] = monthStr.split('-').map(Number)
    return app.globalData.bills.filter(bill => {
      const date = new Date(bill.date)
      return date.getFullYear() === year && date.getMonth() === month - 1
    })
  },

  processStatsData(bills) {
    let totalExpense = 0
    let totalIncome = 0
    const expenseMap = {}

    bills.forEach(bill => {
      if (bill.type === 'expense') {
        totalExpense += bill.amount
        expenseMap[bill.category] = (expenseMap[bill.category] || 0) + bill.amount
      } else {
        totalIncome += bill.amount
      }
    })

    const colors = [
      '#667eea', '#f093fb', '#4facfe', '#43e97b',
      '#fa709a', '#fee140', '#30cfd0', '#a8edea',
      '#fccb90', '#d57eeb', '#667eea', '#764ba2'
    ]

    const expenseDetails = []
    let colorIndex = 0

    const categories = [...app.globalData.categories.expense, ...app.globalData.categories.income]

    for (const [categoryId, amount] of Object.entries(expenseMap)) {
      const category = categories.find(c => c.id === categoryId)
      const categoryName = category ? category.name : categoryId
      const categoryIcon = category ? category.icon : '📝'
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      const amountFormatted = formatAmount(amount)
      const percentageFormatted = percentage.toFixed(1)

      expenseDetails.push({
        category: categoryName,
        categoryId: categoryId,
        amount: amount,
        amountFormatted: amountFormatted,
        percentage: percentage,
        percentageFormatted: percentageFormatted,
        color: colors[colorIndex % colors.length],
        categoryIcon: categoryIcon
      })
      colorIndex++
    }

    expenseDetails.sort((a, b) => b.amount - a.amount)

    const balance = totalIncome - totalExpense

    this.setData({
      totalExpense: totalExpense,
      totalIncome: totalIncome,
      balance: balance,
      totalExpenseFormatted: formatAmount(totalExpense),
      totalIncomeFormatted: formatAmount(totalIncome),
      balanceFormatted: formatAmount(Math.abs(balance)),
      expenseDetails: expenseDetails,
      selectedMonthFormatted: formatMonth(this.data.selectedMonth)
    })
  },

  onMonthChange(e) {
    wx.vibrateShort({ type: 'light' })
    this.setData({
      selectedMonth: e.detail.value
    }, () => {
      this.loadStats()
    })
  },

  toggleAIMode() {
    const { isAIMode } = this.data
    if (!isAIMode) {
      wx.showModal({
        title: 'AI 智能分析',
        content: 'AI 智能分析功能正在开发中，预计下个版本上线。届时将根据您的消费习惯提供个性化的省钱建议和消费预警。',
        showCancel: false,
        confirmText: '知道了'
      })
    }
    this.setData({
      isAIMode: !isAIMode,
      showAIFeature: !isAIMode
    })
  },

  onTimeRangeChange(e) {
    this.setData({
      timeRangeIndex: e.detail.value
    })
  },

  onAnalysisTypeChange(e) {
    this.setData({
      analysisTypeIndex: e.detail.value
    })
  },

  selectPrompt(e) {
    wx.showToast({
      title: 'AI 分析开发中',
      icon: 'none'
    })
  },

  onQuestionInput(e) {
    this.setData({
      question: e.detail.value
    })
  },

  startAnalysis() {
    wx.showToast({
      title: 'AI 分析开发中',
      icon: 'none'
    })
  },

  getLocalAnalysis() {
    const now = new Date()
    const stats = dataManager.getMonthlyStats(now.getFullYear(), now.getMonth())
    const categoryStats = dataManager.getCategoryStats(now.getFullYear(), now.getMonth())

    let maxCategory = null
    let maxAmount = 0
    const categories = app.globalData.categories.expense

    Object.keys(categoryStats).forEach(key => {
      if (categoryStats[key].amount > maxAmount) {
        maxAmount = categoryStats[key].amount
        maxCategory = categories.find(c => c.id === key)
      }
    })

    let advice = []
    if (stats.balance < 0) {
      advice.push('本月支出超过收入，建议控制非必要消费')
    }
    if (maxCategory) {
      advice.push(`${maxCategory.name}支出占比最高，可适当控制`)
    }
    if (advice.length === 0) {
      advice.push('本月收支状况良好，继续保持')
    }

    return {
      stats: {
        income: stats.income.toFixed(0),
        expense: stats.expense.toFixed(0),
        balance: stats.balance.toFixed(0)
      },
      maxCategory: maxCategory ? {
        name: maxCategory.name,
        amount: maxAmount.toFixed(0)
      } : null,
      advice
    }
  }
})
const app = getApp()

Page({
  data: {
    budget: {
      total: 3500,
      categories: {}
    },
    remaining: 0,
    budgetPercent: 0,
    categoryBudgets: [],
    isEditing: false,
    editTotal: 0,
    editCategories: [],
    currentMonthDisplay: ''
  },

  onLoad() {
    this.initMonthDisplay()
    this.loadBudget()
  },

  initMonthDisplay() {
    const now = new Date()
    const month = now.getMonth() + 1
    this.setData({
      currentMonthDisplay: `${month}月`
    })
  },

  onShow() {
    this.loadBudget()
  },

  loadBudget() {
    const budget = app.getBudget()
    const categories = app.globalData.categories.expense

    let totalUsed = 0
    const categoryBudgets = []

    Object.keys(budget.categories).forEach(key => {
      const cat = budget.categories[key]
      const category = categories.find(c => c.id === key)
      totalUsed += (cat.used || 0)
      const percent = cat.limit > 0 ? (cat.used / cat.limit * 100) : 0

      categoryBudgets.push({
        id: key,
        name: category ? category.name : key,
        icon: category ? category.icon : '📝',
        limit: cat.limit,
        used: parseFloat((cat.used || 0).toFixed(2)),
        percent: percent.toFixed(1),
        displayPercent: Math.min(percent, 100)
      })
    })

    categories.forEach(cat => {
      if (!budget.categories[cat.id]) {
        budget.categories[cat.id] = { limit: 0, used: 0 }
        categoryBudgets.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          limit: 0,
          used: 0,
          percent: '0',
          displayPercent: 0
        })
      }
    })

    const remaining = budget.total - totalUsed
    const percent = budget.total > 0 ? (totalUsed / budget.total * 100) : 0

    this.setData({
      budget,
      remaining: remaining.toFixed(2),
      budgetPercent: percent.toFixed(1),
      budgetDisplayPercent: Math.min(percent, 100),
      categoryBudgets
    })
  },

  startEdit() {
    const { budget, categoryBudgets } = this.data
    this.setData({
      isEditing: true,
      editTotal: budget.total,
      editCategories: categoryBudgets.map(cat => ({ ...cat }))
    })
  },

  cancelEdit() {
    this.setData({
      isEditing: false,
      editCategories: [],
      editTotal: 0
    })
  },

  onTotalInput(e) {
    const value = e.detail.value
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      this.setData({ editTotal: value })
    }
  },

  onCategoryLimitInput(e) {
    const { index } = e.currentTarget.dataset
    const value = e.detail.value
    const categories = [...this.data.editCategories]

    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      categories[index] = { ...categories[index], limit: value }
      this.setData({ editCategories: categories })
    }
  },

  saveBudget() {
    const { editTotal, editCategories } = this.data

    const total = parseFloat(editTotal) || 0
    if (total <= 0) {
      wx.showToast({ title: '请输入有效预算', icon: 'none' })
      return
    }

    const categories = {}
    let hasValidCategory = false

    editCategories.forEach(cat => {
      const limit = parseFloat(cat.limit) || 0
      categories[cat.id] = {
        limit: limit,
        used: cat.used || 0
      }
      if (limit > 0) hasValidCategory = true
    })

    if (!hasValidCategory) {
      wx.showToast({ title: '请至少设置一个分类预算', icon: 'none' })
      return
    }

    const budgetData = {
      total,
      categories
    }

    const success = app.updateBudget(budgetData)

    if (success) {
      this.setData({ isEditing: false })
      this.loadBudget()
      wx.showToast({
        title: '预算已保存',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  resetBudget() {
    wx.showModal({
      title: '重置预算',
      content: '确定要重置所有预算吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          const defaultBudget = {
            total: 3500,
            categories: {
              food: { limit: 1500, used: 0 },
              shopping: { limit: 1000, used: 0 },
              entertainment: { limit: 300, used: 0 }
            }
          }
          app.updateBudget(defaultBudget)
          this.loadBudget()
          wx.showToast({
            title: '预算已重置',
            icon: 'success'
          })
        }
      }
    })
  }
})
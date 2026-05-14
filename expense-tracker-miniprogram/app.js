const dataManager = require('./utils/dataManager.js')

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    openid: '',
    bills: [],
    themeChangeListeners: [],
    isDarkMode: false,
    categories: {
      expense: [
        { id: 'food', name: '餐饮', icon: '🍜' },
        { id: 'shopping', name: '购物', icon: '🛒' },
        { id: 'transport', name: '交通', icon: '🚇' },
        { id: 'entertainment', name: '娱乐', icon: '🎬' },
        { id: 'study', name: '学习', icon: '📚' },
        { id: 'medical', name: '医疗', icon: '💊' },
        { id: 'housing', name: '住宿', icon: '🏠' },
        { id: 'communication', name: '通讯', icon: '📱' }
      ],
      income: [
        { id: 'salary', name: '工资', icon: '💰' },
        { id: 'parttime', name: '兼职', icon: '💵' },
        { id: 'bonus', name: '奖金', icon: '🎁' },
        { id: 'investment', name: '投资', icon: '📈' },
        { id: 'other', name: '其他', icon: '📝' }
      ]
    },
    budget: {
      total: 1800,
      categories: {
        food: { limit: 1500, used: 1100 },
        shopping: { limit: 1000, used: 850 },
        entertainment: { limit: 300, used: 420 }
      }
    }
  },

  async onLaunch() {
    this.detectTimeTheme()
    this.initCloud()

    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    this.globalData.isLoggedIn = isLoggedIn
    this.globalData.openid = wx.getStorageSync('openid') || ''

    if (!isLoggedIn || !this.globalData.openid) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    this.loadData()

    if (this.globalData._syncLock) return
    this.globalData._syncLock = true

    try {
      await this.ensureOpenid()
      await this.syncDataFromCloud()
    } finally {
      this.globalData._syncLock = false
    }
  },

  async ensureOpenid() {
    if (!this.globalData.openid || this.globalData.openid.startsWith('temp_') || this.globalData.openid.startsWith('local_')) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'login',
          data: { action: 'getOpenid' }
        })
        if (res.result && res.result.openid) {
          this.globalData.openid = res.result.openid
          wx.setStorageSync('openid', res.result.openid)
        }
      } catch (e) {
        console.warn('[App] 获取openid失败:', e)
      }
    }
  },

  detectTimeTheme() {
    const hour = new Date().getHours()
    const isDarkMode = hour < 6 || hour >= 20
    this.globalData.isDarkMode = isDarkMode
  },

  initCloud() {
    if (!wx.cloud) {
      console.warn('[云开发] 当前环境不支持云开发，将使用本地存储')
      return
    }

    try {
      wx.cloud.init({
        env: 'cloud1-2ggxlita6ea40809',
        traceUser: true
      })
      console.log('[云开发] 初始化成功')
      // 初始化 dataManager
      dataManager.init()
    } catch (e) {
      console.warn('[云开发] 初始化失败，将使用本地存储:', e.message)
    }
  },

  async syncDataFromCloud() {
    try {
      console.log('[云开发] 开始从云端同步数据...')
      const cloudBills = await dataManager.loadBillsFromCloud()
      if (cloudBills && cloudBills.length > 0) {
        this.globalData.bills = cloudBills
        this.saveBills()
        this.syncBudgetUsed()
        console.log('[云开发] 数据同步成功，共', cloudBills.length, '条账单')
      }

      const cloudBudget = await dataManager.loadBudgetFromCloud()
      if (cloudBudget) {
        this.globalData.budget = cloudBudget
        wx.setStorageSync('budget', JSON.stringify(cloudBudget))
        console.log('[云开发] 预算同步成功')
      }

      const cloudQuickBills = await dataManager.loadQuickBillsFromCloud()
      if (cloudQuickBills && cloudQuickBills.length > 0) {
        try {
          const quickBillsManager = require('./utils/quickBills.js')
          quickBillsManager.quickBills = cloudQuickBills
          quickBillsManager.saveQuickBills()
          console.log('[云开发] 快速记账同步成功')
        } catch (e) {
          console.warn('[云开发] 快速记账同步失败:', e.message)
        }
      }
    } catch (e) {
      console.warn('[云开发] 数据同步失败:', e.message)
    }
  },

  loadData() {
    const bills = wx.getStorageSync('bills')
    if (bills) {
      try {
        this.globalData.bills = JSON.parse(bills)
      } catch (e) {
        this.globalData.bills = []
      }
    } else {
      this.globalData.bills = []
    }
    this.loadCustomCategories()
    this.syncBudgetUsed()
  },

  loadCustomCategories() {
    const customCategories = wx.getStorageSync('customCategories')
    if (customCategories) {
      try {
        const parsed = JSON.parse(customCategories)
        if (parsed.expense && parsed.expense.length > 0) {
          this.globalData.categories.expense = [
            ...this.globalData.categories.expense,
            ...parsed.expense
          ]
        }
        if (parsed.income && parsed.income.length > 0) {
          this.globalData.categories.income = [
            ...this.globalData.categories.income,
            ...parsed.income
          ]
        }
      } catch (e) {
        console.error('加载自定义分类失败', e)
      }
    }
  },

  syncBudgetUsed() {
    const now = new Date()
    const currentMonthBills = this.globalData.bills.filter(bill => {
      const date = new Date(bill.date)
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    })

    const categoryUsed = {}
    currentMonthBills.forEach(bill => {
      if (bill.type === 'expense') {
        if (!categoryUsed[bill.category]) {
          categoryUsed[bill.category] = 0
        }
        categoryUsed[bill.category] += parseFloat(bill.amount)
      }
    })

    Object.keys(this.globalData.budget.categories).forEach(key => {
      if (this.globalData.budget.categories[key]) {
        this.globalData.budget.categories[key].used = categoryUsed[key] || 0
      }
    })
  },

  saveBills() {
    try {
      wx.setStorageSync('bills', JSON.stringify(this.globalData.bills))
    } catch (e) {
      console.error('保存账单失败:', e)
      wx.showToast({ title: '保存失败，请检查存储空间', icon: 'none' })
    }
  },

  getDataManager() {
    return dataManager
  },

  getMonthlyStats(year, month) {
    return dataManager.getMonthlyStats(year, month)
  },

  getCategoryStats(year, month) {
    return dataManager.getCategoryStats(year, month)
  },

  addBill(bill) {
    return dataManager.addBill(bill)
  },

  updateBudget(budgetData) {
    try {
      this.globalData.budget = { ...this.globalData.budget, ...budgetData }
      wx.setStorageSync('budget', JSON.stringify(this.globalData.budget))
      dataManager.saveBudgetToCloud(this.globalData.budget)
      return true
    } catch (e) {
      console.error('保存预算失败:', e)
      return false
    }
  },

  getBudget() {
    try {
      const stored = wx.getStorageSync('budget')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          return parsed
        }
      }
    } catch (e) {
      console.error('加载预算失败:', e)
    }
    return this.globalData.budget
  },

  notifyThemeChange(theme) {
    this.globalData.themeChangeListeners.forEach(callback => {
      if (typeof callback === 'function') {
        callback(theme)
      }
    })
  },

  addThemeChangeListener(callback) {
    if (typeof callback === 'function' && !this.globalData.themeChangeListeners.includes(callback)) {
      this.globalData.themeChangeListeners.push(callback)
    }
  },

  removeThemeChangeListener(callback) {
    const index = this.globalData.themeChangeListeners.indexOf(callback)
    if (index > -1) {
      this.globalData.themeChangeListeners.splice(index, 1)
    }
  }
})

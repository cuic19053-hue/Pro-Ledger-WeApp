class DataManager {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  init() {
    if (this.isInitialized) return
    
    try {
      if (wx.cloud) {
        this.db = wx.cloud.database()
        console.log('[DataManager] 云数据库初始化成功')
        this.isInitialized = true
      } else {
        console.warn('[DataManager] wx.cloud 不可用')
      }
    } catch (error) {
      console.error('[DataManager] 云数据库初始化失败:', error.message || error)
    }
  }

  generateBillId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6)
  }

  async addBill(billData) {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return null
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    const bill = {
      id: this.generateBillId(),
      ...billData,
      openid: openid,
      createTime: new Date(),
      date: billData.date || new Date().toISOString()
    }

    console.log('[DataManager] 准备保存账单:', { amount: bill.amount, category: bill.category, openid: openid })

    let cloudSaveSuccess = false
    try {
      this.init()

      if (this.db) {
        console.log('[DataManager] 正在尝试保存到云数据库...')
        const res = await this.db.collection('bills').add({
          data: bill
        })
        bill._id = res._id
        cloudSaveSuccess = true
        console.log('[DataManager] ✅ 账单保存到云数据库成功! ID:', res._id)
      } else {
        console.warn('[DataManager] ⚠️ 数据库未初始化，仅保存到本地')
      }
    } catch (error) {
      console.error('[DataManager] ❌ 账单保存到云数据库失败!')
      console.error('   错误类型:', error.errCode || '未知')
      console.error('   错误信息:', error.errMsg || error.message || error)

      if (error.errCode === -1) {
        console.error('[DataManager] 💡 可能原因: 网络问题或数据库权限配置不正确')
      } else if (error.errCode === -501001) {
        console.error('[DataManager] 💡 可能原因: 集合不存在或名称错误')
      } else if (error.errCode === -502005) {
        console.error('[DataManager] 💡 可能原因: 安全规则拒绝访问')
      }
    }

    if (!app.globalData.bills) {
      app.globalData.bills = []
    }
    app.globalData.bills.unshift(bill)
    this.saveBillsToLocal(app)
    this.updateBudgetUsed(app, bill)

    bill._cloudSaved = cloudSaveSuccess
    return bill
  }

  async deleteBill(billId) {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return false
    }

    if (!app.globalData.bills) {
      app.globalData.bills = []
      return false
    }

    const index = app.globalData.bills.findIndex(b =>
      b.id === billId || b._id === billId
    )

    if (index === -1) {
      console.warn('[DataManager] 未找到要删除的账单:', billId)
      return false
    }

    const deletedBill = app.globalData.bills[index]

    app.globalData.bills.splice(index, 1)
    this.saveBillsToLocal(app)
    this.recalcBudgetAfterDelete(app, deletedBill)

    let cloudDeleteSuccess = false
    try {
      this.init()

      if (this.db && deletedBill._id) {
        await this.db.collection('bills').doc(deletedBill._id).remove()
        console.log('[DataManager] ✅ 账单从云数据库删除成功')
        cloudDeleteSuccess = true
      }
    } catch (error) {
      console.warn('[DataManager] 从云数据库删除账单失败:', error)
      const pendingDeletes = wx.getStorageSync('pendingCloudDeletes') || []
      pendingDeletes.push({ billId, cloudId: deletedBill._id, deletedAt: Date.now() })
      wx.setStorageSync('pendingCloudDeletes', pendingDeletes)
      console.log('[DataManager] 已标记待同步删除，billId:', billId)
    }

    return true
  }

  updateBudgetUsed(app, bill) {
    if (bill.type === 'expense') {
      const categoryKey = bill.category
      const amount = parseFloat(bill.amount)
      if (isNaN(amount) || amount <= 0) return

      if (!app.globalData.budget.categories[categoryKey]) {
        app.globalData.budget.categories[categoryKey] = { limit: 0, used: 0 }
      }
      app.globalData.budget.categories[categoryKey].used = Math.max(
        0,
        (app.globalData.budget.categories[categoryKey].used || 0) + amount
      )
    }
  }

  recalcBudgetAfterDelete(app, deletedBill) {
    if (deletedBill.type === 'expense') {
      const categoryKey = deletedBill.category
      if (app.globalData.budget.categories[categoryKey]) {
        const amount = parseFloat(deletedBill.amount)
        if (isNaN(amount)) return
        
        const currentValue = app.globalData.budget.categories[categoryKey]
        if (typeof currentValue === 'number') {
          app.globalData.budget.categories[categoryKey] = Math.max(0, currentValue - amount)
        } else if (typeof currentValue === 'object' && currentValue !== null) {
          app.globalData.budget.categories[categoryKey].used = Math.max(
            0,
            (currentValue.used || 0) - amount
          )
        }
      }
    }
  }

  getBills(options = {}) {
    const app = getApp()
    if (!app || !app.globalData.bills) {
      return []
    }
    
    const { type, month, limit, offset } = options
    let bills = [...app.globalData.bills]

    if (type) {
      bills = bills.filter(bill => bill.type === type)
    }

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      bills = bills.filter(bill => {
        const billDate = new Date(bill.date)
        return billDate.getFullYear() === year && billDate.getMonth() === monthNum - 1
      })
    }

    bills.sort((a, b) => new Date(b.date) - new Date(a.date))

    if (limit) {
      const start = offset || 0
      bills = bills.slice(start, start + limit)
    }

    return bills
  }

  getBillsByMonth(year, month) {
    return this.getBills({ month: `${year}-${month.toString().padStart(2, '0')}` })
  }

  getMonthlyStats(year, month) {
    const app = getApp()
    if (!app || !app.globalData.bills) {
      return {
        income: 0,
        expense: 0,
        balance: 0
      }
    }
    
    const bills = app.globalData.bills.filter(bill => {
      const date = new Date(bill.date)
      return date.getFullYear() === year && date.getMonth() === month
    })

    let income = 0
    let expense = 0

    bills.forEach(bill => {
      if (bill.type === 'income') {
        income += parseFloat(bill.amount)
      } else {
        expense += parseFloat(bill.amount)
      }
    })

    return {
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      balance: parseFloat((income - expense).toFixed(2))
    }
  }

  getCategoryStats(year, month) {
    const app = getApp()
    if (!app || !app.globalData.bills) {
      return {}
    }
    
    const bills = app.globalData.bills.filter(bill => {
      const date = new Date(bill.date)
      return date.getFullYear() === year && date.getMonth() === month
    })

    const stats = {}
    bills.forEach(bill => {
      if (bill.type === 'expense') {
        if (!stats[bill.category]) {
          stats[bill.category] = { amount: 0, count: 0 }
        }
        stats[bill.category].amount += parseFloat(bill.amount)
        stats[bill.category].count += 1
      }
    })

    return stats
  }

  saveUserInfo(userInfo) {
    const app = getApp()
    if (app) {
      app.globalData.userInfo = userInfo
    }
    this.safeSetStorage('userInfo', userInfo)
  }

  getUserInfo() {
    return this.safeGetStorage('userInfo') || null
  }

  saveBillsToLocal(app) {
    if (app && app.globalData && app.globalData.bills) {
      this.safeSetStorage('bills', JSON.stringify(app.globalData.bills))
    }
  }

  loadBillsFromLocal() {
    const bills = this.safeGetStorage('bills')
    if (bills) {
      try {
        return JSON.parse(bills)
      } catch (e) {
        console.error('解析本地账单失败:', e)
      }
    }
    return []
  }

  async loadBillsFromCloud() {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return this.loadBillsFromLocal()
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    this.init()
    
    if (!openid || !this.db) {
      console.log('[DataManager] 无法从云端加载: openid=', openid, ', db=', !!this.db)
      return this.loadBillsFromLocal()
    }

    try {
      console.log('[DataManager] 正在从云数据库加载账单... openid:', openid)
      const MAX_LIMIT = 20
      let allData = []
      let page = 0

      while (true) {
        const res = await this.db.collection('bills')
          .where({ openid: openid })
          .orderBy('date', 'desc')
          .skip(page * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get()

        allData = allData.concat(res.data)
        if (res.data.length < MAX_LIMIT) break
        page++
      }

      if (allData.length > 0) {
        app.globalData.bills = allData
        this.saveBillsToLocal(app)
        console.log('[DataManager] ✅ 从云数据库加载账单成功，共', allData.length, '条')
        return allData
      } else {
        console.log('[DataManager] 云数据库中无数据')
      }
    } catch (error) {
      console.warn('[DataManager] ❌ 从云数据库加载账单失败:', error)
    }

    return this.loadBillsFromLocal()
  }

  async saveUserInfoToCloud(userInfo) {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      this.safeSetStorage('userInfo', userInfo)
      return
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    this.init()
    
    try {
      if (openid && this.db) {
        try {
          await this.db.collection('users').doc(openid).update({
            data: {
              ...userInfo,
              lastLoginAt: new Date()
            }
          })
        } catch (updateError) {
          if (updateError.errMsg && updateError.errMsg.includes('document not exists')) {
            await this.db.collection('users').add({
              data: {
                _id: openid,
                ...userInfo,
                openid: openid,
                lastLoginAt: new Date()
              }
            })
          } else {
            throw updateError
          }
        }
        console.log('[DataManager] ✅ 用户信息保存到云数据库成功')
      }
    } catch (error) {
      console.warn('[DataManager] 用户信息保存到云数据库失败:', error)
    }

    app.globalData.userInfo = userInfo
    this.safeSetStorage('userInfo', userInfo)
  }

  async getUserInfoFromCloud() {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return this.safeGetStorage('userInfo') || null
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    this.init()
    
    try {
      if (openid && this.db) {
        const res = await this.db.collection('users').doc(openid).get()
        if (res.data) {
          app.globalData.userInfo = res.data
          this.safeSetStorage('userInfo', res.data)
          return res.data
        }
      }
    } catch (error) {
      console.warn('[DataManager] 获取用户信息失败:', error)
    }

    return this.safeGetStorage('userInfo') || null
  }

  clearAllData() {
    const app = getApp()
    if (app) {
      app.globalData.bills = []
      app.globalData.userInfo = null
    }
    wx.clearStorageSync()
  }

  safeSetStorage(key, value) {
    try {
      wx.setStorageSync(key, value)
      return true
    } catch (error) {
      console.error(`存储 ${key} 失败:`, error)
      if (error.name === 'QuotaExceededError') {
        wx.showToast({
          title: '存储空间不足，请清理数据',
          icon: 'none',
          duration: 3000
        })
      }
      return false
    }
  }

  safeGetStorage(key) {
    try {
      return wx.getStorageSync(key)
    } catch (error) {
      console.error(`读取 ${key} 失败:`, error)
      return null
    }
  }

  async saveCustomCategoriesToCloud(customCategories) {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      this.safeSetStorage('customCategories', customCategories)
      return false
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    if (!openid) {
      console.warn('[DataManager] 无法保存自定义分类：缺少openid')
      return false
    }

    this.init()
    
    try {
      if (this.db) {
        await this._mergeUserSettings(openid, { customCategories: customCategories })
        console.log('[DataManager] ✅ 自定义分类保存到云端成功')
        return true
      }
    } catch (error) {
      console.warn('[DataManager] 自定义分类保存到云端失败:', error)
      // 集合不存在时，只保存到本地
      if (error.errCode === -502005) {
        console.warn('[DataManager] 集合不存在，仅保存到本地')
      }
    }

    this.safeSetStorage('customCategories', customCategories)
    return false
  }

  async loadCustomCategoriesFromCloud() {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return this.safeGetStorage('customCategories') || null
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    this.init()
    
    if (!openid || !this.db) {
      return this.safeGetStorage('customCategories') || null
    }

    try {
      const res = await this.db.collection('user_settings').doc(openid).get()
      if (res.data && res.data.customCategories) {
        console.log('[DataManager] ✅ 从云端加载自定义分类成功')
        this.safeSetStorage('customCategories', res.data.customCategories)
        return res.data.customCategories
      }
    } catch (error) {
      console.warn('[DataManager] 从云端加载自定义分类失败:', error)
    }

    return this.safeGetStorage('customCategories') || null
  }

  async saveBudgetToCloud(budget) {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return false
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    if (!openid) {
      console.warn('[DataManager] 无法保存预算：缺少openid')
      return false
    }

    this.init()
    
    try {
      if (this.db) {
        await this._mergeUserSettings(openid, { budget: budget })
        console.log('[DataManager] ✅ 预算保存到云端成功')
        return true
      }
    } catch (error) {
      console.warn('[DataManager] 预算保存到云端失败:', error)
      // 集合不存在时，只保存到本地
      if (error.errCode === -502005) {
        console.warn('[DataManager] 集合不存在，仅保存到本地')
      }
    }

    return false
  }

  async loadBudgetFromCloud() {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return null
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    this.init()
    
    if (!openid || !this.db) {
      return null
    }

    try {
      const res = await this.db.collection('user_settings').doc(openid).get()
      if (res.data && res.data.budget) {
        console.log('[DataManager] ✅ 从云端加载预算成功')
        return res.data.budget
      }
    } catch (error) {
      console.warn('[DataManager] 从云端加载预算失败:', error)
      // 集合不存在时，返回本地存储的预算
      if (error.errCode === -502005) {
        console.warn('[DataManager] 集合不存在，使用本地预算')
        try {
          const localBudget = wx.getStorageSync('budget')
          if (localBudget) {
            return JSON.parse(localBudget)
          }
        } catch (e) {
          console.error('解析本地预算失败:', e)
        }
      }
    }

    return null
  }

  async saveQuickBillsToCloud(quickBills) {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return false
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    if (!openid) {
      console.warn('[DataManager] 无法保存快速记账：缺少openid')
      return false
    }

    this.init()
    
    try {
      if (this.db) {
        await this._mergeUserSettings(openid, { quickBills: quickBills })
        console.log('[DataManager] ✅ 快速记账保存到云端成功')
        return true
      }
    } catch (error) {
      console.warn('[DataManager] 快速记账保存到云端失败:', error)
      // 集合不存在时，只保存到本地
      if (error.errCode === -502005) {
        console.warn('[DataManager] 集合不存在，仅保存到本地')
      }
    }

    return false
  }

  async loadQuickBillsFromCloud() {
    const app = getApp()
    if (!app) {
      console.error('[DataManager] ❌ getApp() 返回 undefined')
      return null
    }
    
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    this.init()
    
    if (!openid || !this.db) {
      return null
    }

    try {
      const res = await this.db.collection('user_settings').doc(openid).get()
      if (res.data && res.data.quickBills) {
        console.log('[DataManager] ✅ 从云端加载快速记账成功')
        return res.data.quickBills
      }
    } catch (error) {
      console.warn('[DataManager] 从云端加载快速记账失败:', error)
      // 集合不存在时，返回本地存储的快速记账
      if (error.errCode === -502005) {
        console.warn('[DataManager] 集合不存在，使用本地快速记账')
        try {
          const localQuickBills = wx.getStorageSync('quickBills')
          if (localQuickBills) {
            return JSON.parse(localQuickBills)
          }
        } catch (e) {
          console.error('解析本地快速记账失败:', e)
        }
      }
    }

    return null
  }

  async clearCloudData(openid) {
    if (!openid) {
      console.warn('[DataManager] 无法清除云端数据：缺少openid')
      return
    }

    this.init()

    try {
      if (this.db) {
        const batchDelete = async (collectionName) => {
          try {
            const res = await this.db.collection(collectionName).where({ openid: openid }).remove()
            console.log(`[DataManager] ✅ ${collectionName} 数据已清除`)
            return res
          } catch (error) {
            console.warn(`[DataManager] 清除 ${collectionName} 失败:`, error)
            return null
          }
        }

        await batchDelete('bills')
        await batchDelete('users')
        await batchDelete('user_settings')
        console.log('[DataManager] ✅ 云端数据已清除')
      }
    } catch (error) {
      console.warn('[DataManager] 清除云端数据失败:', error)
    }
  }

  updateBudget() {
    const app = getApp()
    const bills = this.getBills()
    
    // 重置预算使用情况
    app.globalData.budget.categories = {}
    
    // 计算各分类支出
    bills.forEach(bill => {
      if (bill.type === 'expense') {
        if (!app.globalData.budget.categories[bill.category]) {
          app.globalData.budget.categories[bill.category] = 0
        }
        app.globalData.budget.categories[bill.category] += bill.amount
      }
    })
    
    console.log('[DataManager] 预算更新完成:', app.globalData.budget)
  }

  async _mergeUserSettings(openid, dataToMerge) {
    if (!this.db || !openid) return

    try {
      await this.db.collection('user_settings').doc(openid).update({
        data: {
          ...dataToMerge,
          updateTime: new Date()
        }
      })
    } catch (error) {
      if (error.errMsg && error.errMsg.includes('document not exists')) {
        await this.db.collection('user_settings').add({
          data: {
            _id: openid,
            ...dataToMerge,
            createTime: new Date(),
            updateTime: new Date()
          }
        })
      } else {
        throw error
      }
    }
  }
}

const dataManager = new DataManager()

module.exports = dataManager

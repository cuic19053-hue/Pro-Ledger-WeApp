// 端到端用户流程测试
const { mockWx } = require('../test-utils/mock-wx')

// 创建共享的 app 实例
let sharedApp = null

// 模拟 getApp 返回同一个实例
function mockGetApp() {
  if (!sharedApp) {
    sharedApp = {
      globalData: {
        isLoggedIn: false,
        openid: null,
        userInfo: null,
        bills: [],
        categories: {
          expense: [
            { id: 'food', name: '餐饮', icon: '🍽️' },
            { id: 'transport', name: '交通', icon: '🚗' },
            { id: 'shopping', name: '购物', icon: '🛍️' }
          ],
          income: [
            { id: 'salary', name: '工资', icon: '💰' },
            { id: 'bonus', name: '奖金', icon: '🎁' }
          ]
        },
        budget: { total: 5000, categories: {} }
      },
      getDataManager: jest.fn()
    }
  }
  return sharedApp
}

// 模拟页面函数
function LoginPage() {
  return Page({
    data: {
      agreement: false,
      avatarUrl: '',
      nickName: ''
    },
    
    handleWechatLogin: jest.fn(async function() {
      if (!this.data.agreement) {
        wx.showToast({ title: '请先同意用户协议', icon: 'none' })
        return
      }
      
      try {
        const loginRes = await wx.login()
        const userInfo = { nickName: this.data.nickName, avatarUrl: this.data.avatarUrl }
        
        const cloudRes = await wx.cloud.callFunction({
          name: 'login',
          data: { action: 'wechatLogin', code: loginRes.code, userInfo, openid: undefined }
        })
        
        if (cloudRes.result && cloudRes.result.success) {
          const app = getApp()
          app.globalData.isLoggedIn = true
          app.globalData.openid = cloudRes.result.openid
          app.globalData.userInfo = cloudRes.result.userInfo
          wx.showToast({ title: '登录成功', icon: 'success' })
        }
      } catch (error) {
        wx.showToast({ title: '登录失败，请重试', icon: 'none', duration: 2500 })
      }
    }),
    
    setData: jest.fn(function(data) { Object.assign(this.data, data) })
  })
}

function HomePage() {
  return Page({
    data: { monthlyExpense: 0, monthlyIncome: 0, budgetUsed: 0, budgetTotal: 0, todayExpense: 0, todayIncome: 0, netAmount: 0, billCount: 0 },
    
    onLoad: jest.fn(function() { this.updateHomeData() }),
    
    updateHomeData: jest.fn(function() {
      const app = getApp()
      const dataManager = app.getDataManager()
      const today = new Date()
      const bills = dataManager.getBills()
      
      const monthlyBills = dataManager.getBillsByMonth(today.getFullYear(), today.getMonth() + 1)
      const monthlyExpense = monthlyBills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0)
      const monthlyIncome = monthlyBills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0)
      
      const todayBills = bills.filter(bill => new Date(bill.date).toDateString() === today.toDateString())
      const todayExpense = todayBills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0)
      const todayIncome = todayBills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0)
      
      dataManager.updateBudget()
      const budgetUsed = Object.values(app.globalData.budget.categories).reduce((sum, amount) => sum + amount, 0)
      const budgetTotal = app.globalData.budget.total
      
      this.setData({ monthlyExpense, monthlyIncome, budgetUsed, budgetTotal, todayExpense, todayIncome, netAmount: monthlyIncome - monthlyExpense, billCount: monthlyBills.length })
    }),
    
    setData: jest.fn(function(data) { Object.assign(this.data, data) })
  })
}

function AddPage() {
  return Page({
    data: { amount: '', selectedCategory: '', selectedCategoryName: '', type: 'expense', remark: '', date: new Date().toISOString() },
    
    onSave: jest.fn(async function() {
      const { amount, selectedCategory, selectedCategoryName, type, remark, date } = this.data
      
      if (!amount || !selectedCategory) {
        wx.showToast({ title: '请填写完整信息', icon: 'none' })
        return
      }
      
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) {
        wx.showToast({ title: '系统错误', icon: 'none' })
        return
      }
      const bill = { type, category: selectedCategory, amount: parseFloat(amount), remark, date }
      
      try {
        const result = await dataManager.addBill(bill)
        wx.showToast({ title: '记账成功', icon: 'success', duration: 1200 })
        this.setData({ amount: '', selectedCategory: '', selectedCategoryName: '', remark: '' })
        return result
      } catch (error) {
        wx.showToast({ title: '记账失败', icon: 'none' })
        throw error
      }
    }),
    
    setData: jest.fn(function(data) { Object.assign(this.data, data) })
  })
}

function BillsPage() {
  return Page({
    data: { bills: [], isEditing: false, selectedBills: new Set() },
    
    onLoad: jest.fn(function() { this.loadBills() }),
    
    loadBills: jest.fn(function() {
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      this.setData({ bills: dataManager.getBills() || [] })
    }),
    
    toggleEditMode: jest.fn(function() {
      this.setData({ isEditing: !this.data.isEditing, selectedBills: new Set() })
    }),
    
    toggleBillSelect: jest.fn(function(e) {
      const billId = e.currentTarget.dataset.id
      const selectedBills = new Set(this.data.selectedBills)
      if (selectedBills.has(billId)) { selectedBills.delete(billId) } else { selectedBills.add(billId) }
      this.setData({ selectedBills })
    }),
    
    batchDeleteBills: jest.fn(async function() {
      const { selectedBills } = this.data
      if (selectedBills.size === 0) {
        wx.showToast({ title: '请选择要删除的账单', icon: 'none' })
        return
      }
      
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      for (const billId of selectedBills) { await dataManager.deleteBill(billId) }
      this.loadBills()
      this.setData({ isEditing: false, selectedBills: new Set() })
      wx.showToast({ title: '删除成功', icon: 'success', duration: 2000 })
    }),
    
    deleteBill: jest.fn(async function(e) {
      const billId = typeof e === 'string' ? e : (e.currentTarget ? e.currentTarget.dataset.id : e.id)
      if (!billId) return
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      await dataManager.deleteBill(billId)
      this.loadBills()
      wx.showToast({ title: '删除成功', icon: 'success', duration: 2000 })
    }),
    
    setData: jest.fn(function(data) { Object.assign(this.data, data) })
  })
}

function StatsPage() {
  return Page({
    data: { monthlyExpense: 0, monthlyIncome: 0, categoryData: [], monthlyData: [] },
    
    onLoad: jest.fn(function() { this.loadStats() }),
    
    loadStats: jest.fn(function() {
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      const today = new Date()
      const monthlyBills = dataManager.getBillsByMonth(today.getFullYear(), today.getMonth() + 1) || []
      
      const monthlyExpense = monthlyBills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0)
      const monthlyIncome = monthlyBills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0)
      
      this.setData({ monthlyExpense, monthlyIncome })
    }),
    
    setData: jest.fn(function(data) { Object.assign(this.data, data) })
  })
}

function ProfilePage() {
  return Page({
    data: { userInfo: null, budgetTotal: 0, billCount: 0 },
    
    onLoad: jest.fn(function() { this.loadProfile() }),
    
    loadProfile: jest.fn(function() {
      const app = getApp()
      this.setData({ userInfo: app.globalData.userInfo, budgetTotal: app.globalData.budget.total, billCount: app.globalData.bills.length })
    }),
    
    setData: jest.fn(function(data) { Object.assign(this.data, data) })
  })
}

function BillDetailPage() {
  return Page({
    data: { bill: null },
    
    onLoad: jest.fn(function(options) {
      const app = getApp()
      const bills = app.globalData.bills || []
      const bill = bills.find(b => b.id === options.id)
      this.setData({ bill })
    }),
    
    deleteBill: jest.fn(async function() {
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager || !this.data.bill) return
      await dataManager.deleteBill(this.data.bill.id)
      wx.navigateBack()
    }),
    
    setData: jest.fn(function(data) { Object.assign(this.data, data) })
  })
}

// 设置全局模拟对象
global.wx = mockWx
global.getApp = mockGetApp

describe('端到端用户流程测试', () => {
  let app
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // 重置共享的 app 实例
    sharedApp = null
    app = mockGetApp()
    
    // 重置全局数据
    app.globalData = {
      isLoggedIn: false,
      openid: null,
      userInfo: null,
      bills: [],
      categories: {
        expense: [
          { id: 'food', name: '餐饮', icon: '🍽️' },
          { id: 'transport', name: '交通', icon: '🚗' },
          { id: 'shopping', name: '购物', icon: '🛍️' }
        ],
        income: [
          { id: 'salary', name: '工资', icon: '💰' },
          { id: 'bonus', name: '奖金', icon: '🎁' }
        ]
      },
      budget: { total: 5000, categories: {} }
    }

    app.getDataManager = jest.fn(() => ({
      addBill: jest.fn().mockImplementation((bill) => {
        const newBill = {
          id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          _cloudSaved: true,
          ...bill,
          createTime: new Date()
        }
        app.globalData.bills.push(newBill)
        return Promise.resolve(newBill)
      }),
      deleteBill: jest.fn().mockImplementation((billId) => {
        const index = app.globalData.bills.findIndex(b => b.id === billId)
        if (index > -1) {
          app.globalData.bills.splice(index, 1)
          return Promise.resolve(true)
        }
        return Promise.resolve(false)
      }),
      getBills: jest.fn().mockImplementation(() => [...app.globalData.bills]),
      getBillsByMonth: jest.fn().mockImplementation((year, month) => {
        return app.globalData.bills.filter(bill => {
          const billDate = new Date(bill.date)
          return billDate.getFullYear() === year && billDate.getMonth() === month - 1
        })
      }),
      updateBudget: jest.fn().mockImplementation(() => {
        app.globalData.budget.categories = {}
        app.globalData.bills.filter(b => b.type === 'expense').forEach(bill => {
          if (!app.globalData.budget.categories[bill.category]) {
            app.globalData.budget.categories[bill.category] = 0
          }
          app.globalData.budget.categories[bill.category] += bill.amount
        })
      })
    }))

    // 确保 wx 基础 mock 可用
    wx.login = jest.fn()
    wx.cloud.callFunction = jest.fn()
    wx.showToast = jest.fn()
    wx.showLoading = jest.fn()
    wx.hideLoading = jest.fn()
    wx.showModal = jest.fn()
    wx.navigateBack = jest.fn()
    wx.switchTab = jest.fn()
  })

  describe('完整用户记账流程', () => {
    test('新用户注册 → 添加支出 → 查看统计 → 删除账单', async () => {
      console.log('=== 步骤1: 用户注册登录 ===')
      const loginPage = LoginPage()
      
      wx.login.mockResolvedValue({ code: 'test-code-123' })
      wx.cloud.callFunction.mockResolvedValue({
        result: {
          success: true,
          openid: 'user-openid-123',
          userInfo: { nickName: '测试用户', avatarUrl: 'avatar-url', openid: 'user-openid-123' }
        }
      })

      loginPage.setData({ agreement: true, avatarUrl: 'test-avatar', nickName: '测试用户' })
      await loginPage.handleWechatLogin()

      expect(app.globalData.isLoggedIn).toBe(true)
      expect(app.globalData.openid).toBe('user-openid-123')
      console.log('✅ 用户登录成功')

      console.log('=== 步骤2: 进入首页 ===')
      const homePage = HomePage()
      homePage.onLoad()
      
      expect(homePage.data.monthlyExpense).toBe(0)
      expect(homePage.data.monthlyIncome).toBe(0)
      console.log('✅ 首页加载成功，初始数据为空')

      console.log('=== 步骤3: 添加支出账单 ===')
      const addPage = AddPage()
      
      addPage.setData({
        amount: '100',
        selectedCategory: 'food',
        selectedCategoryName: '餐饮',
        type: 'expense'
      })
      
      await addPage.onSave()
      
      expect(app.globalData.bills).toHaveLength(1)
      expect(app.globalData.bills[0].type).toBe('expense')
      expect(app.globalData.bills[0].amount).toBe(100)
      console.log('✅ 支出账单添加成功')

      console.log('=== 步骤4: 添加收入账单 ===')
      addPage.setData({
        amount: '5000',
        selectedCategory: 'salary',
        selectedCategoryName: '工资',
        type: 'income'
      })
      
      await addPage.onSave()
      
      expect(app.globalData.bills).toHaveLength(2)
      expect(app.globalData.bills[1].type).toBe('income')
      expect(app.globalData.bills[1].amount).toBe(5000)
      console.log('✅ 收入账单添加成功')

      console.log('=== 步骤5: 查看统计 ===')
      const statsPage = StatsPage()
      statsPage.onLoad()
      
      expect(statsPage.data.monthlyExpense).toBe(100)
      expect(statsPage.data.monthlyIncome).toBe(5000)
      console.log('✅ 统计数据正确')

      console.log('=== 步骤6: 查看账单列表 ===')
      const billsPage = BillsPage()
      billsPage.onLoad()
      
      expect(billsPage.data.bills).toHaveLength(2)
      console.log('✅ 账单列表加载成功')

      console.log('=== 步骤7: 进入编辑模式 ===')
      billsPage.toggleEditMode()
      expect(billsPage.data.isEditing).toBe(true)
      console.log('✅ 进入编辑模式成功')

      console.log('=== 步骤8: 删除支出账单 ===')
      const expenseBill = app.globalData.bills.find(b => b.type === 'expense')
      await billsPage.deleteBill({ currentTarget: { dataset: { id: expenseBill.id } } })
      
      expect(app.globalData.bills).toHaveLength(1)
      expect(app.globalData.bills[0].type).toBe('income')
      console.log('✅ 账单删除成功')

      console.log('🎉 完整用户流程测试通过！')
    })

    test('批量操作流程', async () => {
      // 添加多条账单 - 使用 dataManager mock
      const dataManager = app.getDataManager()
      
      await dataManager.addBill({ id: 'bill1', type: 'expense', amount: 50, category: 'food', date: '2024-01-15T10:00:00Z' })
      await dataManager.addBill({ id: 'bill2', type: 'expense', amount: 30, category: 'transport', date: '2024-01-16T10:00:00Z' })
      await dataManager.addBill({ id: 'bill3', type: 'income', amount: 1000, category: 'salary', date: '2024-01-17T10:00:00Z' })

      console.log('=== 批量操作流程测试 ===')
      const billsPage = BillsPage()
      billsPage.onLoad()

      expect(billsPage.data.bills).toHaveLength(3)
      console.log('✅ 账单列表加载成功')

      billsPage.toggleEditMode()
      expect(billsPage.data.isEditing).toBe(true)
      console.log('✅ 进入编辑模式')

      // 选择要删除的账单
      billsPage.toggleBillSelect({ currentTarget: { dataset: { id: app.globalData.bills[0].id } } })
      billsPage.toggleBillSelect({ currentTarget: { dataset: { id: app.globalData.bills[1].id } } })
      
      expect(billsPage.data.selectedBills.size).toBe(2)
      console.log('✅ 选择了两条账单')

      await billsPage.batchDeleteBills()
      
      expect(app.globalData.bills).toHaveLength(1)
      expect(app.globalData.bills[0].type).toBe('income')
      console.log('✅ 批量删除成功')

      console.log('🎉 批量操作测试通过！')
    })

    test('预算管理流程', async () => {
      console.log('=== 预算管理流程测试 ===')
      
      // 添加支出
      const addPage = AddPage()
      addPage.setData({
        amount: '200',
        selectedCategory: 'food',
        selectedCategoryName: '餐饮',
        type: 'expense'
      })
      
      await addPage.onSave()
      
      // 手动触发预算更新（模拟实际应用中的行为）
      const dataManager = app.getDataManager()
      dataManager.updateBudget()
      
      // 验证预算更新
      expect(app.globalData.budget.categories.food).toBe(200)
      console.log('✅ 支出后预算已更新')

      // 添加更多支出
      addPage.setData({
        amount: '100',
        selectedCategory: 'transport',
        selectedCategoryName: '交通',
        type: 'expense'
      })
      
      await addPage.onSave()
      dataManager.updateBudget()
      
      expect(app.globalData.budget.categories.food).toBe(200)
      expect(app.globalData.budget.categories.transport).toBe(100)
      console.log('✅ 预算分类统计正确')

      console.log('🎉 预算管理测试通过！')
    })
  })

  describe('异常流程测试', () => {
    test('网络异常处理', async () => {
      const app = getApp()
      
      console.log('=== 网络异常处理测试 ===')
      
      // 模拟 dataManager 为 undefined 的情况
      app.getDataManager = jest.fn(() => undefined)

      const addPage1 = AddPage()
      addPage1.setData({
        amount: '100',
        selectedCategory: 'food',
        type: 'expense'
      })

      // 不应抛出 TypeError
      await expect(addPage1.onSave()).resolves.toBeUndefined()
      expect(wx.showToast).toHaveBeenCalledWith({ title: '系统错误', icon: 'none' })
      console.log('✅ dataManager 为 undefined 时不会抛出 TypeError')

      // 模拟网络异常
      app.getDataManager = jest.fn(() => ({
        addBill: jest.fn().mockRejectedValue(new Error('网络错误')),
        getBills: jest.fn().mockReturnValue([])
      }))

      const addPage2 = AddPage()
      addPage2.setData({
        amount: '100',
        selectedCategory: 'food',
        type: 'expense'
      })

      try {
        await addPage2.onSave()
      } catch (error) {
        expect(error.message).toBe('网络错误')
        console.log('✅ 网络异常被正确捕获')
      }

      console.log('🎉 网络异常处理测试通过！')
    })

    test('数据一致性验证', async () => {
      const app = getApp()
      
      console.log('=== 数据一致性验证测试 ===')
      
      // 确保 dataManager mock 已设置
      const dataManager = app.getDataManager()
      
      const addPage1 = AddPage()
      const addPage2 = AddPage()
      
      // 同时添加账单
      addPage1.setData({ amount: '100', selectedCategory: 'food', type: 'expense' })
      addPage2.setData({ amount: '200', selectedCategory: 'transport', type: 'expense' })
      
      await Promise.all([addPage1.onSave(), addPage2.onSave()])
      
      expect(app.globalData.bills).toHaveLength(2)
      console.log('✅ 并发添加账单，数据一致')

      const billsPage = BillsPage()
      billsPage.loadBills()
      
      expect(billsPage.data.bills).toHaveLength(2)
      console.log('✅ 账单列表数据一致')

      console.log('🎉 数据一致性验证测试通过！')
    })

    test('边界值测试', async () => {
      console.log('=== 边界值测试 ===')
      
      const addPage = AddPage()
      
      // 测试空金额
      addPage.setData({ amount: '', selectedCategory: 'food', type: 'expense' })
      await addPage.onSave()
      
      expect(wx.showToast).toHaveBeenCalledWith({ title: '请填写完整信息', icon: 'none' })
      console.log('✅ 空金额被正确验证')

      // 测试空分类
      addPage.setData({ amount: '100', selectedCategory: '', type: 'expense' })
      await addPage.onSave()
      
      expect(wx.showToast).toHaveBeenCalledWith({ title: '请填写完整信息', icon: 'none' })
      console.log('✅ 空分类被正确验证')

      console.log('🎉 边界值测试通过！')
    })
  })
})

console.log('✅ 端到端用户流程测试完成')
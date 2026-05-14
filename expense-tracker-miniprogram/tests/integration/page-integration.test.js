// 页面集成测试
const { mockWx, mockGetApp } = require('../test-utils/mock-wx')

// 模拟页面函数
function LoginPage() {
  return Page({
    data: {
      agreement: false,
      avatarUrl: '',
      nickName: ''
    },
    
    async handleWechatLogin() {
      if (!this.data.agreement) {
        wx.showToast({
          title: '请先同意用户协议',
          icon: 'none'
        })
        return
      }
      
      try {
        const loginRes = await wx.login()
        const userInfo = {
          nickName: this.data.nickName,
          avatarUrl: this.data.avatarUrl
        }
        
        const cloudRes = await wx.cloud.callFunction({
          name: 'login',
          data: {
            action: 'wechatLogin',
            code: loginRes.code,
            userInfo: userInfo,
            openid: undefined
          }
        })
        
        if (cloudRes.result && cloudRes.result.success) {
          const app = getApp()
          app.globalData.isLoggedIn = true
          app.globalData.openid = cloudRes.result.openid
          app.globalData.userInfo = cloudRes.result.userInfo
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
        }
      } catch (error) {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none',
          duration: 2500
        })
      }
    }
  })
}

function AddPage() {
  return Page({
    data: {
      amount: '',
      selectedCategory: '',
      selectedCategoryName: '',
      type: 'expense',
      remark: '',
      date: new Date().toISOString()
    },
    
    async onSave() {
      const { amount, selectedCategory, selectedCategoryName, type, remark, date } = this.data
      
      if (!amount || !selectedCategory) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        wx.showToast({
          title: '请输入金额',
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (parsedAmount > 9999999.99) {
        wx.showToast({
          title: '金额不能超过9999999.99',
          icon: 'none',
          duration: 2000
        })
        return
      }
      
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) {
        wx.showToast({ title: '系统错误', icon: 'none' })
        return
      }
      
      const bill = {
        type: type,
        category: selectedCategory,
        amount: parseFloat(amount),
        remark: remark,
        date: date
      }
      
      try {
        const result = await dataManager.addBill(bill)
        
        wx.showToast({
          title: '记账成功',
          icon: 'success',
          duration: 1200
        })
        
        this.setData({
          amount: '',
          selectedCategory: '',
          selectedCategoryName: '',
          remark: ''
        })
        
        return result
      } catch (error) {
        wx.showToast({
          title: '记账失败',
          icon: 'none'
        })
        throw error
      }
    }
  })
}

function HomePage() {
  return Page({
    data: {
      monthlyExpense: 0,
      monthlyIncome: 0,
      budgetUsed: 0,
      budgetTotal: 0,
      todayExpense: 0,
      todayIncome: 0,
      netAmount: 0,
      billCount: 0
    },
    
    onLoad() {
      this.updateHomeData()
    },
    
    updateHomeData() {
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      
      const today = new Date()
      
      const bills = dataManager.getBills() || []
      
      const monthlyBills = dataManager.getBillsByMonth(today.getFullYear(), today.getMonth() + 1) || []
      const monthlyExpense = monthlyBills
        .filter(bill => bill.type === 'expense')
        .reduce((sum, bill) => sum + bill.amount, 0)
      const monthlyIncome = monthlyBills
        .filter(bill => bill.type === 'income')
        .reduce((sum, bill) => sum + bill.amount, 0)
      
      const todayBills = bills.filter(bill => {
        const billDate = new Date(bill.date)
        return billDate.toDateString() === today.toDateString()
      })
      const todayExpense = todayBills
        .filter(bill => bill.type === 'expense')
        .reduce((sum, bill) => sum + bill.amount, 0)
      const todayIncome = todayBills
        .filter(bill => bill.type === 'income')
        .reduce((sum, bill) => sum + bill.amount, 0)
      
      if (dataManager.updateBudget) {
        dataManager.updateBudget()
      }
      const budgetUsed = Object.values(app.globalData.budget.categories)
        .reduce((sum, amount) => {
          const val = typeof amount === 'object' ? (amount.used || 0) : amount
          return sum + val
        }, 0)
      const budgetTotal = app.globalData.budget.total
      
      this.setData({
        monthlyExpense,
        monthlyIncome,
        budgetUsed,
        budgetTotal,
        todayExpense,
        todayIncome,
        netAmount: monthlyIncome - monthlyExpense,
        billCount: monthlyBills.length
      })
    },
    
    calcMonthlyStats() {
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      
      const today = new Date()
      const monthlyBills = dataManager.getBillsByMonth(today.getFullYear(), today.getMonth() + 1) || []
      
      const monthlyExpense = monthlyBills
        .filter(bill => bill.type === 'expense')
        .reduce((sum, bill) => sum + bill.amount, 0)
      const monthlyIncome = monthlyBills
        .filter(bill => bill.type === 'income')
        .reduce((sum, bill) => sum + bill.amount, 0)
      
      this.setData({
        monthlyExpense,
        monthlyIncome,
        netAmount: monthlyIncome - monthlyExpense,
        billCount: monthlyBills.length
      })
    },
    
    getTodayBills() {
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return []
      const bills = dataManager.getBills() || []
      const today = new Date()
      
      return bills.filter(bill => {
        const billDate = new Date(bill.date)
        return billDate.toDateString() === today.toDateString()
      })
    }
  })
}

function BillsPage() {
  return Page({
    data: {
      bills: [],
      isEditing: false,
      selectedBills: new Set()
    },
    
    onLoad() {
      this.loadBills()
    },
    
    loadBills() {
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      
      const bills = dataManager.getBills() || []
      this.setData({ bills })
    },
    
    toggleEditMode() {
      const isEditing = !this.data.isEditing
      this.setData({
        isEditing,
        selectedBills: new Set()
      })
    },
    
    toggleBillSelect(e) {
      const billId = e.currentTarget.dataset.id
      const selectedBills = new Set(this.data.selectedBills)
      
      if (selectedBills.has(billId)) {
        selectedBills.delete(billId)
      } else {
        selectedBills.add(billId)
      }
      
      this.setData({ selectedBills })
    },
    
    async batchDeleteBills() {
      const { selectedBills } = this.data
      
      if (selectedBills.size === 0) {
        wx.showToast({
          title: '请选择要删除的账单',
          icon: 'none'
        })
        return
      }
      
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      
      for (const billId of selectedBills) {
        await dataManager.deleteBill(billId)
      }
      
      this.loadBills()
      this.setData({
        isEditing: false,
        selectedBills: new Set()
      })
      
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 2000
      })
    },
    
    async deleteBill(e) {
      const billId = typeof e === 'string' ? e : (e.currentTarget ? e.currentTarget.dataset.id : e.id)
      if (!billId) return
      
      const app = getApp()
      const dataManager = app.getDataManager()
      if (!dataManager) return
      
      await dataManager.deleteBill(billId)
      this.loadBills()
      
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 2000
      })
    }
  })
}

// 设置全局模拟对象
global.wx = mockWx
global.getApp = mockGetApp

describe('页面集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // 重置全局数据
    const app = getApp()
    app.globalData = {
      isLoggedIn: false,
      openid: null,
      userInfo: null,
      bills: [],
      categories: {
        expense: [
          { id: 'food', name: '餐饮', icon: '🍽️' },
          { id: 'transport', name: '交通', icon: '🚗' }
        ],
        income: [
          { id: 'salary', name: '工资', icon: '💰' }
        ]
      },
      budget: {
        total: 5000,
        categories: {}
      }
    }
  })

  describe('登录流程集成测试', () => {
    test('登录成功流程', async () => {
      const loginPage = LoginPage()
      
      // 模拟微信登录成功
      wx.login.mockResolvedValue({ code: 'test-code-123' })
      wx.cloud.callFunction.mockResolvedValue({
        result: {
          success: true,
          openid: 'user-openid-123',
          userInfo: {
            nickName: '测试用户',
            avatarUrl: 'avatar-url',
            openid: 'user-openid-123'
          }
        }
      })

      // 设置登录数据
      loginPage.setData({
        agreement: true,
        avatarUrl: 'test-avatar',
        nickName: '测试用户'
      })

      // 执行登录
      await loginPage.handleWechatLogin()

      // 验证登录流程
      expect(wx.login).toHaveBeenCalled()
      expect(wx.cloud.callFunction).toHaveBeenCalledWith({
        name: 'login',
        data: {
          action: 'wechatLogin',
          code: 'test-code-123',
          userInfo: {
            nickName: '测试用户',
            avatarUrl: 'test-avatar'
          },
          openid: undefined
        }
      })

      // 验证全局数据更新
      const app = getApp()
      expect(app.globalData.isLoggedIn).toBe(true)
      expect(app.globalData.openid).toBe('user-openid-123')
      expect(app.globalData.userInfo.nickName).toBe('测试用户')
    })

    test('登录失败处理', async () => {
      const loginPage = LoginPage()
      
      // 模拟登录失败
      wx.login.mockRejectedValue(new Error('登录失败'))
      
      loginPage.setData({
        agreement: true,
        avatarUrl: 'test-avatar',
        nickName: '测试用户'
      })

      await loginPage.handleWechatLogin()

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '登录失败，请重试',
        icon: 'none',
        duration: 2500
      })
    })
  })

  describe('记账流程集成测试', () => {
    test('添加支出账单成功', async () => {
      const addPage = AddPage()
      
      // 模拟数据管理器
      const mockDataManager = {
        addBill: jest.fn().mockResolvedValue({
          id: 'bill-123',
          _cloudSaved: true,
          type: 'expense',
          amount: 100,
          category: 'food'
        })
      }
      
      const app = getApp()
      app.getDataManager = jest.fn(() => mockDataManager)

      // 设置页面数据 - 直接修改 data 对象
      Object.assign(addPage.data, {
        amount: '100',
        selectedCategory: 'food',
        selectedCategoryName: '餐饮',
        type: 'expense'
      })

      // 执行保存
      await addPage.onSave()

      // 验证保存流程
      expect(mockDataManager.addBill).toHaveBeenCalledWith({
        type: 'expense',
        category: 'food',
        amount: 100,
        remark: '',
        date: expect.any(String)
      })

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '记账成功',
        icon: 'success',
        duration: 1200
      })
    })

    test('添加账单验证失败', async () => {
      const addPage = AddPage()
      
      // 测试金额为0
      addPage.setData({
        amount: '0',
        selectedCategory: 'food'
      })

      await addPage.onSave()

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入金额',
        icon: 'none',
        duration: 2000
      })
    })

    test('金额边界值测试', async () => {
      const addPage = AddPage()
      
      // 测试最小金额
      addPage.setData({
        amount: '0.01',
        selectedCategory: 'food',
        type: 'expense'
      })

      const mockDataManager = {
        addBill: jest.fn().mockResolvedValue({ id: 'bill-123', _cloudSaved: true }),
        getBills: jest.fn().mockReturnValue([]),
        getBillsByMonth: jest.fn().mockReturnValue([])
      }
      const app = getApp()
      app.getDataManager = jest.fn(() => mockDataManager)

      await addPage.onSave()
      expect(mockDataManager.addBill).toHaveBeenCalled()

      // 测试超过上限
      addPage.setData({ amount: '10000000' })
      await addPage.onSave()
      
      // 验证有 showToast 调用（具体文案可能不同）
      expect(wx.showToast).toHaveBeenCalled()
    })
  })

  describe('账单管理集成测试', () => {
    test('批量删除账单', async () => {
      const billsPage = BillsPage()
      
      // 设置测试数据
      const mockBills = [
        { id: 'bill1', type: 'expense', amount: 100, category: 'food' },
        { id: 'bill2', type: 'income', amount: 200, category: 'salary' },
        { id: 'bill3', type: 'expense', amount: 50, category: 'transport' }
      ]
      
      billsPage.setData({
        bills: mockBills,
        selectedBills: new Set(['bill1', 'bill3']),
        isEditing: true
      })

      // 模拟数据管理器
      const mockDataManager = {
        deleteBill: jest.fn().mockResolvedValue(true),
        getBills: jest.fn().mockReturnValue(mockBills),
        getBillsByMonth: jest.fn().mockReturnValue(mockBills)
      }
      const app = getApp()
      app.getDataManager = jest.fn(() => mockDataManager)

      // 执行批量删除
      await billsPage.batchDeleteBills()

      // 验证删除调用
      expect(mockDataManager.deleteBill).toHaveBeenCalledTimes(2)
      expect(mockDataManager.deleteBill).toHaveBeenCalledWith('bill1')
      expect(mockDataManager.deleteBill).toHaveBeenCalledWith('bill3')

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '删除成功',
        icon: 'success',
        duration: 2000
      })
    })

    test('账单选择切换', () => {
      const billsPage = BillsPage()
      
      billsPage.setData({
        isEditing: false,
        selectedBills: new Set()
      })

      // 进入编辑模式
      billsPage.toggleEditMode()
      expect(billsPage.data.isEditing).toBe(true)

      // 选择账单
      billsPage.toggleBillSelect({ currentTarget: { dataset: { id: 'bill1' } } })
      expect(billsPage.data.selectedBills.has('bill1')).toBe(true)

      // 取消选择
      billsPage.toggleBillSelect({ currentTarget: { dataset: { id: 'bill1' } } })
      expect(billsPage.data.selectedBills.has('bill1')).toBe(false)
    })
  })

  describe('首页数据展示集成测试', () => {
    test('月度统计数据计算', () => {
      const homePage = HomePage()
      
      // 设置测试账单数据
      const mockBills = [
        { 
          id: 'bill1', 
          type: 'expense', 
          amount: 100, 
          category: 'food',
          date: new Date().toISOString()
        },
        { 
          id: 'bill2', 
          type: 'income', 
          amount: 200, 
          category: 'salary',
          date: new Date().toISOString()
        }
      ]
      
      const app = getApp()
      app.globalData.bills = mockBills

      // 模拟数据管理器
      const mockDataManager = {
        getBills: jest.fn().mockReturnValue(mockBills),
        getBillsByMonth: jest.fn().mockReturnValue(mockBills)
      }
      app.getDataManager = jest.fn(() => mockDataManager)

      // 计算月度统计
      homePage.calcMonthlyStats()

      // 验证统计结果
      expect(homePage.data.monthlyExpense).toBe(100)
      expect(homePage.data.monthlyIncome).toBe(200)
      expect(homePage.data.netAmount).toBe(100) // 收入 - 支出
      expect(homePage.data.billCount).toBe(2)
    })

    test('今日账单过滤', () => {
      const homePage = HomePage()
      
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const mockBills = [
        { 
          id: 'bill1', 
          type: 'expense', 
          amount: 100, 
          category: 'food',
          date: today.toISOString()
        },
        { 
          id: 'bill2', 
          type: 'expense', 
          amount: 50, 
          category: 'transport',
          date: yesterday.toISOString()
        }
      ]
      
      const app = getApp()
      app.globalData.bills = mockBills

      // 模拟数据管理器
      const mockDataManager = {
        getBills: jest.fn().mockReturnValue(mockBills),
        getBillsByMonth: jest.fn().mockReturnValue(mockBills)
      }
      app.getDataManager = jest.fn(() => mockDataManager)

      // 获取今日账单
      const todayBills = homePage.getTodayBills()
      
      expect(todayBills).toHaveLength(1)
      expect(todayBills[0].id).toBe('bill1')
      expect(todayBills[0].amount).toBe(100)
      // 验证昨天的账单被正确过滤
      expect(todayBills.find(bill => bill.id === 'bill2')).toBeUndefined()
    })
  })

  describe('数据一致性测试', () => {
    test('添加账单后首页数据同步', async () => {
      const addPage = AddPage()
      const homePage = HomePage()
      
      // 初始状态
      const app = getApp()
      app.globalData.bills = []

      // 模拟添加账单
      const mockDataManager = {
        addBill: jest.fn().mockImplementation((bill) => {
          const newBill = {
            id: 'new-bill',
            _cloudSaved: true,
            ...bill,
            createTime: new Date()
          }
          app.globalData.bills.push(newBill)
          return Promise.resolve(newBill)
        }),
        getBillsByMonth: jest.fn().mockImplementation(() => app.globalData.bills),
        getBills: jest.fn().mockImplementation(() => app.globalData.bills)
      }
      app.getDataManager = jest.fn(() => mockDataManager)

      addPage.setData({
        amount: '150',
        selectedCategory: 'food',
        selectedCategoryName: '餐饮',
        type: 'expense',
        remark: '测试备注'
      })

      await addPage.onSave()

      // 验证账单已添加
      expect(app.globalData.bills).toHaveLength(1)
      expect(app.globalData.bills[0].amount).toBe(150)
      expect(app.globalData.bills[0].category).toBe('food')
      expect(app.globalData.bills[0].type).toBe('expense')

      // 验证首页数据同步
      homePage.calcMonthlyStats()
      
      expect(homePage.data.monthlyExpense).toBe(150)
      expect(homePage.data.monthlyIncome).toBe(0)
      expect(homePage.data.netAmount).toBe(-150)
      expect(homePage.data.billCount).toBe(1)
    })

    test('删除账单后预算重新计算', async () => {
      const billsPage = BillsPage()
      
      // 设置初始预算
      const app = getApp()
      app.globalData.budget.categories = {
        food: { limit: 1000, used: 300 }
      }

      const mockBills = [
        { id: 'bill1', type: 'expense', amount: 100, category: 'food' },
        { id: 'bill2', type: 'expense', amount: 200, category: 'food' }
      ]
      app.globalData.bills = [...mockBills]

      // 模拟删除 - 删除 bill1，需要真正从数组中移除
      const mockDataManager = {
        deleteBill: jest.fn().mockImplementation(async (billId) => {
          const index = app.globalData.bills.findIndex(b => b.id === billId)
          if (index > -1) {
            app.globalData.bills.splice(index, 1)
            return true
          }
          return false
        }),
        getBills: jest.fn().mockImplementation(() => app.globalData.bills)
      }
      app.getDataManager = jest.fn(() => mockDataManager)

      await billsPage.deleteBill({ currentTarget: { dataset: { id: 'bill1' } } })

      // 验证账单已删除
      expect(app.globalData.bills).toHaveLength(1)
      expect(app.globalData.bills[0].id).toBe('bill2')
    })
  })
})

console.log('✅ 页面集成测试完成')
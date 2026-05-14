// DataManager 单元测试
const dataManager = require('../../utils/dataManager')

// 模拟全局应用实例 - 单例模式
const mockGlobalData = {
  bills: [],
  openid: 'test-openid-123',
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

const mockApp = {
  globalData: mockGlobalData,
  getDataManager: jest.fn(() => dataManager)
}

// 模拟环境
global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  cloud: {
    database: jest.fn(() => ({
      collection: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          add: jest.fn()
        })),
        doc: jest.fn(() => ({
          get: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          set: jest.fn()
        })),
        add: jest.fn(),
        get: jest.fn()
      }))
    }))
  }
}

// 必须在 setup.js 之前设置 getApp
global.getApp = jest.fn(() => mockApp)

describe('DataManager 实例测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // 重置全局数据
    mockGlobalData.bills = []
    mockGlobalData.budget.categories = {}
  })

  test('初始化测试', () => {
    expect(dataManager).toBeDefined()
    expect(dataManager.db).toBeNull()
    expect(dataManager.isInitialized).toBe(false)
  })

  test('账单ID生成', () => {
    const id1 = dataManager.generateBillId()
    const id2 = dataManager.generateBillId()
    
    // ID 应该是一个非空字符串
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
    expect(typeof id2).toBe('string')
    expect(id2.length).toBeGreaterThan(0)
    expect(id1).not.toBe(id2)
  })

  test('添加账单 - 成功', async () => {
    const mockBill = {
      type: 'expense',
      category: 'food',
      amount: 100,
      remark: '午餐'
    }

    // 模拟数据库成功
    const mockDb = {
      collection: jest.fn(() => ({
        add: jest.fn().mockResolvedValue({ _id: 'cloud-id-123' })
      }))
    }
    dataManager.db = mockDb

    const result = await dataManager.addBill(mockBill)

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('type', 'expense')
    expect(result.amount).toBe(100)
    expect(mockGlobalData.bills.length).toBeGreaterThan(0)
  })

  test('添加账单 - 数据库失败（本地保存）', async () => {
    const mockBill = {
      type: 'expense',
      category: 'food',
      amount: 100
    }

    // 模拟数据库失败
    const mockDb = {
      collection: jest.fn(() => ({
        add: jest.fn().mockRejectedValue(new Error('网络错误'))
      }))
    }
    dataManager.db = mockDb

    const result = await dataManager.addBill(mockBill)

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('type', 'expense')
    expect(result.amount).toBe(100)
    expect(mockGlobalData.bills.length).toBeGreaterThan(0)
  })

  test('获取账单列表', () => {
    const bills = [
      { id: 'bill1', type: 'expense', amount: 100, date: '2024-01-15T10:00:00Z' },
      { id: 'bill2', type: 'income', amount: 200, date: '2024-01-20T10:00:00Z' }
    ]
    
    mockGlobalData.bills = bills

    const result = dataManager.getBills()
    
    expect(result).toHaveLength(2)
    // 验证账单列表按时间倒序排列
    expect(result[0].id).toBe('bill2')
    expect(result[1].id).toBe('bill1')
  })

  test('按月份获取账单', () => {
    const bills = [
      { id: 'bill1', type: 'expense', amount: 100, date: '2024-01-15T10:00:00Z' },
      { id: 'bill2', type: 'income', amount: 200, date: '2024-01-20T10:00:00Z' },
      { id: 'bill3', type: 'expense', amount: 50, date: '2023-12-25T10:00:00Z' }
    ]
    
    mockGlobalData.bills = bills

    const januaryBills = dataManager.getBillsByMonth(2024, 1)
    
    expect(januaryBills).toHaveLength(2)
    expect(januaryBills.find(b => b.id === 'bill1')).toBeDefined()
    expect(januaryBills.find(b => b.id === 'bill2')).toBeDefined()
  })

  test('删除账单 - 成功', async () => {
    const bills = [
      { id: 'bill1', _id: 'cloud-bill1', type: 'expense', amount: 100, date: '2024-01-15T10:00:00Z' },
      { id: 'bill2', _id: 'cloud-bill2', type: 'income', amount: 200, date: '2024-01-20T10:00:00Z' }
    ]
    
    mockGlobalData.bills = bills

    // 模拟数据库成功
    const mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          remove: jest.fn().mockResolvedValue({})
        }))
      }))
    }
    dataManager.db = mockDb

    const result = await dataManager.deleteBill('bill1')
    expect(result).toBe(true)
    expect(mockGlobalData.bills).toHaveLength(1)
    expect(mockGlobalData.bills[0].id).toBe('bill2')
  })

  test('删除账单 - 账单不存在', async () => {
    const bills = [
      { id: 'bill1', type: 'expense', amount: 100, date: '2024-01-15T10:00:00Z' }
    ]
    
    mockGlobalData.bills = bills

    const result = await dataManager.deleteBill('nonexistent')
    expect(result).toBe(false)
    expect(mockGlobalData.bills).toHaveLength(1)
  })

  test('预算更新逻辑', () => {
    // 设置初始预算
    mockGlobalData.budget.total = 5000
    mockGlobalData.budget.categories = {}
    
    // 添加一些支出账单
    const bills = [
      { id: 'bill1', type: 'expense', amount: 100, category: 'food', date: '2024-01-15T10:00:00Z' },
      { id: 'bill2', type: 'expense', amount: 200, category: 'transport', date: '2024-01-16T10:00:00Z' },
      { id: 'bill3', type: 'income', amount: 300, category: 'salary', date: '2024-01-17T10:00:00Z' }
    ]
    mockGlobalData.bills = bills

    // 更新预算 - 调用 updateBudgetUsed 方法
    bills.forEach(bill => {
      dataManager.updateBudgetUsed(mockApp, bill)
    })
    
    expect(mockGlobalData.budget.total).toBe(5000)
    expect(mockGlobalData.budget.categories.food.used).toBe(100)
    expect(mockGlobalData.budget.categories.transport.used).toBe(200)
  })

  test('删除账单后重新计算预算', async () => {
    const bills = [
      { id: 'bill1', type: 'expense', amount: 100, category: 'food', date: '2024-01-15T10:00:00Z' },
      { id: 'bill2', type: 'expense', amount: 200, category: 'transport', date: '2024-01-16T10:00:00Z' }
    ]
    
    mockGlobalData.bills = bills
    mockGlobalData.budget.categories = { 
      food: { limit: 1000, used: 100 }, 
      transport: { limit: 2000, used: 200 } 
    }

    // 模拟数据库成功
    const mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          remove: jest.fn().mockResolvedValue({})
        }))
      }))
    }
    dataManager.db = mockDb

    await dataManager.deleteBill('bill1')
    
    // 验证预算已重新计算
    expect(mockGlobalData.budget.categories.food.used).toBe(0)
    expect(mockGlobalData.budget.categories.transport.used).toBe(200)
  })
})

console.log('✅ DataManager 单元测试完成')
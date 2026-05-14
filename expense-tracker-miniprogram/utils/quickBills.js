const QUICK_BILLS_KEY = 'quick_bills'

function createDefaultUsage(bill) {
  return {
    id: 'usage_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
    name: '默认',
    amount: bill.defaultAmount,
    remark: ''
  }
}

function migrateBill(bill) {
  if (!bill.usages || !Array.isArray(bill.usages) || bill.usages.length === 0) {
    const defaultUsage = createDefaultUsage(bill)
    return {
      ...bill,
      usages: [defaultUsage],
      defaultUsageId: defaultUsage.id
    }
  }
  return bill
}

const defaultQuickBills = [
  { 
    id: 'breakfast', 
    name: '早餐', 
    category: 'food', 
    type: 'expense', 
    icon: '🍞', 
    defaultAmount: 8,
    usages: [
      { id: 'breakfast_1', name: '包子', amount: 8, remark: '包子早餐' },
      { id: 'breakfast_2', name: '豆浆油条', amount: 10, remark: '豆浆油条早餐' },
      { id: 'breakfast_3', name: '面包牛奶', amount: 12, remark: '面包牛奶早餐' }
    ],
    defaultUsageId: 'breakfast_1'
  },
  { 
    id: 'lunch', 
    name: '午餐', 
    category: 'food', 
    type: 'expense', 
    icon: '🍜', 
    defaultAmount: 15,
    usages: [
      { id: 'lunch_1', name: '食堂套餐', amount: 15, remark: '食堂午餐' },
      { id: 'lunch_2', name: '外卖', amount: 20, remark: '外卖午餐' },
      { id: 'lunch_3', name: '快餐', amount: 18, remark: '快餐午餐' }
    ],
    defaultUsageId: 'lunch_1'
  },
  { 
    id: 'dinner', 
    name: '晚餐', 
    category: 'food', 
    type: 'expense', 
    icon: '🍱', 
    defaultAmount: 18,
    usages: [
      { id: 'dinner_1', name: '食堂晚餐', amount: 18, remark: '食堂晚餐' },
      { id: 'dinner_2', name: '聚餐', amount: 50, remark: '聚餐晚餐' },
      { id: 'dinner_3', name: '夜宵', amount: 25, remark: '夜宵' }
    ],
    defaultUsageId: 'dinner_1'
  },
  { 
    id: 'subway', 
    name: '地铁', 
    category: 'transport', 
    type: 'expense', 
    icon: '🚇', 
    defaultAmount: 4,
    usages: [
      { id: 'subway_1', name: '上班', amount: 4, remark: '地铁上班' },
      { id: 'subway_2', name: '下班', amount: 4, remark: '地铁下班' },
      { id: 'subway_3', name: '出行', amount: 6, remark: '地铁出行' }
    ],
    defaultUsageId: 'subway_1'
  },
  { 
    id: 'bus', 
    name: '公交', 
    category: 'transport', 
    type: 'expense', 
    icon: '🚌', 
    defaultAmount: 2,
    usages: [
      { id: 'bus_1', name: '日常', amount: 2, remark: '公交日常' }
    ],
    defaultUsageId: 'bus_1'
  },
  { 
    id: 'snack', 
    name: '零食', 
    category: 'shopping', 
    type: 'expense', 
    icon: '🍿', 
    defaultAmount: 10,
    usages: [
      { id: 'snack_1', name: '薯片', amount: 10, remark: '薯片零食' },
      { id: 'snack_2', name: '饮料', amount: 6, remark: '饮料' },
      { id: 'snack_3', name: '水果', amount: 15, remark: '水果' }
    ],
    defaultUsageId: 'snack_1'
  },
  { 
    id: 'parttime', 
    name: '兼职', 
    category: 'parttime', 
    type: 'income', 
    icon: '💰', 
    defaultAmount: 100,
    usages: [
      { id: 'parttime_1', name: '日结', amount: 100, remark: '兼职日结' },
      { id: 'parttime_2', name: '周结', amount: 500, remark: '兼职周结' }
    ],
    defaultUsageId: 'parttime_1'
  },
  { 
    id: 'bonus', 
    name: '红包', 
    category: 'other', 
    type: 'income', 
    icon: '🧧', 
    defaultAmount: 50,
    usages: [
      { id: 'bonus_1', name: '微信红包', amount: 50, remark: '微信红包' },
      { id: 'bonus_2', name: '支付宝红包', amount: 30, remark: '支付宝红包' }
    ],
    defaultUsageId: 'bonus_1'
  },
  { 
    id: 'study', 
    name: '学习', 
    category: 'study', 
    type: 'expense', 
    icon: '📚', 
    defaultAmount: 30,
    usages: [
      { id: 'study_1', name: '书籍', amount: 30, remark: '购书' },
      { id: 'study_2', name: '打印', amount: 10, remark: '打印资料' },
      { id: 'study_3', name: '文具', amount: 20, remark: '买文具' }
    ],
    defaultUsageId: 'study_1'
  }
]

class QuickBillsManager {
  constructor() {
    this.quickBills = this.loadQuickBills()
  }

  loadQuickBills() {
    try {
      const stored = wx.getStorageSync(QUICK_BILLS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(bill => migrateBill(bill))
        }
      }
    } catch (e) {
      console.error('加载常用账单失败:', e)
    }
    return [...defaultQuickBills]
  }

  saveQuickBills() {
    try {
      wx.setStorageSync(QUICK_BILLS_KEY, JSON.stringify(this.quickBills))
      const app = getApp()
      if (app && app.globalData && app.globalData.openid) {
        const dataManager = app.getDataManager()
        if (dataManager && dataManager.saveQuickBillsToCloud) {
          dataManager.saveQuickBillsToCloud(this.quickBills)
        }
      }
    } catch (e) {
      console.error('保存常用账单失败:', e)
    }
  }

  getAll() {
    return [...this.quickBills]
  }

  getById(id) {
    return this.quickBills.find(b => b.id === id) || null
  }

  add(bill) {
    const billWithUsages = migrateBill(bill)
    const newBill = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      ...billWithUsages
    }
    this.quickBills.push(newBill)
    this.saveQuickBills()
    return newBill
  }

  update(id, updates) {
    const index = this.quickBills.findIndex(b => b.id === id)
    if (index > -1) {
      this.quickBills[index] = { ...this.quickBills[index], ...updates }
      this.saveQuickBills()
      return this.quickBills[index]
    }
    return null
  }

  delete(id) {
    this.quickBills = this.quickBills.filter(b => b.id !== id)
    this.saveQuickBills()
  }

  resetToDefault() {
    this.quickBills = [...defaultQuickBills]
    this.saveQuickBills()
  }

  addUsage(billId, usage) {
    const bill = this.getById(billId)
    if (!bill) return null

    const maxUsages = 20
    if (bill.usages && bill.usages.length >= maxUsages) {
      console.error('用途数量已达上限')
      return null
    }

    const newUsage = {
      id: 'usage_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      ...usage
    }

    bill.usages.push(newUsage)
    this.saveQuickBills()
    return newUsage
  }

  updateUsage(billId, usageId, updates) {
    const bill = this.getById(billId)
    if (!bill || !bill.usages) return null

    const usageIndex = bill.usages.findIndex(u => u.id === usageId)
    if (usageIndex === -1) return null

    bill.usages[usageIndex] = { ...bill.usages[usageIndex], ...updates }
    this.saveQuickBills()
    return bill.usages[usageIndex]
  }

  deleteUsage(billId, usageId) {
    const bill = this.getById(billId)
    if (!bill || !bill.usages) return false

    const initialLength = bill.usages.length
    bill.usages = bill.usages.filter(u => u.id !== usageId)

    if (bill.usages.length === 0) {
      const defaultUsage = createDefaultUsage(bill)
      bill.usages.push(defaultUsage)
      bill.defaultUsageId = defaultUsage.id
    } else if (bill.defaultUsageId === usageId) {
      bill.defaultUsageId = bill.usages[0].id
    }

    this.saveQuickBills()
    return bill.usages.length < initialLength
  }

  setDefaultUsage(billId, usageId) {
    const bill = this.getById(billId)
    if (!bill || !bill.usages) return false

    const usageExists = bill.usages.some(u => u.id === usageId)
    if (!usageExists) return false

    bill.defaultUsageId = usageId
    this.saveQuickBills()
    return true
  }

  getUsage(billId, usageId) {
    const bill = this.getById(billId)
    if (!bill || !bill.usages) return null

    return bill.usages.find(u => u.id === usageId) || null
  }

  getUsages(billId) {
    const bill = this.getById(billId)
    if (!bill || !bill.usages) return []

    return [...bill.usages]
  }

  getDefaultUsage(billId) {
    const bill = this.getById(billId)
    if (!bill || !bill.usages || !bill.defaultUsageId) return null

    return this.getUsage(billId, bill.defaultUsageId)
  }

  hasMultipleUsages(billId) {
    const bill = this.getById(billId)
    if (!bill || !bill.usages) return false

    return bill.usages.length > 1
  }
}

const quickBillsManager = new QuickBillsManager()

module.exports = quickBillsManager

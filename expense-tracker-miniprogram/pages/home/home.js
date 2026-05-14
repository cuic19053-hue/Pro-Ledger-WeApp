const app = getApp()
const quickBillsManager = require('../../utils/quickBills.js')

Page({
  data: {
    monthlyExpense: 0,
    monthlyIncome: 0,
    netAmount: 0,
    billCount: 0,
    budget: 0,
    budgetPercentage: 0,
    remainBudget: '0.00',
    currentMonth: '',
    displayExpense: '0.00',
    monthlyIncomeDisplay: '',
    netAmountDisplay: '',
    recentBills: [],
    quickBills: [],
    showUsageDrawer: false,
    currentQuickBill: {},
    currentUsages: []
  },

  onLoad() {
    const now = new Date()
    const month = now.getMonth() + 1
    this.setData({ currentMonth: month + '月' })
    this.loadData()
  },

  onShow() {
    this.loadData()
    this.loadQuickBills()
  },

  onPullDownRefresh() {
    this.loadData()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 600)
  },

  loadData() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const stats = app.getMonthlyStats(year, month)
    const budget = app.getBudget()

    const monthlyExpense = stats.expense || 0
    const monthlyIncome = stats.income || 0
    const netAmount = monthlyIncome - monthlyExpense

    let budgetPercentage = 0
    let remainBudget = '0.00'
    if (budget && budget.total > 0) {
      budgetPercentage = Math.min(100, Math.round((monthlyExpense / budget.total) * 100))
      const remain = Math.max(0, budget.total - monthlyExpense)
      remainBudget = remain.toFixed(2)
    }

    const dataManager = app.getDataManager()
    const allBills = dataManager.getBills()

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayBills = allBills.filter(bill => {
      const d = new Date(bill.date)
      return d >= todayStart
    }).slice(0, 5)

    const recentBills = todayBills.map(bill => {
      const date = new Date(bill.date)
      const categoryInfo = this.getCategoryInfo(bill.category, bill.type)
      const amount = parseFloat(bill.amount) || 0

      return {
        id: bill.id,
        category: bill.category,
        categoryName: categoryInfo.name,
        amount: amount,
        amountDisplay: (bill.type === 'income' ? '+' : '-') + '¥' + amount.toFixed(2),
        time: this.formatTime(date),
        icon: categoryInfo.icon,
        type: bill.type
      }
    })

    const monthBills = dataManager.getBillsByMonth(year, month)
    const billCount = monthBills.length

    this.setData({
      monthlyExpense: monthlyExpense,
      monthlyIncome: monthlyIncome,
      monthlyIncomeDisplay: '+¥' + monthlyIncome.toFixed(2),
      netAmount: netAmount,
      netAmountDisplay: (netAmount >= 0 ? '¥' : '-¥') + Math.abs(netAmount).toFixed(2),
      billCount: billCount,
      budget: budget?.total || 0,
      budgetPercentage,
      remainBudget,
      recentBills
    })

    this.setData({ displayExpense: monthlyExpense.toFixed(2) })
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const billDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (billDate.getTime() === today.getTime()) {
      return `今天 ${hours}:${minutes}`
    } else if (billDate.getTime() === yesterday.getTime()) {
      return `昨天 ${hours}:${minutes}`
    } else {
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${month}-${day} ${hours}:${minutes}`
    }
  },

  getCategoryInfo(categoryId, type) {
    const categories = type === 'expense'
      ? app.globalData.categories.expense
      : app.globalData.categories.income

    const category = categories.find(c => c.id === categoryId)
    return category || { name: categoryId, icon: '📝' }
  },

  goToBills() {
    wx.switchTab({ url: '/pages/bills/bills' })
  },

  goToDetail(e) {
    wx.vibrateShort({ type: 'light' })
    const bill = e.currentTarget.dataset.bill
    wx.navigateTo({
      url: `/pages/bill-detail/bill-detail?id=${bill.id}`
    })
  },

  navToAdd() {
    wx.vibrateShort({ type: 'light' })
    wx.switchTab({ url: '/pages/add/add' })
  },

  /**
   * 加载常用账单列表
   * 为每个账单计算显示金额（默认用途的金额）
   */
  loadQuickBills() {
    const bills = quickBillsManager.getAll()
    const quickBills = bills.map(bill => {
      const defaultUsage = quickBillsManager.getDefaultUsage(bill.id)
      return {
        ...bill,
        displayAmount: defaultUsage ? defaultUsage.amount : bill.defaultAmount
      }
    })
    this.setData({ quickBills })
  },

  /**
   * 点击常用账单卡片
   * - 多个用途：弹出用途选择抽屉
   * - 单个用途：直接记账
   * @param {Object} e - 事件对象，包含 dataset.bill
   */
  onQuickBillTap(e) {
    wx.vibrateShort({ type: 'light' })
    const bill = e.currentTarget.dataset.bill
    if (!bill) return

    // 判断是否有多个用途
    if (bill.usages && bill.usages.length > 1) {
      // 显示用途选择抽屉
      this.setData({
        showUsageDrawer: true,
        currentQuickBill: bill,
        currentUsages: bill.usages
      })
    } else {
      // 只有一个用途，直接记账
      const usage = bill.usages && bill.usages[0] ? bill.usages[0] : null
      this.doQuickBill(bill, usage)
    }
  },

  /**
   * 选择用途后记账
   * @param {Object} e - 事件对象，包含 dataset.usage
   */
  onUsageSelect(e) {
    wx.vibrateShort({ type: 'light' })
    const usage = e.currentTarget.dataset.usage
    if (!usage) return

    const bill = this.data.currentQuickBill
    this.closeUsageDrawer()
    this.doQuickBill(bill, usage)
  },

  /**
   * 执行快速记账
   * @param {Object} bill - 常用账单数据
   * @param {Object|null} usage - 选中的用途，为 null 时使用默认金额
   */
  doQuickBill(bill, usage) {
    const amount = usage ? usage.amount : bill.defaultAmount
    const remark = usage ? (usage.remark || bill.name) : bill.name

    const billData = {
      amount: amount,
      type: bill.type,
      category: bill.category,
      remark: remark,
      date: new Date().toISOString()
    }

    const dataManager = app.getDataManager()
    dataManager.addBill(billData).then(() => {
      wx.vibrateShort({ type: 'medium' })
      wx.showToast({
        title: bill.name + ' ¥' + amount.toFixed(2),
        icon: 'success',
        duration: 1500
      })
      // 刷新页面数据
      this.loadData()
    }).catch(err => {
      console.error('快速记账失败:', err)
      wx.showToast({
        title: '记账失败，请重试',
        icon: 'none',
        duration: 2000
      })
    })
  },

  /**
   * 关闭用途选择抽屉
   */
  closeUsageDrawer() {
    this.setData({ showUsageDrawer: false })
  },

  /**
   * 阻止事件冒泡（抽屉内容区域点击不关闭）
   */
  stopPropagation() {
  },

  /**
   * 跳转到常用账单管理页
   */
  goToQuickBillsManage() {
    wx.navigateTo({
      url: '/pages/quick-bills-manage/quick-bills-manage'
    })
  }
})
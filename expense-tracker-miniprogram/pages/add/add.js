const app = getApp()
const quickBillsManager = require('../../utils/quickBills.js')

Page({
  data: {
    type: 'expense',
    amount: '',
    selectedCategory: '',
    selectedCategoryName: '',
    categories: [],
    isSaving: false,
    lastSubmitTime: 0,
    debounceInterval: 2000,
    showRemark: false,
    remark: '',
    justSelected: '',
    amountAnimating: false,
    billDate: '',
    billDateDisplay: '今天',
    // 常用账单相关
    quickBills: [],
    showUsageDrawer: false,
    currentQuickBill: {},
    selectedUsageId: ''
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.loadCategories()
    this.loadQuickBills()
  },

  initPage() {
    this.loadCategories()
  },

  loadCategories() {
    const categories = this.data.type === 'expense'
      ? app.globalData.categories.expense
      : app.globalData.categories.income

    const firstCategory = categories[0]
    this.setData({
      categories: categories,
      selectedCategory: firstCategory?.id || '',
      selectedCategoryName: firstCategory?.name || ''
    })
  },

  /**
   * 加载常用账单数据，按当前类型筛选
   */
  loadQuickBills() {
    const allBills = quickBillsManager.getAll()
    const filteredBills = allBills.filter(bill => bill.type === this.data.type)
    this.setData({ quickBills: filteredBills })
  },

  /**
   * 点击常用账单项
   * - 多个用途：弹出用途选择抽屉
   * - 单个用途：直接填充表单
   */
  onQuickBillTap(e) {
    const billId = e.currentTarget.dataset.billId
    const bill = quickBillsManager.getById(billId)
    if (!bill) return

    wx.vibrateShort({ type: 'light' })

    // 如果有多个用途，显示用途选择弹窗
    if (quickBillsManager.hasMultipleUsages(billId)) {
      this.setData({
        showUsageDrawer: true,
        currentQuickBill: bill,
        selectedUsageId: ''
      })
    } else {
      // 只有一个用途，直接填充
      const usage = bill.usages[0]
      this.fillFormFromUsage(bill, usage)
    }
  },

  /**
   * 选择用途后填充表单
   */
  onUsageSelect(e) {
    const usageId = e.currentTarget.dataset.usageId
    const bill = this.data.currentQuickBill
    if (!bill || !bill.usages) return

    const usage = bill.usages.find(u => u.id === usageId)
    if (!usage) return

    wx.vibrateShort({ type: 'light' })

    this.setData({
      selectedUsageId: usageId,
      showUsageDrawer: false
    })

    this.fillFormFromUsage(bill, usage)
  },

  /**
   * 根据用途数据填充表单（金额、分类、备注）
   * @param {Object} bill - 常用账单对象
   * @param {Object} usage - 用途对象
   */
  fillFormFromUsage(bill, usage) {
    // 查找分类信息以获取分类名称
    const categories = this.data.type === 'expense'
      ? app.globalData.categories.expense
      : app.globalData.categories.income
    const categoryInfo = categories.find(c => c.id === bill.category)

    // 合并一次 setData，避免多次渲染
    this.setData({
      amount: String(usage.amount),
      selectedCategory: bill.category,
      selectedCategoryName: categoryInfo?.name || bill.name,
      remark: usage.remark || '',
      showRemark: !!(usage.remark),
      amountAnimating: true
    })

    setTimeout(() => {
      this.setData({ amountAnimating: false })
    }, 250)
  },

  /**
   * 关闭用途选择抽屉
   */
  closeUsageDrawer() {
    this.setData({
      showUsageDrawer: false,
      selectedUsageId: ''
    })
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.type) return

    wx.vibrateShort({ type: 'light' })

    this.setData({
      type: type,
      selectedCategory: '',
      selectedCategoryName: ''
    }, () => {
      this.loadCategories()
      this.loadQuickBills()
    })
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    if (category === this.data.selectedCategory) return

    wx.vibrateShort({ type: 'light' })

    const categoryInfo = this.data.categories.find(c => c.id === category)

    this.setData({
      selectedCategory: category,
      selectedCategoryName: categoryInfo?.name || '',
      justSelected: category
    })

    setTimeout(() => {
      this.setData({ justSelected: '' })
    }, 400)
  },

  onKeyPress(e) {
    const key = e.currentTarget.dataset.key
    let amount = this.data.amount

    wx.vibrateShort({ type: 'light' })

    if (key === 'backspace') {
      amount = amount.slice(0, -1)
    } else if (key === '.') {
      if (!amount.includes('.')) {
        amount = amount || '0'
        amount += '.'
      }
    } else {
      if (amount.includes('.')) {
        const parts = amount.split('.')
        if (parts[1].length >= 2) return
      }
      if (amount.length >= 10) return
      amount += key
      if (amount.startsWith('0') && !amount.startsWith('0.') && amount.length > 1) {
        amount = amount.substring(1)
      }
    }

    this.setData({
      amount,
      amountAnimating: true
    })

    setTimeout(() => {
      this.setData({ amountAnimating: false })
    }, 250)
  },

  toggleRemark() {
    wx.vibrateShort({ type: 'light' })
    this.setData({ showRemark: !this.data.showRemark })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onRemarkConfirm() {
    this.setData({ showRemark: false })
  },

  onDateChange(e) {
    const selectedDate = e.detail.value
    const today = new Date()
    const todayStr = this.formatDateToYMD(today)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = this.formatDateToYMD(yesterday)

    let display = ''
    if (selectedDate === todayStr) {
      display = '今天'
    } else if (selectedDate === yesterdayStr) {
      display = '昨天'
    } else {
      const d = new Date(selectedDate)
      display = `${d.getMonth() + 1}月${d.getDate()}日`
    }

    this.setData({
      billDate: selectedDate,
      billDateDisplay: display
    })
  },

  formatDateToYMD(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  async onSave() {
    const { isSaving, lastSubmitTime, debounceInterval, amount, selectedCategory, type, remark } = this.data
    const now = Date.now()

    if (now - lastSubmitTime < debounceInterval) {
      wx.showToast({
        title: '操作太频繁，请稍后再试',
        icon: 'none',
        duration: 1500
      })
      return
    }

    if (isSaving) {
      wx.showToast({
        title: '正在保存中...',
        icon: 'none',
        duration: 1500
      })
      return
    }

    if (!amount || parseFloat(amount) === 0) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none',
        duration: 2000
      })
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 0.01) {
      wx.showToast({
        title: '金额不能小于0.01',
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

    if (!selectedCategory) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({
      isSaving: true,
      lastSubmitTime: now
    })

    wx.showLoading({ title: '保存中...', mask: true })

    try {
      const dataManager = app.getDataManager()
      const billDate = this.data.billDate
      let dateObj = new Date()
      if (billDate) {
        const [y, m, d] = billDate.split('-').map(Number)
        const now = new Date()
        dateObj = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds())
      }
      const bill = {
        type: type,
        category: selectedCategory,
        amount: parseFloat(amount),
        remark: remark || '',
        date: dateObj.toISOString()
      }

      const result = await dataManager.addBill(bill)

      if (!result) {
        wx.hideLoading()
        this.setData({ isSaving: false })
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
        return
      }

      app.syncBudgetUsed()

      wx.hideLoading()
      wx.vibrateShort({ type: 'medium' })

      wx.showToast({
        title: '记账成功',
        icon: 'success',
        duration: 1200
      })

      setTimeout(() => {
        this.setData({
          amount: '',
          remark: '',
          showRemark: false,
          amountAnimating: false,
          isSaving: false
        })
        wx.switchTab({ url: '/pages/home/home' })
      }, 1200)
    } catch (error) {
      wx.hideLoading()
      this.setData({ isSaving: false })
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  }
})
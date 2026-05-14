const app = getApp()
const { validateAmount, validateCategory, formatAmountInput } = require('../../utils/validators.js')
const quickBillsManager = require('../../utils/quickBills.js')

Page({
  data: {
    type: 'expense',
    amount: '',
    selectedCategory: '',
    date: '',
    remark: '',
    categories: [],
    quickBills: [],
    formErrors: {},
    isSaving: false,
    isLoadingCategories: false,
    // 防抖控制：记录上次提交时间
    lastSubmitTime: 0,
    // 防抖间隔时间（毫秒）
    debounceInterval: 2000,
    // 用途选择相关
    showUsageSelector: false,
    currentQuickBill: null,
    currentBillUsages: []
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.loadQuickBills()
  },

  initPage() {
    const today = this.formatDate(new Date())
    this.setData({
      date: today
    })
    this.loadQuickBills()
    this.loadCategories()
  },

  loadQuickBills() {
    const allQuickBills = quickBillsManager.getAll()
    const filteredBills = allQuickBills.filter(bill => bill.type === this.data.type)
    this.setData({
      quickBills: filteredBills
    })
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  loadCategories() {
    if (this.data.isLoadingCategories) return

    this.setData({ isLoadingCategories: true })

    const categories = this.data.type === 'expense'
      ? app.globalData.categories.expense
      : app.globalData.categories.income

    this.setData({
      categories: categories,
      selectedCategory: categories[0]?.id || '',
      isLoadingCategories: false
    })
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.type) return

    wx.vibrateShort({ type: 'light' })

    this.setData({
      type: type,
      selectedCategory: '',
      formErrors: {}
    }, () => {
      this.loadCategories()
      this.loadQuickBills()
    })
  },

  selectQuickBill(e) {
    const bill = e.currentTarget.dataset.bill
    wx.vibrateShort({ type: 'light' })

    const billId = bill.id
    if (quickBillsManager.hasMultipleUsages(billId)) {
      const usages = quickBillsManager.getUsages(billId)
      this.setData({
        showUsageSelector: true,
        currentQuickBill: bill,
        currentBillUsages: usages
      })
    } else {
      const defaultUsage = quickBillsManager.getDefaultUsage(billId)
      this.fillBillForm(bill, defaultUsage)
    }
  },

  fillBillForm(bill, usage) {
    let shouldSwitchType = bill.type !== this.data.type

    const updateData = {
      amount: String(usage ? usage.amount : bill.defaultAmount),
      remark: usage ? usage.remark : bill.remark,
      formErrors: {}
    }

    if (shouldSwitchType) {
      updateData.type = bill.type
    }

    this.setData(updateData, () => {
      if (shouldSwitchType) {
        this.loadCategories()
        this.loadQuickBills()
      }

      const categories = this.data.type === 'expense'
        ? app.globalData.categories.expense
        : app.globalData.categories.income

      const matchedCategory = categories.find(cat => cat.id === bill.category)
      if (matchedCategory) {
        this.setData({
          selectedCategory: matchedCategory.id
        })
      } else if (categories.length > 0) {
        this.setData({
          selectedCategory: categories[0].id
        })
      }
    })
  },

  selectUsage(e) {
    const usage = e.currentTarget.dataset.usage
    wx.vibrateShort({ type: 'light' })
    
    this.fillBillForm(this.data.currentQuickBill, usage)
    this.hideUsageSelector()
  },

  hideUsageSelector() {
    this.setData({
      showUsageSelector: false,
      currentQuickBill: null,
      currentBillUsages: []
    })
  },

  onAmountInput(e) {
    const formatted = formatAmountInput(e.detail.value)
    this.setData({
      amount: formatted,
      formErrors: { ...this.data.formErrors, amount: '' }
    })
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    wx.vibrateShort({ type: 'light' })

    this.setData({
      selectedCategory: category,
      formErrors: { ...this.data.formErrors, category: '' }
    })
  },

  onDateChange(e) {
    this.setData({
      date: e.detail.value
    })
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  validateAmount() {
    const { amount } = this.data
    const result = validateAmount(amount)
    if (!result.isValid) {
      this.setData({
        formErrors: {
          ...this.data.formErrors,
          amount: result.errors.amount
        }
      })
    } else {
      this.setData({
        formErrors: {
          ...this.data.formErrors,
          amount: ''
        }
      })
    }
  },

  validateForm() {
    const { amount, selectedCategory } = this.data

    const amountResult = validateAmount(amount)
    const categoryResult = validateCategory(selectedCategory)

    const errors = {
      amount: amountResult.errors.amount,
      category: categoryResult.errors.category
    }

    this.setData({ formErrors: errors })

    return amountResult.isValid && categoryResult.isValid
  },

  /**
   * 保存账单
   * 使用防抖机制防止重复提交
   */
  onSave() {
    const { isSaving, lastSubmitTime, debounceInterval } = this.data
    const now = Date.now()

    // 防抖检查：如果距离上次提交不足间隔时间，则忽略
    if (now - lastSubmitTime < debounceInterval) {
      wx.showToast({
        title: '操作太频繁，请稍后再试',
        icon: 'none',
        duration: 1500
      })
      return
    }

    // 如果正在保存中，则忽略重复提交
    if (isSaving) {
      wx.showToast({
        title: '正在保存中...',
        icon: 'none',
        duration: 1500
      })
      return
    }

    if (!this.validateForm()) {
      wx.showToast({
        title: '请检查填写内容',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 更新防抖时间戳和提交状态
    this.setData({
      isSaving: true,
      lastSubmitTime: now
    })

    wx.showLoading({ title: '保存中...', mask: true })

    const { type, amount, selectedCategory, date, remark } = this.data

    const dataManager = app.getDataManager()
    const bill = {
      type: type,
      category: selectedCategory,
      amount: parseFloat(amount),
      remark: remark.trim(),
      date: new Date(date).toISOString()
    }

    dataManager.addBill(bill)

    wx.hideLoading()
    wx.vibrateShort({ type: 'medium' })

    wx.showToast({
      title: '记账成功',
      icon: 'success',
      duration: 1500
    })

    // 重置保存状态，允许下次提交
    setTimeout(() => {
      this.setData({ isSaving: false })
    }, debounceInterval)

    setTimeout(() => {
      wx.navigateBack({ delta: 1 })
    }, 1500)
  },

  onCancel() {
    if (this.data.amount || this.data.remark) {
      wx.showModal({
        title: '确认离开',
        content: '当前输入的内容将会丢失，确定要离开吗？',
        confirmText: '离开',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack({ delta: 1 })
          }
        }
      })
    } else {
      wx.navigateBack({ delta: 1 })
    }
  }
})
const app = getApp()

Page({
  data: {
    groupedBills: [],
    isEditMode: false,
    selectedBills: {},
    selectedCount: 0,
    recordCount: 0,
    activeDays: 0,
    totalExpenseDisplay: '¥0.00',
    totalIncomeDisplay: '¥0.00'
  },

  onLoad() {
    this.loadBills()
  },

  onShow() {
    this.loadBills()
  },

  onPullDownRefresh() {
    this.loadBills()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 600)
  },

  loadBills() {
    const dataManager = app.getDataManager()
    const allBills = dataManager.getBills()

    if (allBills.length === 0) {
      this.setData({
        groupedBills: [],
        recordCount: 0,
        activeDays: 0,
        totalExpenseDisplay: '¥0.00',
        totalIncomeDisplay: '¥0.00'
      })
      return
    }

    const groups = {}
    let totalExpense = 0
    let totalIncome = 0

    allBills.forEach(bill => {
      const date = new Date(bill.date)
      const dateKey = this.getDateKey(date)

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          dateLabel: this.getDateLabel(date),
          totalExpense: 0,
          totalIncome: 0,
          totalExpenseStr: '0.00',
          totalIncomeStr: '0.00',
          bills: []
        }
      }

      const categoryInfo = this.getCategoryInfo(bill.category, bill.type)
      const amount = parseFloat(bill.amount) || 0

      if (bill.type === 'expense') {
        groups[dateKey].totalExpense += amount
        totalExpense += amount
      } else {
        groups[dateKey].totalIncome += amount
        totalIncome += amount
      }

      groups[dateKey].bills.push({
        id: bill.id,
        _id: bill._id,
        category: bill.category,
        categoryName: categoryInfo.name,
        amount: amount,
        amountDisplay: (bill.type === 'income' ? '+' : '-') + '¥' + amount.toFixed(2),
        time: this.formatTime(date),
        icon: categoryInfo.icon,
        remark: bill.remark || '',
        type: bill.type,
        date: bill.date
      })
    })

    const grouped = Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date))

    grouped.forEach(group => {
      group.totalExpenseStr = group.totalExpense.toFixed(2)
      group.totalIncomeStr = group.totalIncome.toFixed(2)
    })

    this.setData({
      groupedBills: grouped,
      recordCount: allBills.length,
      activeDays: grouped.length,
      totalExpenseDisplay: '¥' + totalExpense.toFixed(2),
      totalIncomeDisplay: '¥' + totalIncome.toFixed(2)
    })
  },

  getDateKey(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  getDateLabel(date) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const billDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (billDate.getTime() === today.getTime()) {
      return '今天'
    } else if (billDate.getTime() === yesterday.getTime()) {
      return '昨天'
    } else {
      const month = (date.getMonth() + 1).toString()
      const day = date.getDate().toString()
      return `${month}月${day}日`
    }
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  },

  getCategoryInfo(categoryId, type) {
    const categories = type === 'expense'
      ? app.globalData.categories.expense
      : app.globalData.categories.income

    const category = categories.find(c => c.id === categoryId)
    return category || { name: categoryId, icon: '📝' }
  },

  toggleEditMode() {
    wx.vibrateShort({ type: 'light' })
    const newMode = !this.data.isEditMode
    this.setData({
      isEditMode: newMode,
      selectedBills: newMode ? {} : this.data.selectedBills,
      selectedCount: 0
    })
  },

  onBillTap(e) {
    const bill = e.currentTarget.dataset.bill
    if (this.data.isEditMode) {
      this.toggleSelectBill(e)
    } else {
      this.goToDetail(bill)
    }
  },

  toggleSelectBill(e) {
    const billId = e.currentTarget.dataset.billId
    const { selectedBills, selectedCount } = this.data

    if (selectedBills[billId]) {
      delete selectedBills[billId]
    } else {
      selectedBills[billId] = true
    }

    this.setData({
      selectedBills: { ...selectedBills },
      selectedCount: Object.keys(selectedBills).length
    })

    wx.vibrateShort({ type: 'light' })
  },

  deleteSelectedBills() {
    const selectedIds = Object.keys(this.data.selectedBills)
    if (selectedIds.length === 0) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIds.length} 条账单吗？此操作不可恢复。`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.doBatchDelete(selectedIds)
        }
      }
    })
  },

  async doBatchDelete(billIds) {
    wx.showLoading({ title: '删除中...', mask: true })

    try {
      const dataManager = app.getDataManager()
      const results = await Promise.allSettled(
        billIds.map(billId => dataManager.deleteBill(billId))
      )

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== false).length

      wx.hideLoading()

      if (successCount > 0) {
        wx.showToast({
          title: `已删除 ${successCount} 条`,
          icon: 'success',
          duration: 1500
        })

        this.setData({
          isEditMode: false,
          selectedBills: {},
          selectedCount: 0
        })

        setTimeout(() => {
          this.loadBills()
        }, 500)
      } else {
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('批量删除失败:', error)
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      })
    }
  },

  goToDetail(bill) {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({
      url: `/pages/bill-detail/bill-detail?id=${bill.id}`
    })
  },

  showBillActions(bill) {
    wx.vibrateShort({ type: 'light' })
    wx.showActionSheet({
      itemList: ['查看详情', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showBillDetail(bill)
        } else if (res.tapIndex === 1) {
          this.confirmDeleteBill(bill)
        }
      }
    })
  },

  showBillDetail(bill) {
    const typeText = bill.type === 'income' ? '收入' : '支出'
    const date = new Date(bill.date)

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const timeStr = this.formatTime(date)

    wx.showModal({
      title: '账单详情',
      content: `分类：${bill.categoryName}\n类型：${typeText}\n金额：¥${bill.amount.toFixed(2)}\n日期：${dateStr}\n时间：${timeStr}${bill.remark ? '\n备注：' + bill.remark : ''}`,
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  confirmDeleteBill(bill) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条 ${bill.categoryName} 账单吗？金额：¥${bill.amount.toFixed(2)}`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.deleteBill(bill)
        }
      }
    })
  },

  async deleteBill(bill) {
    const dataManager = app.getDataManager()
    await dataManager.deleteBill(bill.id)

    wx.showToast({
      title: '删除成功',
      icon: 'success',
      duration: 1500
    })

    setTimeout(() => {
      this.loadBills()
    }, 500)
  },

  onHide() {
    if (this.data.isEditMode) {
      this.setData({
        isEditMode: false,
        selectedBills: {},
        selectedCount: 0
      })
    }
  }
})

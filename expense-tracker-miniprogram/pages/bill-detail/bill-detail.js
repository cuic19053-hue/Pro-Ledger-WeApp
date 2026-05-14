const app = getApp()

Page({
  data: {
    bill: null,
    billId: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ billId: options.id })
      this.loadBill(options.id)
    }
  },

  loadBill(billId) {
    const dataManager = app.getDataManager()
    const allBills = dataManager.getBills()
    const bill = allBills.find(b => b.id === billId || b._id === billId)

    if (!bill) {
      wx.showToast({ title: '账单不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const date = new Date(bill.date)
    const categoryInfo = this.getCategoryInfo(bill.category, bill.type)
    const amount = parseFloat(bill.amount) || 0

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    this.setData({
      bill: {
        id: bill.id || bill._id,
        _id: bill._id,
        type: bill.type,
        category: bill.category,
        categoryName: categoryInfo.name,
        icon: categoryInfo.icon,
        amount: amount,
        amountDisplay: (bill.type === 'income' ? '+' : '-') + '¥' + amount.toFixed(2),
        dateLabel: `${year}-${month}-${day} ${hours}:${minutes}`,
        remark: bill.remark || '',
        date: bill.date
      }
    })
  },

  getCategoryInfo(categoryId, type) {
    const categories = type === 'expense'
      ? app.globalData.categories.expense
      : app.globalData.categories.income
    const category = categories.find(c => c.id === categoryId)
    return category || { name: categoryId, icon: '📝' }
  },

  goBack() {
    wx.navigateBack()
  },

  editBill() {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' })
  },

  deleteBill() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条账单吗？此操作不可恢复。',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...', mask: true })
          try {
            const dataManager = app.getDataManager()
            const billId = this.data.bill.id
            await dataManager.deleteBill(billId)

            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success', duration: 1500 })

            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } catch (error) {
            wx.hideLoading()
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})
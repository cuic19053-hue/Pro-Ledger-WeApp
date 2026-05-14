const quickBillsManager = require('../../utils/quickBills.js')
const { showToast, showModal } = require('../../utils/helpers.js')

Page({
  data: {
    quickBills: [],
    showModal: false,
    editingId: null,
    form: {
      name: '',
      icon: '🍜',
      defaultAmount: '',
      type: 'expense',
      category: '',
      remark: ''
    },
    iconOptions: ['🍜', '🛒', '🚇', '🎬', '📚', '💊', '🏠', '📱', '💰', '💵', '🎁', '📈', '📝', '🎮', '👕', '🧴', '🐱', '🌟', '✈️', '🎵', '🍳', '🍲', '🧋', '🍿', '🚌'],
    currentCategories: [],
    showUsageModal: false,
    showEditUsageModal: false,
    currentBillId: null,
    currentBillName: '',
    currentBillDefaultUsageId: null,
    usagesList: [],
    editingUsageId: null,
    usageForm: {
      name: '',
      amount: '',
      remark: ''
    }
  },

  onLoad() {
    this.loadQuickBills()
    this.initCategories()
  },

  onShow() {
    this.loadQuickBills()
  },

  loadQuickBills() {
    const bills = quickBillsManager.getAll()
    this.setData({ quickBills: bills })
  },

  initCategories() {
    const app = getApp()
    const expenseCategories = app.globalData.categories.expense.map(c => c.name)
    const incomeCategories = app.globalData.categories.income.map(c => c.name)
    
    this.setData({
      expenseCategories,
      incomeCategories,
      currentCategories: expenseCategories,
      'form.category': expenseCategories[0] || ''
    })
  },

  showAddModal() {
    this.setData({
      showModal: true,
      editingId: null,
      form: {
        name: '',
        icon: '🍜',
        defaultAmount: '',
        type: 'expense',
        category: this.data.expenseCategories[0] || '',
        remark: ''
      },
      currentCategories: this.data.expenseCategories
    })
  },

  closeModal() {
    this.setData({ showModal: false })
  },

  stopPropagation() {
  },

  onNameInput(e) {
    this.setData({
      'form.name': e.detail.value
    })
  },

  onAmountInput(e) {
    this.setData({
      'form.defaultAmount': e.detail.value
    })
  },

  onRemarkInput(e) {
    this.setData({
      'form.remark': e.detail.value
    })
  },

  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon
    wx.vibrateShort({ type: 'light' })
    this.setData({
      'form.icon': icon
    })
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type
    const categories = type === 'expense' ? this.data.expenseCategories : this.data.incomeCategories
    wx.vibrateShort({ type: 'light' })
    this.setData({
      'form.type': type,
      'form.category': categories[0] || '',
      currentCategories: categories
    })
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    wx.vibrateShort({ type: 'light' })
    this.setData({
      'form.category': category
    })
  },

  editBill(e) {
    const { id } = e.currentTarget.dataset
    const bill = quickBillsManager.getById(id)
    
    if (!bill) {
      showToast('账单不存在')
      return
    }

    const categories = bill.type === 'expense' ? this.data.expenseCategories : this.data.incomeCategories

    this.setData({
      showModal: true,
      editingId: id,
      form: {
        name: bill.name,
        icon: bill.icon,
        defaultAmount: bill.defaultAmount.toString(),
        type: bill.type,
        category: bill.category,
        remark: bill.remark || ''
      },
      currentCategories: categories
    })
  },

  deleteBill(e) {
    const { id } = e.currentTarget.dataset
    
    showModal('确认删除', '确定要删除这个常用账单吗？', {
      confirmText: '删除',
      confirmColor: '#EF4444'
    }).then((confirmed) => {
      if (confirmed) {
        const success = quickBillsManager.delete(id)
        if (success) {
          showToast('删除成功', 'success')
          this.loadQuickBills()
        } else {
          showToast('删除失败')
        }
      }
    })
  },

  saveBill() {
    const { editingId, form } = this.data

    if (!form.name.trim()) {
      showToast('请输入账单名称')
      return
    }

    if (!form.defaultAmount || parseFloat(form.defaultAmount) <= 0) {
      showToast('请输入有效的默认金额')
      return
    }

    if (!form.category) {
      showToast('请选择分类')
      return
    }

    try {
      if (editingId) {
        quickBillsManager.update(editingId, {
          name: form.name.trim(),
          icon: form.icon,
          defaultAmount: parseFloat(form.defaultAmount),
          type: form.type,
          category: form.category,
          remark: form.remark.trim()
        })
        showToast('修改成功', 'success')
      } else {
        quickBillsManager.add({
          name: form.name.trim(),
          icon: form.icon,
          defaultAmount: parseFloat(form.defaultAmount),
          type: form.type,
          category: form.category,
          remark: form.remark.trim()
        })
        showToast('添加成功', 'success')
      }

      this.closeModal()
      this.loadQuickBills()
    } catch (error) {
      console.error('保存失败:', error)
      showToast('保存失败')
    }
  },

  openUsageManage(e) {
    const { id } = e.currentTarget.dataset
    const bill = quickBillsManager.getById(id)
    
    if (!bill) {
      showToast('账单不存在')
      return
    }

    const usages = quickBillsManager.getUsages(id)
    this.setData({
      showUsageModal: true,
      currentBillId: id,
      currentBillName: bill.name,
      currentBillDefaultUsageId: bill.defaultUsageId,
      usagesList: usages
    })
  },

  closeUsageModal() {
    this.setData({ showUsageModal: false })
  },

  loadUsages() {
    if (!this.data.currentBillId) return
    const usages = quickBillsManager.getUsages(this.data.currentBillId)
    const bill = quickBillsManager.getById(this.data.currentBillId)
    this.setData({
      usagesList: usages,
      currentBillDefaultUsageId: bill ? bill.defaultUsageId : null
    })
  },

  showAddUsageModal() {
    this.setData({
      showEditUsageModal: true,
      editingUsageId: null,
      usageForm: {
        name: '',
        amount: '',
        remark: ''
      }
    })
  },

  editUsage(e) {
    const { id } = e.currentTarget.dataset
    const usage = quickBillsManager.getUsage(this.data.currentBillId, id)
    
    if (!usage) {
      showToast('用途不存在')
      return
    }

    this.setData({
      showEditUsageModal: true,
      editingUsageId: id,
      usageForm: {
        name: usage.name,
        amount: usage.amount.toString(),
        remark: usage.remark || ''
      }
    })
  },

  closeEditUsageModal() {
    this.setData({ showEditUsageModal: false })
  },

  onUsageNameInput(e) {
    this.setData({
      'usageForm.name': e.detail.value
    })
  },

  onUsageAmountInput(e) {
    this.setData({
      'usageForm.amount': e.detail.value
    })
  },

  onUsageRemarkInput(e) {
    this.setData({
      'usageForm.remark': e.detail.value
    })
  },

  saveUsage() {
    const { currentBillId, editingUsageId, usageForm } = this.data

    if (!usageForm.name.trim()) {
      showToast('请输入用途名称')
      return
    }

    if (!usageForm.amount || parseFloat(usageForm.amount) <= 0) {
      showToast('请输入有效的金额')
      return
    }

    try {
      const usageData = {
        name: usageForm.name.trim(),
        amount: parseFloat(usageForm.amount),
        remark: usageForm.remark.trim()
      }

      if (editingUsageId) {
        quickBillsManager.updateUsage(currentBillId, editingUsageId, usageData)
        showToast('修改成功', 'success')
      } else {
        quickBillsManager.addUsage(currentBillId, usageData)
        showToast('添加成功', 'success')
      }

      this.closeEditUsageModal()
      this.loadUsages()
    } catch (error) {
      console.error('保存用途失败:', error)
      showToast('保存失败')
    }
  },

  deleteUsage(e) {
    const { id } = e.currentTarget.dataset
    const usages = quickBillsManager.getUsages(this.data.currentBillId)
    
    if (usages.length <= 1) {
      showToast('至少需要保留一个用途')
      return
    }
    
    showModal('确认删除', '确定要删除这个用途吗？', {
      confirmText: '删除',
      confirmColor: '#EF4444'
    }).then((confirmed) => {
      if (confirmed) {
        const success = quickBillsManager.deleteUsage(this.data.currentBillId, id)
        if (success) {
          showToast('删除成功', 'success')
          this.loadUsages()
        } else {
          showToast('删除失败')
        }
      }
    })
  },

  setDefaultUsage(e) {
    const { id } = e.currentTarget.dataset
    const success = quickBillsManager.setDefaultUsage(this.data.currentBillId, id)
    if (success) {
      showToast('设置成功', 'success')
      this.loadUsages()
    } else {
      showToast('设置失败')
    }
  }
})

const app = getApp()
const { exportToCSV } = require('../../utils/exportUtils.js')

Page({
  data: {
    userInfo: {},
    recordCount: 0,
    activeDays: 0,
    monthExpenseDisplay: '¥0.00',
    budgetRemainingDisplay: '¥0.00',
    budgetPercent: 0,
    hasBudget: false
  },

  onLoad() {
    this.loadUserInfo()
    this.loadSummary()
  },

  onShow() {
    this.loadUserInfo()
    this.loadSummary()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({
      userInfo: app.globalData.userInfo || userInfo
    })
  },

  loadSummary() {
    const dataManager = app.getDataManager()
    const bills = dataManager.getBills()
    const recordCount = bills.length
    const activeDays = new Set(
      bills.map(bill => {
        const date = new Date(bill.date)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })
    ).size

    const now = new Date()
    let monthExpense = 0
    bills.forEach(bill => {
      const date = new Date(bill.date)
      if (
        bill.type === 'expense' &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      ) {
        monthExpense += parseFloat(bill.amount) || 0
      }
    })

    const budget = app.getBudget()
    const budgetTotal = budget?.total || 0
    const budgetRemaining = Math.max(0, budgetTotal - monthExpense)
    const budgetPercent = budgetTotal > 0 ? Math.min(100, Math.round((monthExpense / budgetTotal) * 100)) : 0

    this.setData({
      recordCount,
      activeDays,
      monthExpenseDisplay: '¥' + monthExpense.toFixed(2),
      budgetRemainingDisplay: '¥' + budgetRemaining.toFixed(2),
      budgetPercent,
      hasBudget: budgetTotal > 0
    })
  },

  editProfile() {
    wx.vibrateShort({ type: 'light' })
    wx.showActionSheet({
      itemList: ['修改昵称', '更换头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editNickname()
        } else if (res.tapIndex === 1) {
          this.changeAvatar()
        }
      }
    })
  },

  editNickname() {
    const currentName = this.data.userInfo.nickName || ''
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      defaultText: currentName,
      success: async (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const newName = res.content.trim()

          if (newName === currentName) return

          wx.showLoading({ title: '检查中...', mask: true })

          try {
            const checkRes = await wx.cloud.callFunction({
              name: 'login',
              data: {
                action: 'checkNickname',
                nickname: newName,
                excludeOpenid: app.globalData.openid
              }
            })

            wx.hideLoading()

            if (checkRes.result && checkRes.result.available === false) {
              wx.showToast({ title: '该昵称已被使用', icon: 'none', duration: 2000 })
              return
            }

            await this.updateUserInfo({ nickName: newName })
          } catch (error) {
            wx.hideLoading()
            wx.showToast({ title: '检查失败，请重试', icon: 'none' })
          }
        }
      }
    })
  },

  changeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...', mask: true })
        try {
          const cloudPath = 'avatars/' + app.globalData.openid + '_' + Date.now() + '.jpg'
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath
          })
          await this.updateUserInfo({ avatarUrl: uploadRes.fileID })
        } catch (error) {
          await this.updateUserInfo({ avatarUrl: tempFilePath })
        }
        wx.hideLoading()
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({ title: '选择失败', icon: 'none' })
        }
      }
    })
  },

  async updateUserInfo(updateData) {
    const openid = app.globalData.openid
    if (!openid) return

    const currentUserInfo = app.globalData.userInfo || {}
    const newUserInfo = { ...currentUserInfo, ...updateData }

    app.globalData.userInfo = newUserInfo
    wx.setStorageSync('userInfo', newUserInfo)

    this.setData({ userInfo: newUserInfo })

    try {
      const db = wx.cloud.database()
      const users = await db.collection('users').where({ openid: openid }).limit(1).get()

      if (users.data && users.data.length > 0) {
        await db.collection('users').doc(users.data[0]._id).update({
          data: {
            ...updateData,
            updateTime: new Date()
          }
        })
      }
    } catch (error) {
      console.warn('更新用户信息到云端失败:', error)
    }

    wx.showToast({ title: '更新成功', icon: 'success', duration: 1200 })
  },

  goToBudget() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ url: '/pages/budget/budget' })
  },

  goToQuickBills() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ url: '/pages/quick-bills-manage/quick-bills-manage' })
  },

  goToAgreement() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  goToPrivacy() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  goToAbout() {
    wx.vibrateShort({ type: 'light' })
    wx.showModal({
      title: '关于',
      content: 'CH 记账 v1.0.0\n\n轻松管理您的财务\n\n© 2024 CH 记账',
      showCancel: false
    })
  },

  exportData() {
    wx.vibrateShort({ type: 'light' })
    const dataManager = app.getDataManager()
    const bills = dataManager.getBills()
    if (bills.length === 0) {
      wx.showToast({ title: '暂无数据可导出', icon: 'none' })
      return
    }

    wx.showActionSheet({
      itemList: ['导出为 CSV', '导出为 JSON'],
      success: (res) => {
        if (res.tapIndex === 0) {
          exportToCSV(bills, app.globalData.categories)
        } else {
          this.backupData()
        }
      }
    })
  },

  backupData() {
    try {
      const dataManager = app.getDataManager()
      const backupData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        userInfo: app.globalData.userInfo,
        bills: dataManager.getBills(),
        budget: app.getBudget()
      }

      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/账单备份_${new Date().toISOString().slice(0, 10)}.json`

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8')

      wx.openDocument({
        filePath,
        fileType: 'json',
        showMenu: true,
        success: () => {
          wx.showToast({ title: '备份成功', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '备份文件已保存', icon: 'none' })
        }
      })
    } catch (error) {
      console.error('备份失败:', error)
      wx.showToast({ title: '备份失败，请重试', icon: 'none' })
    }
  },

  async feedback() {
    wx.vibrateShort({ type: 'light' })
    wx.showModal({
      title: '意见反馈',
      content: '请描述您遇到的问题或建议',
      editable: true,
      placeholderText: '请输入您的反馈内容...',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            const db = wx.cloud.database()
            await db.collection('feedback').add({
              data: {
                content: res.content,
                openid: app.globalData.openid,
                nickName: app.globalData.userInfo?.nickName || '',
                createTime: new Date()
              }
            })
            wx.showToast({ title: '感谢您的反馈', icon: 'success' })
          } catch (error) {
            wx.showToast({ title: '反馈已记录', icon: 'success' })
          }
        }
      }
    })
  },

  cancelAccount() {
    wx.vibrateShort({ type: 'light' })
    wx.showModal({
      title: '注销账号',
      content: '注销后将删除您的所有数据，包括：\n\n• 账户信息\n• 记账记录\n• 预算设置\n• 分类设置\n\n此操作不可恢复，确定要注销吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.showCancelConfirm()
        }
      }
    })
  },

  showCancelConfirm() {
    wx.showModal({
      title: '确认注销',
      content: '为了您的账户安全，请再次确认注销操作。\n\n输入"注销"二字确认：',
      editable: true,
      placeholderText: '请输入"注销"',
      success: (res) => {
        if (res.confirm) {
          if (res.content === '注销') {
            this.doCancelAccount()
          } else {
            wx.showToast({ title: '输入不正确', icon: 'none' })
          }
        }
      }
    })
  },

  async doCancelAccount() {
    wx.showLoading({ title: '正在注销...', mask: true })

    try {
      const openid = app.globalData.openid

      try {
        const dataManager = app.getDataManager()
        if (dataManager && typeof dataManager.clearCloudData === 'function') {
          await dataManager.clearCloudData(openid)
        }
      } catch (e) {
        console.warn('清除云端数据失败:', e)
      }

      wx.clearStorageSync()

      app.globalData.isLoggedIn = false
      app.globalData.openid = ''
      app.globalData.userInfo = null
      app.globalData.bills = []

      wx.hideLoading()
      wx.showToast({ title: '账号已注销', icon: 'success', duration: 1500 })

      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' })
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('注销失败:', error)
      wx.showToast({ title: '注销失败，请重试', icon: 'none' })
    }
  },

  logout() {
    wx.vibrateShort({ type: 'light' })
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.globalData.isLoggedIn = false
          app.globalData.openid = ''
          app.globalData.userInfo = null
          wx.removeStorageSync('isLoggedIn')
          wx.removeStorageSync('openid')
          wx.removeStorageSync('userInfo')
          wx.reLaunch({ url: '/pages/login/login' })
        }
      }
    })
  }
})

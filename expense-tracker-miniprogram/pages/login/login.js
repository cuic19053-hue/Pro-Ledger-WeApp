const app = getApp()

Page({
  data: {
    isLoading: false,
    agreement: false,
    openid: '',
    avatarUrl: '',
    nickName: ''
  },

  onLoad() {
    this.checkLoginStatus()
    this.getOpenid()
  },

  onShow() {
    if (app.globalData.isLoggedIn) {
      wx.switchTab({ url: '/pages/home/home' })
    }
  },

  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    if (isLoggedIn) {
      wx.switchTab({ url: '/pages/home/home' })
    }
  },

  async getOpenid() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'getOpenid' }
      })

      if (res.result && res.result.openid) {
        this.setData({ openid: res.result.openid })
      } else {
        this.setData({ openid: 'temp_' + Date.now() })
      }
    } catch (error) {
      this.setData({ openid: 'local_' + Date.now() })
    }
  },

  toggleAgreement() {
    this.setData({ agreement: !this.data.agreement })
  },

  viewAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  viewPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({ avatarUrl: avatarUrl })
  },

  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value })
  },

  async handleWechatLogin() {
    const { isLoading, agreement, openid, avatarUrl, nickName } = this.data

    if (isLoading) return

    if (!agreement) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none', duration: 2000 })
      return
    }

    this.setData({ isLoading: true })
    wx.showLoading({ title: '正在登录...', mask: true })

    try {
      const loginRes = await wx.login()

      if (!loginRes.code) {
        throw new Error('微信授权失败')
      }

      const finalNickName = nickName || '微信用户'
      const finalAvatarUrl = avatarUrl || ''

      const wechatResult = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'wechatLogin',
          code: loginRes.code,
          userInfo: {
            nickName: finalNickName,
            avatarUrl: finalAvatarUrl
          },
          openid: openid
        }
      })

      if (!wechatResult.result || !wechatResult.result.success) {
        throw new Error(wechatResult.result?.message || '登录失败')
      }

      const finalOpenid = wechatResult.result.openid || openid
      const savedUserInfo = wechatResult.result.userInfo || {
        nickName: finalNickName,
        avatarUrl: finalAvatarUrl,
        openid: finalOpenid,
        loginType: 'wechat'
      }

      app.globalData.isLoggedIn = true
      app.globalData.openid = finalOpenid
      app.globalData.userInfo = savedUserInfo

      wx.setStorageSync('isLoggedIn', true)
      wx.setStorageSync('openid', finalOpenid)
      wx.setStorageSync('userInfo', savedUserInfo)

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success', duration: 1200 })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 1200)
    } catch (error) {
      wx.hideLoading()
      console.error('[Login] 登录失败:', error)
      wx.showToast({ title: '登录失败，请重试', icon: 'none', duration: 2500 })
    } finally {
      this.setData({ isLoading: false })
    }
  }
})
const app = getApp()

Page({
  data: {},

  onLoad() {
    this.checkLoginAndRedirect()
  },

  checkLoginAndRedirect() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn')

    setTimeout(() => {
      if (isLoggedIn) {
        wx.switchTab({
          url: '/pages/home/home',
          fail: () => {
            wx.reLaunch({ url: '/pages/home/home' })
          }
        })
      } else {
        wx.redirectTo({
          url: '/pages/login/login',
          fail: () => {
            wx.reLaunch({ url: '/pages/login/login' })
          }
        })
      }
    }, 1500)
  }
})
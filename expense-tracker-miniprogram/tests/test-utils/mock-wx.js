// 模拟微信小程序API
const mockWx = {
  // 存储相关
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  clearStorageSync: jest.fn(),
  
  // 界面相关
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  showActionSheet: jest.fn(),
  
  // 网络相关
  request: jest.fn(),
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  
  // 云开发
  cloud: {
    callFunction: jest.fn(),
    uploadFile: jest.fn(),
    database: jest.fn(() => ({
      collection: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          add: jest.fn()
        })),
        doc: jest.fn(() => ({
          get: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          set: jest.fn()
        })),
        add: jest.fn(),
        get: jest.fn()
      }))
    }))
  },
  
  // 登录相关
  login: jest.fn(),
  getUserProfile: jest.fn(),
  
  // 导航相关
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  redirectTo: jest.fn(),
  
  // 设备相关
  vibrateShort: jest.fn(),
  getSystemInfoSync: jest.fn(() => ({
    pixelRatio: 2,
    screenWidth: 375,
    screenHeight: 667
  })),
  
  // Canvas相关
  createSelectorQuery: jest.fn(() => ({
    select: jest.fn(() => ({
      fields: jest.fn(() => ({
        exec: jest.fn()
      }))
    }))
  }))
}

// 模拟 getApp - 每次都返回同一个实例
const sharedApp = {
  globalData: {
    isLoggedIn: false,
    openid: null,
    userInfo: null,
    bills: [],
    categories: {
      expense: [
        { id: 'food', name: '餐饮', icon: '🍽️' },
        { id: 'transport', name: '交通', icon: '🚗' },
        { id: 'shopping', name: '购物', icon: '🛍️' }
      ],
      income: [
        { id: 'salary', name: '工资', icon: '💰' },
        { id: 'bonus', name: '奖金', icon: '🎁' }
      ]
    },
    budget: {
      total: 5000,
      categories: {}
    }
  },
  getDataManager: jest.fn()
}

const mockGetApp = jest.fn(() => sharedApp)

module.exports = { mockWx, mockGetApp }
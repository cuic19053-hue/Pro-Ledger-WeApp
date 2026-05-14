// Jest 测试环境设置
const { mockWx, mockGetApp } = require('./test-utils/mock-wx')

// 设置全局模拟对象
global.wx = mockWx
global.getApp = mockGetApp

// 模拟小程序 Page 函数
global.Page = jest.fn((options) => {
  const page = {
    data: { ...options.data } || {}
  }
  
  // 复制所有属性和方法
  Object.keys(options).forEach(key => {
    if (key === 'data') return
    if (typeof options[key] === 'function') {
      const originalFn = options[key]
      // 创建代理函数，自动绑定 this 到 page
      const proxyFn = function(...args) {
        return originalFn.call(page, ...args)
      }
      // 如果是 jest.fn()，复制 mock 属性
      if (originalFn._isMockFunction) {
        proxyFn._isMockFunction = true
        proxyFn.mock = originalFn.mock
        // 代理 mock 方法到原始函数
        proxyFn.mockClear = () => { originalFn.mockClear(); return proxyFn }
        proxyFn.mockReset = () => { originalFn.mockReset(); return proxyFn }
        proxyFn.mockImplementation = (fn) => { originalFn.mockImplementation(fn); return proxyFn }
        proxyFn.mockReturnValue = (val) => { originalFn.mockReturnValue(val); return proxyFn }
        proxyFn.mockResolvedValue = (val) => { originalFn.mockResolvedValue(val); return proxyFn }
        proxyFn.mockRejectedValue = (val) => { originalFn.mockRejectedValue(val); return proxyFn }
      }
      page[key] = proxyFn
    } else {
      page[key] = options[key]
    }
  })
  
  // 确保 setData 正确工作
  if (!page.setData) {
    page.setData = function(newData) {
      Object.assign(this.data, newData)
    }
  }
  
  return page
})

// 模拟 console 方法
console.log = jest.fn()
console.error = jest.fn()
console.warn = jest.fn()

// 模拟 Date 对象
const RealDate = Date
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      return new RealDate('2024-01-15T12:00:00Z')
    }
    return new RealDate(...args)
  }
  
  static now() {
    return new RealDate('2024-01-15T12:00:00Z').getTime()
  }
}

// 模拟 setTimeout 和 setInterval
global.setTimeout = jest.fn((fn, delay) => {
  fn()
  return 1
})

global.setInterval = jest.fn((fn, delay) => {
  return 2
})

global.clearTimeout = jest.fn()
global.clearInterval = jest.fn()

// 模拟 Math.random 以获得可预测的结果
const mockRandom = jest.fn()
let randomCounter = 0
mockRandom.mockImplementation(() => {
  const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
  return values[randomCounter++ % values.length]
})
global.Math.random = mockRandom
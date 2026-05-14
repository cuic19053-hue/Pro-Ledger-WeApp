// 工具函数单元测试
const { formatAmount, getRelativeTime, validateAmount } = require('../../utils/helpers')

// 金额格式化测试
describe('formatAmount 函数测试', () => {
  test('金额为0时返回0.00', () => {
    expect(formatAmount(0)).toBe('0.00')
    expect(formatAmount('0')).toBe('0.00')
  })

  test('正常金额格式化', () => {
    expect(formatAmount(123.456)).toBe('123.46')
    expect(formatAmount('123.456')).toBe('123.46')
  })

  test('大金额格式化（万/亿）', () => {
    expect(formatAmount(123456)).toBe('12.35万')
    expect(formatAmount(123456789)).toBe('1.23亿')
  })

  test('带前缀格式化', () => {
    expect(formatAmount(123.45, { prefix: '¥' })).toBe('¥123.45')
    expect(formatAmount(123456, { prefix: '¥' })).toBe('¥12.35万')
  })

  test('自定义小数位数', () => {
    expect(formatAmount(123.4567, { decimalPlaces: 3 })).toBe('123.457')
    expect(formatAmount(123, { decimalPlaces: 0 })).toBe('123')
  })

  test('无效金额处理', () => {
    expect(formatAmount('abc')).toBe('0.00')
    expect(formatAmount(null)).toBe('0.00')
    expect(formatAmount(undefined)).toBe('0.00')
  })
})

// 相对时间测试
describe('getRelativeTime 函数测试', () => {
  const originalDate = global.Date
  
  beforeEach(() => {
    // 模拟固定时间
    const mockDate = new Date('2024-01-15T12:00:00Z')
    global.Date = jest.fn(() => mockDate)
    global.Date.now = jest.fn(() => mockDate.getTime())
    
    // 重写 Date 构造函数以正确处理参数
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate('2024-01-15T12:00:00Z')
        }
        return new originalDate(...args)
      }
    }
    global.Date.now = () => new originalDate('2024-01-15T12:00:00Z').getTime()
  })

  afterEach(() => {
    global.Date = originalDate
  })

  test('刚刚', () => {
    const time = new Date('2024-01-15T11:59:30Z')
    expect(getRelativeTime(time.toISOString())).toBe('刚刚')
  })

  test('几分钟前', () => {
    const time = new Date('2024-01-15T11:55:00Z')
    expect(getRelativeTime(time.toISOString())).toBe('5分钟前')
  })

  test('几小时前', () => {
    const time = new Date('2024-01-15T09:00:00Z')
    expect(getRelativeTime(time.toISOString())).toBe('3小时前')
  })

  test('昨天', () => {
    const time = new Date('2024-01-14T12:00:00Z')
    expect(getRelativeTime(time.toISOString())).toBe('昨天')
  })

  test('几天前', () => {
    const time = new Date('2024-01-13T12:00:00Z')
    expect(getRelativeTime(time.toISOString())).toBe('2天前')
  })

  test('一周前显示日期', () => {
    const time = new Date('2024-01-08T12:00:00Z')
    const result = getRelativeTime(time.toISOString())
    // 验证返回的是日期格式（月份和日期可能为1位或2位）
    expect(result).toMatch(/^\d{4}-\d{1,2}-\d{1,2}$/)
  })
})

// 金额验证测试
describe('validateAmount 函数测试', () => {
  test('有效金额', () => {
    expect(validateAmount('123.45')).toBe(true)
    expect(validateAmount('0.01')).toBe(true)
    expect(validateAmount('9999999.99')).toBe(true)
  })

  test('无效金额', () => {
    expect(validateAmount('0')).toBe(false)
    expect(validateAmount('-123')).toBe(false)
    expect(validateAmount('10000000')).toBe(false)
    expect(validateAmount('abc')).toBe(false)
    expect(validateAmount('12.345')).toBe(false) // 超过2位小数
  })

  test('边界值测试', () => {
    expect(validateAmount('0.01')).toBe(true)
    expect(validateAmount('0.009')).toBe(false)
    expect(validateAmount('9999999.99')).toBe(true)
    expect(validateAmount('10000000')).toBe(false)
  })
})

console.log('✅ 工具函数单元测试完成')
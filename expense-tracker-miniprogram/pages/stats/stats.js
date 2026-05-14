const app = getApp()

Page({
  data: {
    chartData: { labels: [], data: [] },
    hasData: false,
    totalExpense: 0,
    totalIncome: 0,
    avgExpense: 0,
    maxExpense: 0,
    maxExpenseMonth: '',
    labels: [],
    categoryStats: [],
    incomeCategoryStats: [],
    tooltipTop: 0,
    tooltipLeft: 0,
    tooltipOpacity: 0,
    tooltipAmount: '',
    totalExpenseDisplay: '¥0.00',
    totalIncomeDisplay: '¥0.00',
    avgExpenseDisplay: '¥0.00',
    maxExpenseDisplay: '¥0.00',
    activeTab: 'expense'
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const now = new Date()
    const expenseData = []
    const incomeData = []
    const monthLabels = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      const monthLabel = `${month + 1}月`
      
      const stats = app.getMonthlyStats(year, month)
      expenseData.push(stats.expense || 0)
      incomeData.push(stats.income || 0)
      monthLabels.push(monthLabel)
    }
    
    const totalExpense = expenseData.reduce((sum, val) => sum + val, 0)
    const totalIncome = incomeData.reduce((sum, val) => sum + val, 0)
    
    if (totalExpense === 0 && totalIncome === 0) {
      this.setData({
        hasData: false,
        labels: monthLabels,
        totalExpenseDisplay: '¥0.00',
        totalIncomeDisplay: '¥0.00',
        avgExpenseDisplay: '¥0.00',
        maxExpenseDisplay: '¥0.00',
        maxExpenseMonth: '',
        categoryStats: [],
        incomeCategoryStats: []
      })
      return
    }
    
    const avgExpense = totalExpense / expenseData.length
    const maxExpense = Math.max(...expenseData)
    const maxIndex = expenseData.indexOf(maxExpense)
    const maxExpenseMonth = monthLabels[maxIndex]
    
    const categoryStats = this.loadCategoryStats(now.getFullYear(), now.getMonth())
    const incomeCategoryStats = this.loadIncomeCategoryStats(now.getFullYear(), now.getMonth())
    
    this.setData({
      chartData: { labels: monthLabels, data: expenseData, incomeData: incomeData },
      hasData: true,
      totalExpense: totalExpense,
      totalExpenseDisplay: '¥' + totalExpense.toFixed(2),
      totalIncome: totalIncome,
      totalIncomeDisplay: '¥' + totalIncome.toFixed(2),
      avgExpense: avgExpense,
      avgExpenseDisplay: '¥' + avgExpense.toFixed(2),
      maxExpense: maxExpense,
      maxExpenseDisplay: '¥' + maxExpense.toFixed(2),
      maxExpenseMonth: maxExpenseMonth,
      labels: monthLabels,
      categoryStats: categoryStats,
      incomeCategoryStats: incomeCategoryStats
    })
    
    setTimeout(() => {
      this.drawLineChart()
    }, 100)
  },

  loadCategoryStats(year, month) {
    const stats = app.getCategoryStats(year, month)
    const categories = app.globalData.categories.expense

    const result = []
    let maxAmount = 0

    Object.keys(stats).forEach(key => {
      const category = categories.find(c => c.id === key)
      if (category && stats[key].amount > 0) {
        result.push({
          id: key,
          name: category.name,
          icon: category.icon,
          amount: stats[key].amount,
          amountDisplay: '¥' + stats[key].amount.toFixed(2),
          count: stats[key].count
        })
        if (stats[key].amount > maxAmount) {
          maxAmount = stats[key].amount
        }
      }
    })

    result.sort((a, b) => b.amount - a.amount)

    return result.map(item => ({
      ...item,
      percent: maxAmount > 0 ? Math.round((item.amount / maxAmount) * 100) : 0
    }))
  },

  loadIncomeCategoryStats(year, month) {
    const dataManager = app.getDataManager()
    const allBills = dataManager.getBills()

    const monthBills = allBills.filter(bill => {
      const d = new Date(bill.date)
      return d.getFullYear() === year && d.getMonth() === month && bill.type === 'income'
    })

    const stats = {}
    monthBills.forEach(bill => {
      if (!stats[bill.category]) {
        stats[bill.category] = { amount: 0, count: 0 }
      }
      stats[bill.category].amount += parseFloat(bill.amount)
      stats[bill.category].count += 1
    })

    const categories = app.globalData.categories.income
    const result = []
    let maxAmount = 0

    Object.keys(stats).forEach(key => {
      const category = categories.find(c => c.id === key)
      if (category && stats[key].amount > 0) {
        result.push({
          id: key,
          name: category.name,
          icon: category.icon,
          amount: stats[key].amount,
          amountDisplay: '¥' + stats[key].amount.toFixed(2),
          count: stats[key].count
        })
        if (stats[key].amount > maxAmount) {
          maxAmount = stats[key].amount
        }
      }
    })

    result.sort((a, b) => b.amount - a.amount)

    return result.map(item => ({
      ...item,
      percent: maxAmount > 0 ? Math.round((item.amount / maxAmount) * 100) : 0
    }))
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  drawLineChart() {
    const query = wx.createSelectorQuery()
    query.select('#lineChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const width = res[0].width
        const height = res[0].height
        const { labels, data } = this.data.chartData

        const padding = 32
        const chartWidth = width - padding * 2
        const chartHeight = height - padding * 2

        const maxValue = Math.max(...data) * 1.1 || 1
        const minValue = Math.min(...data) * 0.9

        const points = data.map((value, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth
          const y = padding + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight
          return { x, y, value }
        })

        for (let i = 0; i < 4; i++) {
          const y = padding + (chartHeight / 3) * i
          ctx.strokeStyle = '#E7DED2'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(padding, y)
          ctx.lineTo(width - padding, y)
          ctx.stroke()
        }

        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
        gradient.addColorStop(0, 'rgba(22, 124, 116, 0.18)')
        gradient.addColorStop(1, 'rgba(22, 124, 116, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(points[0].x, height - padding)
        ctx.lineTo(points[0].x, points[0].y)

        for (let i = 0; i < points.length - 1; i++) {
          const p0 = i > 0 ? points[i - 1] : points[i]
          const p1 = points[i]
          const p2 = points[i + 1]
          const p3 = i < points.length - 2 ? points[i + 2] : p2

          const cp1x = p1.x + (p2.x - p0.x) / 6
          const cp1y = p1.y + (p2.y - p0.y) / 6
          const cp2x = p2.x - (p3.x - p1.x) / 6
          const cp2y = p2.y - (p3.y - p1.y) / 6

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
        }

        ctx.lineTo(points[points.length - 1].x, height - padding)
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = '#167C74'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)

        for (let i = 0; i < points.length - 1; i++) {
          const p0 = i > 0 ? points[i - 1] : points[i]
          const p1 = points[i]
          const p2 = points[i + 1]
          const p3 = i < points.length - 2 ? points[i + 2] : p2

          const cp1x = p1.x + (p2.x - p0.x) / 6
          const cp1y = p1.y + (p2.y - p0.y) / 6
          const cp2x = p2.x - (p3.x - p1.x) / 6
          const cp2y = p2.y - (p3.y - p1.y) / 6

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
        }

        ctx.stroke()

        points.forEach((point) => {
          ctx.fillStyle = '#167C74'
          ctx.beginPath()
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
          ctx.fill()

          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(point.x, point.y, 2.5, 0, 2 * Math.PI)
          ctx.fill()
        })

        this.chartPoints = points
      })
  },

  onChartTouchMove(e) {
    if (!this.chartPoints) return

    const touch = e.touches[0]
    const query = wx.createSelectorQuery()

    query.select('.chart-container').boundingClientRect((rect) => {
      if (!rect) return

      const x = touch.clientX - rect.left
      let nearestIndex = 0
      let minDistance = Infinity

      this.chartPoints.forEach((point, index) => {
        const distance = Math.abs(point.x - x)
        if (distance < minDistance) {
          minDistance = distance
          nearestIndex = index
        }
      })

      const nearestPoint = this.chartPoints[nearestIndex]

      this.setData({
        tooltipTop: nearestPoint.y / 2 - 20,
        tooltipLeft: nearestPoint.x - 40,
        tooltipOpacity: 1,
        tooltipAmount: '¥' + nearestPoint.value.toFixed(2)
      })
    }).exec()
  },

  onChartTouchEnd() {
    this.setData({
      tooltipOpacity: 0
    })
  }
})

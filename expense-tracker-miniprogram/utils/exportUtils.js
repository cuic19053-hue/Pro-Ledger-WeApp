const { formatAmount } = require('./helpers.js')

function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function generateCSV(bills, categories) {
  if (!bills || bills.length === 0) {
    return null
  }

  const allCategories = [...categories.expense, ...categories.income]
  const header = ['日期', '类型', '分类', '金额(元)', '备注'].join(',') + '\n'

  const rows = bills.map(bill => {
    const category = allCategories.find(c => c.id === bill.category)
    const categoryName = category ? category.name : '其他'
    const typeText = bill.type === 'expense' ? '支出' : '收入'
    const dateStr = bill.date ? formatDate(new Date(bill.date)) : ''
    const amount = formatAmount(bill.amount)
    const remark = (bill.remark || '').replace(/"/g, '""')

    return `"${dateStr}","${typeText}","${categoryName}","${amount}","${remark}"`
  })

  return '\uFEFF' + header + rows.join('\n')
}

function exportToCSV(bills, categories) {
  try {
    const csvContent = generateCSV(bills, categories)
    if (!csvContent) {
      wx.showToast({
        title: '没有可导出的数据',
        icon: 'none'
      })
      return false
    }

    const fs = wx.getFileSystemManager()
    const userDataPath = wx.env && wx.env.USER_DATA_PATH ? wx.env.USER_DATA_PATH : ''

    if (!userDataPath) {
      console.error('无法获取用户数据路径')
      wx.showToast({
        title: '导出失败：路径无效',
        icon: 'none'
      })
      return false
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const fileName = `账单导出_${dateStr}.csv`
    const filePath = `${userDataPath}/${fileName}`

    fs.writeFileSync(filePath, csvContent, 'utf8')

    wx.openDocument({
      filePath: filePath,
      fileType: 'csv',
      showMenu: true,
      success: () => {
        wx.showToast({
          title: '导出成功',
          icon: 'success'
        })
      },
      fail: (error) => {
        console.error('打开文件失败:', error)
        wx.showToast({
          title: '导出成功，可在文件中查看',
          icon: 'none',
          duration: 2000
        })
      }
    })

    return true
  } catch (error) {
    console.error('导出失败:', error)
    wx.showToast({
      title: '导出失败',
      icon: 'none'
    })
    return false
  }
}

module.exports = {
  exportToCSV,
  generateCSV
}
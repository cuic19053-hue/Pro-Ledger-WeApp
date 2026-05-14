Page({
  data: {
    faqList: [
      {
        id: 1,
        question: '如何开始记账？',
        answer: '点击首页底部的"记一笔"按钮，或点击快捷分类（餐饮、购物等）即可快速记账。也可以通过底部导航栏的"记账"页面进行详细记账。',
        expanded: false
      },
      {
        id: 2,
        question: '如何添加自定义分类？',
        answer: '在记账页面，点击分类区域右上角的"+"按钮，输入分类名称并选择图标即可创建自定义分类。自定义分类会自动保存。',
        expanded: false
      },
      {
        id: 3,
        question: '如何编辑或删除账单？',
        answer: '在账单列表中点击任意账单即可进入详情页，详情页支持编辑和删除操作。编辑后数据会立即同步。',
        expanded: false
      },
      {
        id: 4,
        question: '预算功能怎么使用？',
        answer: '进入"我的"→"预算管理"，可以设置每月总预算和各分类预算。系统会自动计算已使用金额和剩余额度，超支时会显示警告。',
        expanded: false
      },
      {
        id: 5,
        question: '如何导出我的记账数据？',
        answer: '进入"我的"页面，点击"数据导出"，可选择导出为 CSV 格式（可用 Excel 打开）或 JSON 格式（完整备份数据）。导出的文件会自动打开或保存到手机。',
        expanded: false
      },
      {
        id: 6,
        question: '数据存储在哪里？安全吗？',
        answer: '您的数据同时保存在本地和微信云数据库中。登录后数据会自动同步到云端，即使换手机也能恢复数据。所有数据都经过加密传输。',
        expanded: false
      }
    ]
  },

  toggleFaq(e) {
    const index = e.currentTarget.dataset.index
    const faqList = this.data.faqList.map((item, i) => {
      if (i === index) {
        return { ...item, expanded: !item.expanded }
      }
      return item
    })
    this.setData({ faqList })
  },

  goToFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '请描述您遇到的问题或建议（我们会认真阅读每一条反馈）',
      editable: true,
      placeholderText: '请输入您的反馈...',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showToast({
            title: '感谢您的反馈！',
            icon: 'success'
          })
        }
      }
    })
  }
})
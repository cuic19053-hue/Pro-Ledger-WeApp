const OFFLINE_QUEUE_KEY = 'offline_queue'

class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue()
  }

  loadQueue() {
    try {
      const stored = wx.getStorageSync(OFFLINE_QUEUE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('加载离线队列失败:', e)
    }
    return []
  }

  saveQueue() {
    try {
      wx.setStorageSync(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue))
    } catch (e) {
      console.error('保存离线队列失败:', e)
    }
  }

  add(action, data) {
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    }
    this.queue.push(item)
    this.saveQueue()
    return item.id
  }

  remove(id) {
    this.queue = this.queue.filter(item => item.id !== id)
    this.saveQueue()
  }

  getAll() {
    return [...this.queue]
  }

  size() {
    return this.queue.length
  }

  async processQueue(dataManager) {
    if (this.queue.length === 0) return { success: 0, failed: 0 }

    const failed = []
    let successCount = 0

    for (const item of this.queue) {
      try {
        switch (item.action) {
          case 'addBill':
            await dataManager.addBill(item.data)
            this.remove(item.id)
            successCount++
            break
          case 'deleteBill':
            await dataManager.deleteBill(item.data.billId)
            this.remove(item.id)
            successCount++
            break
          default:
            console.warn('未知离线操作:', item.action)
            this.remove(item.id)
        }
      } catch (error) {
        console.error('处理离线操作失败:', item, error)
        item.retries++
        if (item.retries >= 3) {
          failed.push(item.id)
          this.remove(item.id)
        } else {
          this.saveQueue()
        }
      }
    }

    return { success: successCount, failed: failed.length }
  }
}

const offlineQueue = new OfflineQueue()

module.exports = offlineQueue
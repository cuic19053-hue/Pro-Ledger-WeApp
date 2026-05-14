function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}

function formatNumberWithCommas(num) {
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

class AnimationManager {
  constructor() {
    this.animations = new Map()
    this.nextId = 0
  }

  generateId() {
    return ++this.nextId
  }

  animate(element, start, end, duration, options = {}) {
    const id = this.generateId()

    if (this.animations.has(id)) {
      this.cancel(id)
    }

    const {
      onUpdate,
      onComplete,
      decimalPlaces = 2,
      prefix = '',
      suffix = '',
      dataKey = 'value'
    } = options

    if (typeof end !== 'number') {
      console.error('animateNumber: end value must be a number')
      return { id, cancel: () => this.cancel(id) }
    }

    const animationState = {
      id,
      element,
      startTime: Date.now(),
      start,
      end,
      duration,
      timerId: null,
      cancelled: false
    }

    const tick = () => {
      if (animationState.cancelled) return

      const now = Date.now()
      const elapsed = now - animationState.startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOut(progress)
      const currentValue = start + (end - start) * easedProgress

      const formattedValue = formatNumberWithCommas(currentValue.toFixed(decimalPlaces))
      const displayValue = prefix + formattedValue + suffix

      if (onUpdate) {
        onUpdate(displayValue)
      }

      if (element && element.setData) {
        element.setData({
          [dataKey]: displayValue
        })
      }

      if (progress < 1 && !animationState.cancelled) {
        animationState.timerId = setTimeout(tick, 16)
      } else if (!animationState.cancelled) {
        const finalFormattedValue = formatNumberWithCommas(end.toFixed(decimalPlaces))
        const finalDisplayValue = prefix + finalFormattedValue + suffix

        if (onComplete) {
          onComplete(finalDisplayValue)
        }

        if (element && element.setData) {
          element.setData({
            [dataKey]: finalDisplayValue
          })
        }

        this.animations.delete(id)
      }
    }

    animationState.timerId = setTimeout(tick, 16)
    this.animations.set(id, animationState)

    return {
      id,
      cancel: () => this.cancel(id)
    }
  }

  cancel(id) {
    const animation = this.animations.get(id)
    if (animation) {
      animation.cancelled = true
      if (animation.timerId) {
        clearTimeout(animation.timerId)
        animation.timerId = null
      }
      this.animations.delete(id)
      return true
    }
    return false
  }

  cancelAll() {
    this.animations.forEach(animation => {
      animation.cancelled = true
      if (animation.timerId) {
        clearTimeout(animation.timerId)
        animation.timerId = null
      }
    })
    this.animations.clear()
  }
}

const animationManager = new AnimationManager()

function animateNumber(element, start, end, duration, options = {}) {
  return animationManager.animate(element, start, end, duration, options)
}

animateNumber.options = function(options) {
  return animationManager.animate(
    options.element,
    options.start || 0,
    options.end,
    options.duration || 1000,
    options
  )
}

animateNumber.cancelAll = function() {
  animationManager.cancelAll()
}

animateNumber.cancel = function(id) {
  return animationManager.cancel(id)
}

module.exports = {
  animateNumber,
  formatNumberWithCommas
}
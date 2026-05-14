/**
 * 动画工具函数
 * 提供通用的动画方法和配置
 */

const AnimationUtils = {
  EASING: {
    LINEAR: 'linear',
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    ELASTIC: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    DELAY: 100
  },

  createAnimation(options = {}) {
    const {
      duration = this.DURATION.NORMAL,
      timingFunction = this.EASING.SMOOTH,
      delay = 0
    } = options;

    return wx.createAnimation({
      duration,
      timingFunction,
      delay
    });
  },

  fadeIn(animation, duration = 300) {
    return animation
      .opacity(1)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  fadeOut(animation, duration = 300) {
    return animation
      .opacity(0)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  scaleIn(animation, duration = 300) {
    return animation
      .scale(1)
      .opacity(1)
      .step({
        duration,
        timingFunction: this.EASING.ELASTIC
      });
  },

  scaleOut(animation, duration = 300) {
    return animation
      .scale(0.8)
      .opacity(0)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  slideUp(animation, duration = 300) {
    return animation
      .translateY(0)
      .opacity(1)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  slideDown(animation, duration = 300) {
    return animation
      .translateY(40)
      .opacity(0)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  slideLeft(animation, duration = 300) {
    return animation
      .translateX(0)
      .opacity(1)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  slideRight(animation, duration = 300) {
    return animation
      .translateX(40)
      .opacity(0)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  bounce(animation, duration = 500) {
    return animation
      .scale(1.1)
      .step({
        duration: duration / 2,
        timingFunction: this.EASING.EASE_OUT
      })
      .scale(1)
      .step({
        duration: duration / 2,
        timingFunction: this.EASING.BOUNCE
      });
  },

  shake(animation, duration = 400) {
    const shakeDuration = duration / 4;
    return animation
      .translateX(-10)
      .step({
        duration: shakeDuration,
        timingFunction: this.EASING.EASE_IN_OUT
      })
      .translateX(10)
      .step({
        duration: shakeDuration,
        timingFunction: this.EASING.EASE_IN_OUT
      })
      .translateX(-10)
      .step({
        duration: shakeDuration,
        timingFunction: this.EASING.EASE_IN_OUT
      })
      .translateX(0)
      .step({
        duration: shakeDuration,
        timingFunction: this.EASING.EASE_IN_OUT
      });
  },

  rotate(animation, angle = 360, duration = 500) {
    return animation
      .rotate(angle)
      .step({
        duration,
        timingFunction: this.EASING.SMOOTH
      });
  },

  pulse(animation, duration = 1000) {
    return animation
      .scale(1.05)
      .step({
        duration: duration / 2,
        timingFunction: this.EASING.EASE_IN_OUT
      })
      .scale(1)
      .step({
        duration: duration / 2,
        timingFunction: this.EASING.EASE_IN_OUT
      });
  },

  createStaggerAnimation(count, baseDelay = 60) {
    const animations = [];
    for (let i = 0; i < count; i++) {
      animations.push({
        delay: i * baseDelay,
        style: `animation-delay: ${i * baseDelay}ms`
      });
    }
    return animations;
  },

  getRandomDelay(min = 0, max = 200) {
    return Math.random() * (max - min) + min;
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

module.exports = AnimationUtils;

// 粒子背景组件

Component({
  properties: {
    showParticles: {
      type: Boolean,
      value: true
    },
    particleCount: {
      type: Number,
      value: 30
    },
    particleColor: {
      type: String,
      value: 'rgba(34, 197, 94, 0.3)'
    },
    particleMaxSize: {
      type: Number,
      value: 8
    }
  },

  data: {
    particles: []
  },

  lifetimes: {
    attached() {
      this.initCanvas();
    },
    
    detached() {
      this.stopAnimation();
    }
  },

  methods: {
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('.particle-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            this.canvas = res[0].node;
            this.ctx = this.canvas.getContext('2d');
            this.dpr = wx.getSystemInfoSync().pixelRatio;
            
            this.canvas.width = res[0].width * this.dpr;
            this.canvas.height = res[0].height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);
            
            this.width = res[0].width;
            this.height = res[0].height;
            
            this.createParticles();
            this.startAnimation();
          }
        });
    },

    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.properties.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * this.properties.particleMaxSize + 2,
          alpha: Math.random() * 0.5 + 0.1
        });
      }
    },

    startAnimation() {
      this.animationId = requestAnimationFrame(() => this.animate());
    },

    stopAnimation() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    },

    animate() {
      if (!this.ctx) return;

      this.ctx.clearRect(0, 0, this.width, this.height);

      this.particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = this.width;
        if (particle.x > this.width) particle.x = 0;
        if (particle.y < 0) particle.y = this.height;
        if (particle.y > this.height) particle.y = 0;

        this.drawParticle(particle);

        this.drawConnections(particle, index);
      });

      this.animationId = requestAnimationFrame(() => this.animate());
    },

    drawParticle(particle) {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = this.properties.particleColor.replace('0.3', particle.alpha);
      this.ctx.fill();
    },

    drawConnections(particle, index) {
      for (let i = index + 1; i < this.particles.length; i++) {
        const other = this.particles[i];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(34, 197, 94, ${0.15 * (1 - distance / 150)})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }
  }
});

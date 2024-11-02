class Animations {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.animations = [];
    }

    // 添加水墨飞溅动画
    addSplashAnimation(x, y) {
        const splashParticles = [];
        for (let i = 0; i < 10; i++) {
            splashParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                opacity: 1,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        this.animations.push({
            type: 'splash',
            particles: splashParticles,
            duration: 60
        });
    }

    // 添加开场动画
    startGameAnimation() {
        const startAnim = {
            type: 'start',
            progress: 0,
            duration: 120,
            boatX: -100,
            targetX: this.game.boat.x
        };
        
        this.animations.push(startAnim);
        return new Promise(resolve => {
            startAnim.onComplete = resolve;
        });
    }

    // 添加结束动画
    endGameAnimation() {
        const endAnim = {
            type: 'end',
            progress: 0,
            duration: 120,
            boatY: this.game.boat.y,
            opacity: 1
        };
        
        this.animations.push(endAnim);
        return new Promise(resolve => {
            endAnim.onComplete = resolve;
        });
    }

    // 更新所有动画
    update() {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            
            switch (anim.type) {
                case 'splash':
                    this.updateSplashAnimation(anim);
                    break;
                case 'start':
                    this.updateStartAnimation(anim);
                    break;
                case 'end':
                    this.updateEndAnimation(anim);
                    break;
            }
            
            if (anim.duration <= 0) {
                if (anim.onComplete) {
                    anim.onComplete();
                }
                this.animations.splice(i, 1);
            }
        }
    }

    // 更新水墨飞溅动画
    updateSplashAnimation(anim) {
        anim.duration--;
        
        this.ctx.save();
        anim.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.opacity *= 0.95;
            
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(0, 0, 0, ${particle.opacity})`;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.fillRect(-particle.size/2, -particle.size/2, 
                            particle.size, particle.size);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        });
        this.ctx.restore();
    }

    // 更新开场动画
    updateStartAnimation(anim) {
        anim.progress++;
        anim.duration--;
        
        // 计算船只位置
        const progress = anim.progress / 120;
        const easedProgress = this.easeOutQuad(progress);
        this.game.boat.x = anim.boatX + (anim.targetX - anim.boatX) * easedProgress;
        
        // 添加水墨效果
        if (anim.progress % 5 === 0) {
            this.game.effects.addRipple(this.game.boat.x, this.game.boat.y + 30);
        }
    }

    // 更新结束动画
    updateEndAnimation(anim) {
        anim.progress++;
        anim.duration--;
        
        // 船只下沉效果
        const progress = anim.progress / 120;
        this.game.boat.y = anim.boatY + Math.sin(progress * Math.PI) * 50;
        
        // 淡出效果
        anim.opacity = 1 - progress;
        this.ctx.globalAlpha = anim.opacity;
    }

    // 缓动函数
    easeOutQuad(t) {
        return t * (2 - t);
    }

    // 检查是否有动画正在播放
    isPlaying() {
        return this.animations.length > 0;
    }
} 
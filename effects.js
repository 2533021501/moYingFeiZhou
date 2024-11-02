class Effects {
    constructor() {
        this.canvas = document.getElementById('effectCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化尺寸
        this.resize(window.innerWidth, window.innerHeight);
        
        this.ripples = [];
        this.inkEffects = [];
        this.shootEffects = [];
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    addRipple(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 2,
            maxRadius: 15,
            opacity: 0.3,
            speed: 0.8
        });
    }

    addInkEffect(x, y) {
        const fragments = [];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i / 12) + Math.random() * 0.5;
            const speed = 1 + Math.random() * 3;
            fragments.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                opacity: 0.8,
                rotation: Math.random() * Math.PI * 2,
                life: 40 + Math.random() * 20
            });
        }
        this.inkEffects.push({
            fragments: fragments,
            lifetime: 50
        });
    }

    addShootEffect(x, y) {
        const smokeParticles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 3) * Math.random() - Math.PI / 6;
            smokeParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (2 + Math.random() * 2),
                vy: Math.sin(angle) * (1 + Math.random()),
                radius: Math.random() * 3 + 2,
                opacity: 0.6 + Math.random() * 0.2,
                life: 30 + Math.random() * 20
            });
        }
        this.shootEffects.push({
            particles: smokeParticles,
            lifetime: 40
        });
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateRipples();
        this.updateShootEffects();
        this.updateInkEffects();
    }

    updateRipples() {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            ripple.radius += ripple.speed;
            ripple.opacity -= 0.01;

            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${ripple.opacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.stroke();

            if (ripple.radius >= ripple.maxRadius || ripple.opacity <= 0) {
                this.ripples.splice(i, 1);
            }
        }
    }

    updateShootEffects() {
        for (let i = this.shootEffects.length - 1; i >= 0; i--) {
            const effect = this.shootEffects[i];
            effect.lifetime--;

            effect.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.opacity *= 0.95;
                
                this.ctx.beginPath();
                this.ctx.fillStyle = `rgba(0, 0, 0, ${particle.opacity})`;
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.fill();
            });

            if (effect.lifetime <= 0) {
                this.shootEffects.splice(i, 1);
            }
        }
    }

    updateInkEffects() {
        for (let i = this.inkEffects.length - 1; i >= 0; i--) {
            const effect = this.inkEffects[i];
            effect.lifetime--;

            effect.fragments.forEach(fragment => {
                fragment.x += fragment.vx;
                fragment.y += fragment.vy;
                fragment.rotation += 0.1;
                fragment.opacity *= 0.95;
                
                this.ctx.save();
                this.ctx.translate(fragment.x, fragment.y);
                this.ctx.rotate(fragment.rotation);
                
                this.ctx.beginPath();
                this.ctx.moveTo(-fragment.size, -fragment.size);
                this.ctx.lineTo(fragment.size, -fragment.size/2);
                this.ctx.lineTo(fragment.size/2, fragment.size);
                this.ctx.lineTo(-fragment.size/2, fragment.size/2);
                this.ctx.closePath();
                
                this.ctx.fillStyle = `rgba(0, 0, 0, ${fragment.opacity})`;
                this.ctx.fill();
                
                this.ctx.restore();
            });

            if (effect.lifetime <= 0) {
                this.inkEffects.splice(i, 1);
            }
        }
    }
} 
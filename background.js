class Background {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化尺寸
        this.resize(window.innerWidth, window.innerHeight);
        
        // 调整河流参数
        this.riverBottom = this.canvas.height;                    // 河流底部直接到屏幕底部
        this.riverTop = this.canvas.height * 0.6;                // 河流顶部（从底部到屏幕的五分之二处）
        this.riverHeight = this.riverBottom - this.riverTop;     // 河流高度
        
        // 山脉参数
        this.mountains = [];
        this.generateMountains();
        
        // 动画参数
        this.scrollOffset = 0;
        this.waterFlowSpeed = 2;
    }

    generateMountains() {
        const mountains = [];
        // 生成3层山脉
        for (let i = 0; i < 3; i++) {
            let mountain = {
                points: [],
                height: 60 - i * 15,                  // 保持原来的高度
                baseY: this.riverTop - 80 - i * 30,   // 基准线上移40像素（从-40改为-80）
                opacity: 0.6 - i * 0.15,
                wavelength: 150 + i * 50,             // 保持原来的波长
                amplitude: 25 - i * 5                 // 保持原来的振幅
            };
            
            // 生成山的轮廓点
            for (let x = -100; x <= this.canvas.width + 100; x += 15) {
                let y = mountain.baseY - 
                    Math.sin(x / mountain.wavelength) * mountain.amplitude -
                    Math.random() * 15;  // 保持原来的随机变化幅度
                mountain.points.push({x, y});
            }
            
            mountains.push(mountain);
        }
        this.mountains = mountains;
        return mountains;
    }

    drawMountains() {
        // 从后往前绘制山脉
        [...this.mountains].reverse().forEach((mountain, index) => {
            this.ctx.save();
            
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.points[0].x, this.riverTop);
            
            mountain.points.forEach((point) => {
                const x = point.x - (this.scrollOffset * 0.05);
                this.ctx.lineTo(x, point.y);
            });
            
            this.ctx.lineTo(mountain.points[mountain.points.length-1].x, this.riverTop);
            this.ctx.closePath();
            
            // 根据层次调整颜色
            const layerBrightness = 240 - index * 15;  // 后面的山更暗
            this.ctx.fillStyle = `rgba(${layerBrightness}, ${layerBrightness}, ${layerBrightness}, ${mountain.opacity})`;
            this.ctx.fill();
            
            // 根据层次调整轮廓线的透明度
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${mountain.opacity * (0.5 + index * 0.1)})`; // 后面的山轮廓更明显
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // 添加水墨效果，根据层次调整
            for (let i = 0; i < mountain.points.length - 1; i += 4) {
                if (Math.random() > 0.8) {
                    const x = mountain.points[i].x - (this.scrollOffset * 0.05);
                    const y = mountain.points[i].y;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20);
                    this.ctx.strokeStyle = `rgba(0, 0, 0, ${mountain.opacity * (0.3 + index * 0.05)})`; // 后面的山水墨效果更明显
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        });
    }

    drawRiver() {
        this.ctx.save();
        
        // 创建河流渐变
        const riverGradient = this.ctx.createLinearGradient(0, this.riverTop, 0, this.riverBottom);
        riverGradient.addColorStop(0, 'rgba(240, 240, 240, 0.9)');
        riverGradient.addColorStop(1, 'rgba(220, 220, 220, 0.95)');
        
        // 绘制河流主体，向上延伸20像素
        this.ctx.fillStyle = riverGradient;
        this.ctx.fillRect(0, this.riverTop - 20, this.canvas.width, this.riverHeight + 20);  // 向上延伸20像素
        
        // 绘制流动的水纹
        const gridSize = 40;
        const rows = Math.ceil((this.riverHeight + 40) / gridSize) + 1;  // 调整行数以适应延伸
        
        // 从-1开始绘制，确保顶部有波浪，一直绘制到底部
        for (let row = -1; row <= rows; row++) {
            const y = this.riverTop + row * gridSize;
            
            const progress = (row + 1) / (rows + 1);
            const opacity = 0.12 - progress * 0.05;
            
            // 如果透明度太低就不绘制
            if (opacity <= 0.02) continue;
            
            // 水流动画偏移（从右向左）
            const flowOffset = (-this.scrollOffset * (1 + progress * 0.5)) % gridSize;
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
            this.ctx.lineWidth = 1.2;
            
            // 绘制水平流线，添加多重正弦波
            for (let x = 0; x < this.canvas.width; x += gridSize) {
                const waveOffset = 
                    Math.sin((x - this.scrollOffset) / 100) * 5 +
                    Math.sin((x - this.scrollOffset * 1.5) / 50) * 2 +
                    Math.sin((x - this.scrollOffset * 0.7) / 30) * 1 +
                    Math.random() * 2 - 1;
                
                this.ctx.moveTo(x + flowOffset, y + waveOffset);
                this.ctx.lineTo(x + gridSize + flowOffset, y + waveOffset);
            }
            
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 修改天空背景渐变
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.riverTop);
        skyGradient.addColorStop(0, '#e6e6e6');  // 远处更浅的灰色
        skyGradient.addColorStop(0.3, '#eeeeee'); // 中间过渡色
        skyGradient.addColorStop(1, '#f5f5f5');   // 近处更白一些
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.riverTop);
        
        // 先绘制山脉，后绘制河流
        this.drawMountains();
        this.drawRiver();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        // 重新计算河流参数
        this.riverBottom = this.canvas.height;                   // 直接到屏幕底部
        this.riverTop = this.canvas.height * 0.6;
        this.riverHeight = this.riverBottom - this.riverTop;
        
        // 重新生成山脉
        this.mountains = [];
        this.generateMountains();
    }

    update(gameSpeed) {
        this.scrollOffset += this.waterFlowSpeed * gameSpeed;
        this.draw();
    }
} 
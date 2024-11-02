class Game {
    constructor() {
        this.shootBtn = document.getElementById('shootBtn');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        const BOAT_WIDTH = 60;
        const BOAT_HEIGHT = 30;
        
        const riverBottom = this.canvas.height;
        const riverTop = this.canvas.height * 0.6;
        const riverHeight = riverBottom - riverTop;
        
        const boatBaseX = this.canvas.width * 0.33;
        const boatInitialY = riverTop + (riverHeight / 5);
        
        this.boat = {
            x: boatBaseX,
            y: boatInitialY,
            width: BOAT_WIDTH,
            height: BOAT_HEIGHT,
            speed: 5,
            tilt: 0,
            maxTilt: 15,
            sailWave: 0,
            sailWaveSpeed: 0.1,
            targetX: boatBaseX,
            baseX: boatBaseX,
            moveSpeed: 2,
            targetY: boatInitialY,
            velocityY: 0,
            acceleration: 0.5,
            friction: 0.92,
            maxSpeed: 8,
            velocityX: 0,
            accelerationX: 0.3,
            maxSpeedX: 5,
            riverTop: riverTop,
            riverBottom: this.canvas.height - BOAT_HEIGHT,
            initialY: boatInitialY,
            maxY: this.canvas.height - BOAT_HEIGHT,
            moveLeft: false,
            moveRight: false,
            isVisible: true,
            isRushing: false,  // 添加冲撞状态标记
        };
        
        this.score = 0;
        this.lastScoreTime = Date.now();
        this.scoreInterval = 100;
        this.health = 3;
        this.obstacles = [];
        this.gameSpeed = 2;
        this.obstacleSpawnRate = 120;
        this.frameCount = 0;
        this.isGameOver = false;
        
        this.background = new Background();
        this.effects = new Effects();
        
        this.audio = new AudioManager();
        
        this.setupControls();
        
        this.isRunning = false;
        this.isPaused = false;
        
        this.menuManager = new MenuManager(this);
        
        this.gameLoop = null;
        
        this.animations = new Animations(this);
        
        this.gameSpeed = 2;
        this.riverSpeed = 2;
        this.riverSpeedIncrement = 0.001;
        
        this.obstacleOpacity = 0.8;
        
        this.bullets = [];
        this.bulletSpeed = 10;
        this.canShoot = true;
        this.shootCooldown = 500;
        this.startTime = 0;
        
        this.turtleObstacles = [];  // 乌龟型障碍物数组
        this.isInvincible = false;  // 是否处于无敌状态
        this.invincibleTimer = 0;   // 无敌时间计时器
        this.invincibleDuration = 8000;  // 无敌持续时间（从5000改为8000，即8秒）
        this.normalGameSpeed = 2;    // 正常游戏速度
        this.boostGameSpeed = 4;     // 加速后的游戏速度
        this.turtleSpawnRate = 300;  // 乌龟生成频率
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.background) {
            this.background.resize(this.canvas.width, this.canvas.height);
        }
        if (this.effects) {
            this.effects.resize(this.canvas.width, this.canvas.height);
        }
    }

    setupControls() {
        let upPressed = false;
        let downPressed = false;
        let leftPressed = false;
        let rightPressed = false;
        
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const shootBtn = document.getElementById('shootBtn');

        const addTouchSupport = (button) => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.classList.add('active');
                
                if (button.id === 'upBtn') {
                    upPressed = true;
                    this.boat.tilt = -this.boat.maxTilt;
                } else if (button.id === 'downBtn') {
                    downPressed = true;
                    this.boat.tilt = this.boat.maxTilt;
                } else if (button.id === 'leftBtn') {
                    this.boat.moveLeft = true;
                } else if (button.id === 'rightBtn') {
                    this.boat.moveRight = true;
                }
            }, { passive: false });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.classList.remove('active');
                
                if (button.id === 'upBtn') {
                    upPressed = false;
                } else if (button.id === 'downBtn') {
                    downPressed = false;
                } else if (button.id === 'leftBtn') {
                    this.boat.moveLeft = false;
                } else if (button.id === 'rightBtn') {
                    this.boat.moveRight = false;
                }
            }, { passive: false });
        };

        [upBtn, downBtn, leftBtn, rightBtn].forEach(button => {
            addTouchSupport(button);
            
            button.addEventListener('mousedown', () => {
                button.classList.add('active');
                if (button === upBtn) {
                    upPressed = true;
                    this.boat.tilt = -this.boat.maxTilt;
                } else if (button === downBtn) {
                    downPressed = true;
                    this.boat.tilt = this.boat.maxTilt;
                } else if (button === leftBtn) {
                    this.boat.moveLeft = true;
                } else if (button === rightBtn) {
                    this.boat.moveRight = true;
                }
            });

            button.addEventListener('mouseup', () => {
                button.classList.remove('active');
                if (button === upBtn) {
                    upPressed = false;
                } else if (button === downBtn) {
                    downPressed = false;
                } else if (button === leftBtn) {
                    this.boat.moveLeft = false;
                } else if (button === rightBtn) {
                    this.boat.moveRight = false;
                }
            });
        });

        // 发按钮控制
        shootBtn.addEventListener('mousedown', () => {
            shootBtn.classList.add('active');
            if (this.canShoot) {
                this.shoot();
            }
        });

        shootBtn.addEventListener('mouseup', () => {
            shootBtn.classList.remove('active');
        });

        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            shootBtn.classList.add('active');
            if (this.canShoot) {
                this.shoot();
            }
        });

        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            shootBtn.classList.remove('active');
        });

        // 空格键控制
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.isPaused || this.isGameOver) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    upPressed = true;
                    this.boat.tilt = -this.boat.maxTilt;
                    upBtn.classList.add('active');
                    break;
                case 'ArrowDown':
                    downPressed = true;
                    this.boat.tilt = this.boat.maxTilt;
                    downBtn.classList.add('active');
                    break;
                case 'ArrowLeft':
                    this.boat.moveLeft = true;
                    leftBtn.classList.add('active');
                    break;
                case 'ArrowRight':
                    this.boat.moveRight = true;
                    rightBtn.classList.add('active');
                    break;
                case ' ':  // 空格键
                    shootBtn.classList.add('active');
                    if (this.canShoot) {
                        this.shoot();
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    upPressed = false;
                    upBtn.classList.remove('active');
                    break;
                case 'ArrowDown':
                    downPressed = false;
                    downBtn.classList.remove('active');
                    break;
                case 'ArrowLeft':
                    this.boat.moveLeft = false;
                    leftBtn.classList.remove('active');
                    break;
                case 'ArrowRight':
                    this.boat.moveRight = false;
                    rightBtn.classList.remove('active');
                    break;
                case ' ':  // 空格键
                    shootBtn.classList.remove('active');
                    break;
            }
        });

        setInterval(() => {
            if (upPressed) {
                this.boat.velocityY -= this.boat.acceleration;
            }
            if (downPressed) {
                this.boat.velocityY += this.boat.acceleration;
            }
            if (this.boat.moveLeft) {
                this.boat.velocityX -= this.boat.accelerationX;
            }
            if (this.boat.moveRight) {
                this.boat.velocityX += this.boat.accelerationX;
            }
        }, 16);
    }

    shoot() {
        if (!this.isRunning || this.isPaused || this.isGameOver) return;

        if (this.isInvincible) {
            // 在无敌状态下，射击键改为加速效果
            this.boat.velocityX += 12;  // 向右的猛烈推力
            this.boat.isRushing = true;  // 添加冲撞状态标记
            
            // 100ms后重置冲撞状态
            setTimeout(() => {
                this.boat.isRushing = false;
            }, 100);
            return;  // 不发射子弹
        }

        // 普通状态下的射击逻辑
        if (!this.canShoot) return;

        const bullet = {
            x: this.boat.x + this.boat.width,
            y: this.boat.y + this.boat.height/2,
            width: 10,
            height: 4,
            speed: this.bulletSpeed
        };
        
        this.bullets.push(bullet);
        this.effects.addShootEffect(bullet.x, bullet.y);
        this.audio.playShootSound();
        
        // 普通状态下的后坐力效果
        this.boat.velocityX -= 2;
        this.boat.velocityY += (Math.random() - 0.5) * 1;
        
        // 船头上抬效果
        this.boat.tilt = -8;
        
        this.canShoot = false;
        
        setTimeout(() => {
            this.canShoot = true;
        }, this.shootCooldown);
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.speed;
            
            for (let j = this.obstacles.length - 1; j >= 0; j--) {
                const obstacle = this.obstacles[j];
                if (this.checkBulletCollision(bullet, obstacle)) {
                    // 显示分数提示
                    const popup = document.createElement('div');
                    popup.className = 'score-popup';
                    popup.textContent = '+100';
                    popup.style.position = 'absolute';
                    popup.style.zIndex = '1000';
                    popup.style.left = `${bullet.x}px`;  // 在子弹位置显示
                    popup.style.top = `${bullet.y - 30}px`;  // 上移30像素
                    
                    document.querySelector('.game-container').appendChild(popup);
                    
                    setTimeout(() => {
                        popup.remove();
                    }, 1000);
                    
                    this.score += 100;  // 直接更新分数，不调用updateScore方法
                    document.getElementById('scoreValue').textContent = this.score;  // 更新分数显示
                    
                    this.effects.addInkEffect(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
                    this.audio.playExplosionSound();
                    
                    this.bullets.splice(i, 1);
                    this.obstacles.splice(j, 1);
                    break;
                }
            }
            
            if (bullet.x > this.canvas.width) {
                this.bullets.splice(i, 1);
            }
        }
    }

    drawBullets() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        
        for (const bullet of this.bullets) {
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            this.ctx.lineTo(bullet.x + bullet.width, bullet.y);
            this.ctx.lineWidth = bullet.height;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x + bullet.width, bullet.y);
            this.ctx.lineTo(bullet.x + bullet.width + 5, bullet.y);
            this.ctx.lineWidth = bullet.height * 0.7;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    checkBulletCollision(bullet, obstacle) {
        return bullet.x < obstacle.x + obstacle.width &&
               bullet.x + bullet.width > obstacle.x &&
               bullet.y < obstacle.y + obstacle.height &&
               bullet.y + bullet.height > obstacle.y;
    }

    drawBoat() {
        if (this.boat.isVisible) {
            this.ctx.save();
            this.ctx.translate(this.boat.x + this.boat.width/2, this.boat.y + this.boat.height/2);
            this.ctx.rotate(this.boat.tilt * Math.PI / 180);
            
            // 制船体主体
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 2;
            
            // 船底（更圆润的曲线）
            this.ctx.beginPath();
            this.ctx.moveTo(-this.boat.width/2, this.boat.height/3);
            this.ctx.quadraticCurveTo(
                0, this.boat.height/2,
                this.boat.width/2, this.boat.height/3
            );
            
            // 船主体（更尖锐的前端）
            this.ctx.moveTo(-this.boat.width/2, this.boat.height/3);
            this.ctx.quadraticCurveTo(
                -this.boat.width/3, 0,
                -this.boat.width/4, -this.boat.height/3
            );
            this.ctx.lineTo(this.boat.width/2, -this.boat.height/4);  // 更长的前端
            this.ctx.quadraticCurveTo(
                this.boat.width/2 + 5, 0,  // 突出的前端
                this.boat.width/2, this.boat.height/3
            );
            
            this.ctx.stroke();
            
            // 添加发射装置
            this.ctx.beginPath();
            this.ctx.moveTo(this.boat.width/3, -this.boat.height/6);
            this.ctx.lineTo(this.boat.width/2 + 8, -this.boat.height/6);  // 发射管延伸
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 发射装的装线
            this.ctx.beginPath();
            this.ctx.moveTo(this.boat.width/3, -this.boat.height/6 - 3);
            this.ctx.lineTo(this.boat.width/3, -this.boat.height/6 + 3);
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 船舱装饰
            this.ctx.beginPath();
            this.ctx.moveTo(-this.boat.width/4, 0);
            this.ctx.lineTo(this.boat.width/4, 0);
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.stroke();
            
            // 绘主帆
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            
            const sailWave = Math.sin(this.boat.sailWave) * 5;
            const sailTop = -this.boat.height * 0.8;
            
            this.ctx.moveTo(0, sailTop);
            this.ctx.quadraticCurveTo(
                sailWave * 1.5, sailTop/2,
                sailWave, this.boat.height/4
            );
            this.ctx.stroke();
            
            // 副帆
            this.ctx.beginPath();
            this.ctx.moveTo(-this.boat.width/4, -this.boat.height/4);
            this.ctx.quadraticCurveTo(
                -this.boat.width/4 + sailWave, 0,
                -this.boat.width/4 + sailWave/2, this.boat.height/4
            );
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.stroke();
            
            // 桅杆
            this.ctx.beginPath();
            this.ctx.moveTo(0, sailTop);
            this.ctx.lineTo(0, this.boat.height/4);
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // 装饰
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.lineWidth = 0.5;
            
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(-this.boat.width/2 + i*10, this.boat.height/3);
                this.ctx.lineTo(-this.boat.width/3 + i*10, -this.boat.height/6);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }

    generateObstacle() {
        const obstacle = {
            x: this.canvas.width,
            y: this.boat.riverTop + Math.random() * (this.boat.riverBottom - this.boat.riverTop - 30),
            width: 30 + Math.random() * 20,
            height: 30 + Math.random() * 20,
            opacity: this.obstacleOpacity
        };
        this.obstacles.push(obstacle);
    }

    drawObstacles() {
        for (let obstacle of this.obstacles) {
            this.ctx.save();
            
            // 主体轮廓
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${this.obstacleOpacity})`;
            this.ctx.lineWidth = 2;
            
            // 使用不规则多边形绘制石头
            this.ctx.beginPath();
            const points = [
                { x: obstacle.x + obstacle.width * 0.2, y: obstacle.y },                    // 顶部凸起
                { x: obstacle.x + obstacle.width * 0.7, y: obstacle.y + obstacle.height * 0.1 },  // 右上
                { x: obstacle.x + obstacle.width, y: obstacle.y + obstacle.height * 0.4 },        // 右侧凸起
                { x: obstacle.x + obstacle.width * 0.8, y: obstacle.y + obstacle.height * 0.7 },  // 右下
                { x: obstacle.x + obstacle.width * 0.5, y: obstacle.y + obstacle.height },        // 底部
                { x: obstacle.x + obstacle.width * 0.2, y: obstacle.y + obstacle.height * 0.9 },  // 左下
                { x: obstacle.x, y: obstacle.y + obstacle.height * 0.5 },                         // 左侧
                { x: obstacle.x + obstacle.width * 0.1, y: obstacle.y + obstacle.height * 0.2 }   // 左上
            ];
            
            // 绘制主轮廓
            this.ctx.moveTo(points[0].x, points[0].y);
            points.forEach(point => {
                this.ctx.lineTo(point.x, point.y);
            });
            this.ctx.closePath();
            this.ctx.stroke();
            
            // 添加纹理线条
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${this.obstacleOpacity * 0.3})`;
            this.ctx.lineWidth = 1;
            
            // 添加横向纹理
            for (let i = 1; i < 4; i++) {
                const y = obstacle.y + (obstacle.height * i / 4);
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width * 0.2, y);
                this.ctx.lineTo(obstacle.x + obstacle.width * 0.8, y + Math.random() * 5 - 2.5);
                this.ctx.stroke();
            }
            
            // 添加斜向纹理
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                const startX = obstacle.x + obstacle.width * (0.3 + i * 0.2);
                this.ctx.moveTo(startX, obstacle.y + obstacle.height * 0.2);
                this.ctx.lineTo(startX - obstacle.width * 0.2, 
                              obstacle.y + obstacle.height * 0.8 + Math.random() * 5 - 2.5);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.gameSpeed;
            
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // 检查普通障碍物碰撞
        for (let obstacle of this.obstacles) {
            if (this.checkBoatCollision(obstacle)) {
                if (this.isInvincible) {
                    // 使用标记来判断冲撞状态
                    const isRushing = this.boat.isRushing;
                    
                    // 根据是否在冲撞状态决定加分数量
                    const score = isRushing ? 800 : (this.audio.isPlayingPowerSound ? 500 : 200);
                    
                    // 显示状态提示文字（位置上移）
                    const popup = document.createElement('div');
                    popup.className = 'score-popup';
                    popup.style.position = 'absolute';
                    popup.style.zIndex = '1000';
                    popup.style.color = 'rgba(0, 0, 0, 0.8)';
                    popup.style.left = `${this.boat.x + this.boat.width + 50}px`;
                    popup.style.top = `${this.boat.y - 30}px`;
                    
                    // 根据是否在冲撞状态显示不同文字
                    popup.textContent = isRushing ? '撞击！+200x4' : (this.audio.isPlayingPowerSound ? '+大威时间' : '大威时间');
                    
                    document.querySelector('.game-container').appendChild(popup);
                    
                    setTimeout(() => {
                        popup.remove();
                    }, 1000);
                    
                    // 显示分数提示
                    const scorePopup = document.createElement('div');
                    scorePopup.className = 'score-popup';
                    scorePopup.textContent = `+${score}`;
                    scorePopup.style.position = 'absolute';
                    scorePopup.style.zIndex = '1000';
                    scorePopup.style.left = `${this.boat.x + this.boat.width + 50}px`;
                    scorePopup.style.top = `${this.boat.y + 30}px`;
                    
                    document.querySelector('.game-container').appendChild(scorePopup);
                    
                    setTimeout(() => {
                        scorePopup.remove();
                    }, 1000);
                    
                    // 更新分数
                    this.score += score;
                    document.getElementById('scoreValue').textContent = this.score;
                    
                    this.effects.addInkEffect(
                        (this.boat.x + obstacle.x) / 2,
                        (this.boat.y + obstacle.y) / 2
                    );
                    
                    // 播放爆炸音效
                    this.audio.playExplosionSound();
                    
                    this.obstacles = this.obstacles.filter(o => o !== obstacle);
                    
                    // 在非冲撞状态下碰到普通障碍物时播放大威天龙音效
                    if (!isRushing) {
                        this.audio.playPowerSound();
                    }
                } else {
                    this.health--;
                    this.updateHealth();
                    
                    // 显示生命值减少提示
                    const popup = document.createElement('div');
                    popup.className = 'score-popup';
                    popup.textContent = '生值-1';
                    popup.style.position = 'absolute';
                    popup.style.zIndex = '1000';
                    popup.style.color = 'rgba(0, 0, 0, 0.8)';  // 改为水墨色
                    popup.style.left = `${this.boat.x + this.boat.width/2}px`;
                    popup.style.top = `${this.boat.y}px`;
                    document.querySelector('.game-container').appendChild(popup);
                    
                    setTimeout(() => {
                        popup.remove();
                    }, 1000);
                    
                    // 添加小船闪烁效果
                    let blinkCount = 0;
                    const blinkInterval = setInterval(() => {
                        this.boat.isVisible = !this.boat.isVisible;
                        blinkCount++;
                        if (blinkCount >= 8) {  // 闪烁4次（2秒）
                            clearInterval(blinkInterval);
                            this.boat.isVisible = true;
                        }
                    }, 250);  // 每250ms闪烁一次
                    
                    this.effects.addInkEffect(
                        (this.boat.x + obstacle.x) / 2,
                        (this.boat.y + obstacle.y) / 2
                    );
                    this.obstacles = this.obstacles.filter(o => o !== obstacle);
                    
                    if (this.health <= 0) {
                        this.gameOver();
                    }
                }
            }
        }
        
        // 检查乌龟障碍物碰撞
        for (let turtle of this.turtleObstacles) {
            if (this.checkBoatCollision(turtle)) {
                // 显示提示文字（位置上移）
                const popup = document.createElement('div');
                popup.className = 'score-popup';
                popup.style.position = 'absolute';
                popup.style.zIndex = '1000';
                popup.style.color = 'rgba(0, 0, 0, 0.8)';
                popup.style.left = `${this.boat.x + this.boat.width/2}px`;
                popup.style.top = `${this.boat.y - 30}px`;  // 上移30像素
                
                // 根据当前状态显示不同文字
                if (this.isInvincible) {
                    popup.textContent = '+无敌时间';
                } else {
                    popup.textContent = '无敌时间';
                }
                
                document.querySelector('.game-container').appendChild(popup);
                
                setTimeout(() => {
                    popup.remove();
                }, 1000);
                
                this.activateInvincible();
                this.turtleObstacles = this.turtleObstacles.filter(t => t !== turtle);
            }
        }
    }

    async gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        this.audio.stopAllMusic();  // 使用新的方法停止所有音效
        this.audio.playGameOverSound();
        
        const duration = Date.now() - this.startTime;
        
        this.menuManager.saveScore(this.score, duration);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.menuManager.showGameOverDialog(this.score, duration);
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.classList.add('hidden');
        }
        
        this.obstacles = [];
        this.bullets = [];
        this.effects = new Effects();
    }

    reset() {
        this.score = 0;
        this.health = 3;
        this.obstacles = [];
        this.gameSpeed = 2;
        this.isGameOver = false;
        this.frameCount = 0;
        this.obstacleSpawnRate = 120;
        this.boat.velocityY = 0;
        this.boat.y = this.boat.initialY;
        this.boat.targetY = this.boat.riverTop + (this.boat.riverBottom - this.boat.riverTop) * 0.5;
        this.boat.tilt = 0;
        this.boat.sailWave = 0;
        this.boat.velocityX = 0;
        this.boat.x = this.boat.baseX;
        this.boat.x = this.boat.baseX;
        this.boat.targetX = this.boat.baseX;
        this.gameSpeed = 2;
        this.riverSpeed = 2;
        
        this.boat.y = this.boat.initialY;
        this.boat.velocityY = 0;
        this.boat.velocityX = 0;
        this.boat.x = this.boat.baseX;
        this.bullets = [];
        this.canShoot = true;
    }

    updateBoat() {
        this.boat.velocityY = Math.max(
            -this.boat.maxSpeed,
            Math.min(this.boat.maxSpeed, this.boat.velocityY)
        );
        
        this.boat.velocityX = Math.max(
            -this.boat.maxSpeedX,
            Math.min(this.boat.maxSpeedX, this.boat.velocityX)
        );
        
        this.boat.velocityY *= this.boat.friction;
        this.boat.velocityX *= this.boat.friction;
        
        // 添加边界限制
        const nextX = this.boat.x + this.boat.velocityX;
        const nextY = this.boat.y + this.boat.velocityY;
        
        // 限制左右边界
        if (nextX >= 0 && nextX <= this.canvas.width - this.boat.width) {
            this.boat.x = nextX;
        } else {
            this.boat.velocityX = 0;  // 碰到边界时停止移动
        }
        
        // 限制上下边界（保持原有的河流边界限制）
        this.boat.y = Math.max(
            this.boat.riverTop,
            Math.min(this.boat.maxY, nextY)
        );
        
        if (this.boat.velocityY < -0.1) {
            this.boat.tilt = Math.max(-this.boat.maxTilt, this.boat.velocityY * 2);
        } else if (this.boat.velocityY > 0.1) {
            this.boat.tilt = Math.min(this.boat.maxTilt, this.boat.velocityY * 2);
        } else {
            this.boat.tilt *= 0.9;
        }
        
        // 在向右移动时添加船尾涟漪
        if (this.boat.moveRight && Math.random() < 0.3) {  // 检查是否在向右移动
            const tiltRadians = this.boat.tilt * Math.PI / 180;
            const rippleX = this.boat.x - Math.cos(tiltRadians) * 10;
            const rippleY = this.boat.y + this.boat.height/2 + Math.sin(tiltRadians) * 5;
            
            this.effects.addRipple(rippleX, rippleY);
        }
        
        this.boat.sailWave += this.boat.sailWaveSpeed;
    }

    updateHealth() {
        const healthPoints = document.querySelectorAll('.health-point');
        healthPoints.forEach((point, index) => {
            if (index < this.health) {
                point.classList.remove('empty');
            } else {
                point.classList.add('empty');
            }
        });
    }

    updateScore(amount = 1) {
        this.score += amount;
        document.getElementById('scoreValue').textContent = this.score;
        
        // 显示加分提示（位置调整）
        if (amount > 1) {
            const popup = document.createElement('div');
            popup.className = 'score-popup';
            popup.textContent = `+${amount}`;
            popup.style.position = 'absolute';
            popup.style.zIndex = '1000';
            popup.style.left = `${this.boat.x + this.boat.width/2}px`;
            popup.style.top = `${this.boat.y + 30}px`;  // 下移30像素
            
            document.querySelector('.game-container').appendChild(popup);
            
            setTimeout(() => {
                popup.remove();
            }, 1000);
        }
    }

    generateTurtleObstacle() {
        const turtle = {
            x: this.canvas.width,
            y: this.boat.riverTop + Math.random() * (this.boat.riverBottom - this.boat.riverTop - 40),
            width: 40,
            height: 30,
            isTurtle: true
        };
        this.turtleObstacles.push(turtle);
    }

    drawTurtleObstacles() {
        for (let turtle of this.turtleObstacles) {
            this.ctx.save();
            
            // 绘制乌龟形状
            this.ctx.beginPath();
            const centerX = turtle.x + turtle.width/2;
            const centerY = turtle.y + turtle.height/2;
            
            // 绘制主体（椭圆形）
            this.ctx.ellipse(centerX, centerY, turtle.width/2, turtle.height/2, 0, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制头部
            this.ctx.beginPath();
            this.ctx.arc(turtle.x + turtle.width * 0.8, centerY, 
                        turtle.width * 0.15, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 绘制四肢
            const legPositions = [
                {x: 0.3, y: 0.2}, {x: 0.3, y: 0.8},
                {x: 0.7, y: 0.2}, {x: 0.7, y: 0.8}
            ];
            
            legPositions.forEach(pos => {
                this.ctx.beginPath();
                this.ctx.arc(turtle.x + turtle.width * pos.x,
                            turtle.y + turtle.height * pos.y,
                            turtle.width * 0.1, 0, Math.PI * 2);
                this.ctx.stroke();
            });
            
            // 绘制龟壳纹路
            for (let i = 1; i <= 3; i++) {
                this.ctx.beginPath();
                this.ctx.ellipse(centerX, centerY,
                               turtle.width/2 * (i/3), turtle.height/2 * (i/3),
                               0, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }

    drawInvincibleEffect() {
        if (this.isInvincible) {
            this.ctx.save();
            
            const centerX = this.boat.x + this.boat.width/2;
            const centerY = this.boat.y + this.boat.height/2;
            const radius = Math.max(this.boat.width, this.boat.height) * 0.8;
            
            // 绘制外层光晕（淡金色）
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, radius * 0.5,
                centerX, centerY, radius * 1.2
            );
            gradient.addColorStop(0, 'rgba(255, 236, 179, 0)');  // 淡金色，完全透明
            gradient.addColorStop(0.5, `rgba(255, 223, 128, ${0.2 + Math.sin(Date.now() / 200) * 0.1})`);  // 间的金色
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');  // 外围的金色，完全透明
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // 绘制内层保护罩（淡金色）
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(Date.now() / 200) * 0.2})`;  // 金色描边
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 添加能量波纹效果（淡金色）
            const time = Date.now() / 1000;
            for (let i = 0; i < 3; i++) {
                const waveRadius = radius * (0.8 + Math.sin(time * 2 + i * Math.PI / 1.5) * 0.2);
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 223, 128, ${0.3 - i * 0.1})`;  // 淡金色波纹
                this.ctx.lineWidth = 2 - i * 0.5;
                this.ctx.stroke();
            }
            
            // 添加能量粒子效果（淡金色）
            for (let i = 0; i < 8; i++) {
                const angle = (time * 2 + i * Math.PI / 4) % (Math.PI * 2);
                const particleX = centerX + Math.cos(angle) * radius;
                const particleY = centerY + Math.sin(angle) * radius;
                
                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(time * 4) * 0.2})`;  // 金色粒子
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }

    drawInvincibleTimer() {
        if (this.isInvincible) {
            this.ctx.save();
            
            // 无敌时间进度条
            const width = 200;
            const height = 10;
            const x = (this.canvas.width - width) / 2;
            const y = 20;
            
            // 绘制进度条背
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(x, y, width, height);
            
            // 绘制进度条
            const progress = (this.invincibleTimer / this.invincibleDuration);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(x, y, width * progress, height);
            
            // 添加无敌时间文字
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.font = '16px KaiTi';
            this.ctx.textAlign = 'center';
            const seconds = Math.ceil(this.invincibleTimer / 1000);
            this.ctx.fillText(`无敌时间：${seconds}秒`, x + width/2, y - 5);
            
            // 如果正在播放大威天龙音效，绘制第二个进度条
            if (this.audio.isPlayingPowerSound) {
                const powerY = y + 40;  // 在无敌时间进度下方40像素
                
                // 绘制大威时间进度条背景
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(x, powerY, width, height);
                
                // 绘制大威时间进度条
                const powerProgress = this.audio.powerSoundTimeLeft / 3000;  // 3秒总时长
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillRect(x, powerY, width * powerProgress, height);
                
                // 添加大威时间文字
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.font = '16px KaiTi';
                this.ctx.textAlign = 'center';
                const powerSeconds = Math.ceil(this.audio.powerSoundTimeLeft / 1000);
                this.ctx.fillText(`大威时间：${powerSeconds}秒`, x + width/2, powerY - 5);
            }
            
            this.ctx.restore();
        }
    }

    updateTurtleObstacles() {
        for (let i = this.turtleObstacles.length - 1; i >= 0; i--) {
            this.turtleObstacles[i].x -= this.gameSpeed;
            
            if (this.turtleObstacles[i].x + this.turtleObstacles[i].width < 0) {
                this.turtleObstacles.splice(i, 1);
            }
        }
    }

    activateInvincible() {
        this.isInvincible = true;
        this.invincibleTimer = this.invincibleDuration;
        
        // 加快游戏速度
        this.gameSpeed = this.boostGameSpeed;  // 使用更快的游戏速度
        this.riverSpeed = this.boostGameSpeed * 1.2;  // 加快河流速度，比游戏速度更快一点
        this.background.waterFlowSpeed = this.boostGameSpeed * 1.2;  // 加快背景水流速度
        
        // 加快碍物生成频率
        this.obstacleSpawnRate = 60;  // 从80减少到60，障碍物生成更频繁
        
        // 改变发射钮图标
        this.shootBtn.textContent = '撞';  // 将"撞！"改为"撞"
        
        this.audio.startInvincibleMusic();  // 开始播放无敌音乐
    }

    update() {
        if (!this.isRunning || this.isPaused || this.isGameOver) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新无敌状态
        if (this.isInvincible) {
            this.invincibleTimer -= 16.67;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                // 恢复正常速度
                this.gameSpeed = this.normalGameSpeed;
                this.riverSpeed = this.normalGameSpeed;
                this.background.waterFlowSpeed = this.normalGameSpeed;
                this.obstacleSpawnRate = 120;  // 恢复正常的障碍物生成频率
                // 恢复发射按钮图标
                this.shootBtn.textContent = '✦';  // 使用类的属性而不是重新查找DOM
                this.audio.stopInvincibleMusic();
            }
        }
        
        this.riverSpeed += this.riverSpeedIncrement;
        this.background.update(this.riverSpeed);
        
        this.frameCount++;
        if (this.frameCount % this.obstacleSpawnRate === 0) {
            this.generateObstacle();
        }
        
        // 生成乌龟碍物
        if (this.frameCount % this.turtleSpawnRate === 0) {
            this.generateTurtleObstacle();
        }
        
        this.updateObstacles();
        this.updateTurtleObstacles();
        
        this.drawObstacles();
        this.drawTurtleObstacles();
        this.drawBoat();
        this.drawInvincibleEffect();
        this.drawInvincibleTimer();
        
        this.checkCollisions();
        
        const currentTime = Date.now();
        if (currentTime - this.lastScoreTime >= this.scoreInterval) {
            this.updateScore(1);
            this.lastScoreTime = currentTime;
        }
        
        this.updateHealth();
        
        this.effects.update();
        
        this.updateBoat();
        
        this.animations.update();
        
        this.updateBullets();
        this.drawBullets();
    }

    startGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        const animate = () => {
            this.update();
            if (this.isRunning && !this.isPaused && !this.isGameOver) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    async start() {
        this.isRunning = true;
        this.isPaused = false;
        this.reset();
        this.audio.initialize();
        
        this.startTime = Date.now();
        
        this.startGameLoop();
        
        await this.animations.startGameAnimation();
    }

    pause() {
        this.isPaused = true;
        this.audio.stopBackgroundMusic();
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    resume() {
        this.isPaused = false;
        this.audio.startBackgroundMusic();
        this.startGameLoop();
    }

    restart() {
        this.reset();
        this.start();
    }

    quit() {
        this.isRunning = false;
        this.isPaused = false;
        this.reset();
        this.audio.stopBackgroundMusic();
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    checkBoatCollision(obstacle) {
        return this.boat.x < obstacle.x + obstacle.width &&
               this.boat.x + this.boat.width > obstacle.x &&
               this.boat.y < obstacle.y + obstacle.height &&
               this.boat.y + this.boat.height > obstacle.y;
    }
}

window.onload = () => {
    const game = new Game();
}; 
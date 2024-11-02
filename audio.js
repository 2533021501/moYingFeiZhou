class AudioManager {
    constructor() {
        this.isMuted = false;
        this.isInitialized = false;
        this.volume = 0.3;  // 初始音量30%
        
        // 创建背景音乐元素
        this.bgMusic = new Audio('assets/background_music.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = this.volume;
        
        // 创建发射音效
        this.shootSound = new Audio('assets/preview.mp3');
        this.shootSound.volume = this.volume * 0.5;
        
        // 创建爆炸音效
        this.explosionSound = new Audio('assets/baozha.mp3');
        this.explosionSound.volume = this.volume * 0.5;
        
        // 添加无敌时间音乐
        this.invincibleMusic = new Audio('assets/foguangchuxian.mp3');
        this.invincibleMusic.volume = this.volume;
        
        // 添加大威天龙音效
        this.powerSound = new Audio('assets/daweitianlong.mp3');
        this.powerSound.volume = this.volume;
        this.powerSound.addEventListener('ended', () => {
            // 音频播放结束时，如果还在播放状态就重新播放
            if (this.isPlayingPowerSound) {
                this.powerSound.currentTime = 0;
                this.powerSound.play();
            }
        });
        
        this.isPlayingInvincibleMusic = false;
        this.isPlayingPowerSound = false;
        this.powerSoundTimeout = null;
        
        this.powerSoundTimeLeft = 0;  // 添加剩余时间跟踪
        
        this.setupMusicControl();
        this.setupVolumeControl();
        
        // 在页面加载完成时自动播放背景音乐
        window.addEventListener('DOMContentLoaded', () => {
            // 尝试自动播放
            this.bgMusic.play().catch(error => {
                console.log('Auto-play was prevented by browser policy');
                // 如果自动播放被阻止，在用户首次点击页面时播放
                const playOnFirstInteraction = () => {
                    this.bgMusic.play();
                    document.removeEventListener('click', playOnFirstInteraction);
                };
                document.addEventListener('click', playOnFirstInteraction);
            });
        });

        // 添加音频加载状态标记
        this.audioLoaded = false;
        
        // 预加载所有音频
        this.loadAllAudio();
        
        // 添加用户交互监听
        document.addEventListener('touchstart', () => {
            if (!this.audioLoaded) {
                this.loadAllAudio();
            }
        }, { once: true });
    }

    setupMusicControl() {
        const musicToggle = document.getElementById('musicToggle');
        
        // 添加点击事件处理
        musicToggle.addEventListener('click', (e) => {
            // 阻止事件冒泡，防止空格键触发
            e.stopPropagation();
            this.toggleMute();
            musicToggle.textContent = this.isMuted ? '🔇' : '🎵';
        });

        // 防止空格键触发按钮点击
        musicToggle.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
            }
        });
    }

    setupVolumeControl() {
        // 获取所有音量控制按钮
        const volumeDown = document.getElementById('menuVolumeDown');
        const volumeUp = document.getElementById('menuVolumeUp');
        const volumeDisplay = document.getElementById('menuVolumeDisplay');

        // 添加点击事件
        volumeDown.addEventListener('click', () => {
            this.adjustVolume(-0.1);
            volumeDisplay.textContent = `${Math.round(this.volume * 100)}%`;
        });

        volumeUp.addEventListener('click', () => {
            this.adjustVolume(0.1);
            volumeDisplay.textContent = `${Math.round(this.volume * 100)}%`;
        });
    }

    adjustVolume(delta) {
        this.volume = Math.max(0, Math.min(1, this.volume + delta));
        this.bgMusic.volume = this.volume;
        this.shootSound.volume = this.volume * 0.5;
        this.explosionSound.volume = this.volume * 0.5;
        this.invincibleMusic.volume = this.volume;
        this.powerSound.volume = this.volume;  // 添加新音效的音量控制
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.bgMusic.pause();
        } else {
            this.bgMusic.play();
        }
    }

    async startBackgroundMusic() {
        if (!this.isMuted) {
            try {
                await this.bgMusic.play();
            } catch (error) {
                console.log('Auto-play was prevented. Waiting for user interaction.');
                // 如果自动播放被阻止，在用户首次点击时播放
                document.addEventListener('click', () => {
                    this.bgMusic.play();
                }, { once: true });
            }
        }
    }

    stopBackgroundMusic() {
        this.bgMusic.pause();
    }

    // 初始化音频（在用户第一次交互时调用）
    initialize() {
        if (this.isInitialized) return;
        
        // 创建简单的音频上下文
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // 创建简单的音效
        this.waterSound = this.createSimpleSound(220); // 220Hz
        this.collisionSound = this.createSimpleSound(440); // 440Hz
        this.gameOverSound = this.createSimpleSound(110); // 110Hz
        
        this.isInitialized = true;
    }

    createSimpleSound(frequency) {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.5);
            
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                gainNode.disconnect();
            }, 500);
        };
    }

    playWaterSound() {
        if (!this.isInitialized) this.initialize();
        this.waterSound?.();
    }

    playCollisionSound() {
        if (!this.isInitialized) this.initialize();
        this.collisionSound?.();
    }

    playGameOverSound() {
        if (!this.isInitialized) this.initialize();
        this.gameOverSound?.();
    }

    // 添加播放发射音效的方法
    playShootSound() {
        if (!this.isMuted) {
            // 重置音频播放位置，以便可以快速连续播放
            this.shootSound.currentTime = 0;
            this.shootSound.play();
        }
    }

    // 添加播放爆炸音效的方法
    playExplosionSound() {
        if (!this.isMuted) {
            this.explosionSound.currentTime = 0;
            this.explosionSound.play();
        }
    }

    // 修改无敌时间音乐控制方法
    startInvincibleMusic() {
        if (!this.isMuted) {
            // 如果已经在播放，就不需要重新开始
            if (!this.isPlayingInvincibleMusic) {
                this.bgMusic.pause();
                this.invincibleMusic.currentTime = 0;
                const playPromise = this.invincibleMusic.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Invincible music play error:', error);
                        setTimeout(() => {
                            this.invincibleMusic.play().catch(e => console.log('Retry failed:', e));
                        }, 100);
                    });
                }
                this.isPlayingInvincibleMusic = true;
            }
            // 如果已经在播放，只需要重置无敌状态即可
        }
    }

    stopInvincibleMusic() {
        if (this.isPlayingInvincibleMusic) {  // 只在正在播放时停止
            this.invincibleMusic.pause();
            this.isPlayingInvincibleMusic = false;  // 重置播放状态
            if (!this.isMuted) {
                this.bgMusic.play();  // 恢复背景音乐
            }
        }
    }

    // 添加播放大威天龙音效的方法
    playPowerSound() {
        if (!this.isMuted) {
            // 清除之前的计时器
            if (this.powerSoundTimeout) {
                clearTimeout(this.powerSoundTimeout);
            }
            
            // 清除之前的更新间隔
            if (this.powerSoundInterval) {
                clearInterval(this.powerSoundInterval);
            }
            
            // 如果已经在播放，只重置时间
            if (this.isPlayingPowerSound) {
                this.powerSoundTimeLeft = 3000;
            } else {
                // 如果没有在播放，才开始新的播放
                const playPromise = this.powerSound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Power sound play error:', error);
                        setTimeout(() => {
                            this.powerSound.play().catch(e => console.log('Retry failed:', e));
                        }, 100);
                    });
                }
                this.isPlayingPowerSound = true;
                this.powerSoundTimeLeft = 3000;
            }

            // 设置新的更新间隔
            this.powerSoundInterval = setInterval(() => {
                if (this.powerSoundTimeLeft > 0) {
                    this.powerSoundTimeLeft -= 16.67;  // 约60fps的更新频率
                } else {
                    clearInterval(this.powerSoundInterval);
                    this.stopPowerSound();
                }
            }, 16.67);
            
            // 3秒后停止播放
            this.powerSoundTimeout = setTimeout(() => {
                clearInterval(this.powerSoundInterval);
                this.stopPowerSound();
            }, 3000);
        }
    }

    stopPowerSound() {
        if (this.isPlayingPowerSound) {
            this.isPlayingPowerSound = false;
            this.powerSound.pause();
            this.powerSound.currentTime = 0;
            if (this.powerSoundTimeout) {
                clearTimeout(this.powerSoundTimeout);
                this.powerSoundTimeout = null;
            }
            if (this.powerSoundInterval) {
                clearInterval(this.powerSoundInterval);
                this.powerSoundInterval = null;
            }
        }
    }

    // 修改停止所有音乐的方法
    stopAllMusic() {
        // 停止背景音乐
        this.stopBackgroundMusic();
        
        // 停止无敌音乐
        if (this.isPlayingInvincibleMusic) {
            this.invincibleMusic.pause();
            this.invincibleMusic.currentTime = 0;
            this.isPlayingInvincibleMusic = false;
        }
        
        // 停止大天龙音效
        if (this.isPlayingPowerSound) {
            this.powerSound.pause();
            this.powerSound.currentTime = 0;
            this.isPlayingPowerSound = false;
            if (this.powerSoundTimeout) {
                clearTimeout(this.powerSoundTimeout);
                this.powerSoundTimeout = null;
            }
            this.powerSoundTimeLeft = 0;
        }
        
        // 重置所有频的播放进度
        this.bgMusic.currentTime = 0;
        this.invincibleMusic.currentTime = 0;
        this.powerSound.currentTime = 0;
    }

    loadAllAudio() {
        // 预加载所有音频文件
        Promise.all([
            this.bgMusic.load(),
            this.shootSound.load(),
            this.explosionSound.load(),
            this.invincibleMusic.load(),
            this.powerSound.load()
        ]).then(() => {
            this.audioLoaded = true;
            console.log('All audio loaded');
        }).catch(error => {
            console.log('Audio loading error:', error);
        });
    }
} 
class MenuManager {
    constructor(game) {
        this.game = game;
        this.menuScreen = document.getElementById('menuScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.helpScreen = document.getElementById('helpScreen');
        this.leaderboardScreen = document.getElementById('leaderboardScreen');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        this.leaderboard = this.loadLeaderboard();
        
        this.game.audio.bgMusic.play().catch(error => {
            console.log('Auto-play was prevented by browser policy');
            const playOnFirstInteraction = () => {
                this.game.audio.bgMusic.play();
                document.removeEventListener('click', playOnFirstInteraction);
            };
            document.addEventListener('click', playOnFirstInteraction);
        });
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.hideAllScreens();
            this.pauseBtn.classList.remove('hidden');
            this.game.start();
        });

        this.pauseBtn.addEventListener('click', () => {
            this.showPauseScreen();
            this.game.pause();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.hideAllScreens();
            this.game.resume();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.hideAllScreens();
            this.game.restart();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            this.showMainMenu();
            this.game.quit();
        });

        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelpScreen();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            this.showLeaderboard();
        });

        document.getElementById('leaderboardBackBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('clearLeaderboardBtn').addEventListener('click', () => {
            this.showConfirmDialog(
                '确定要清除所有记录吗？',
                () => {
                    this.clearLeaderboard();
                    this.showLeaderboard();  // 刷新显示
                }
            );
        });
    }

    showConfirmDialog(message, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <h3>${message}</h3>
            <div class="confirm-buttons">
                <button class="confirm-btn yes">确定</button>
                <button class="confirm-btn no">取消</button>
            </div>
        `;
        
        document.querySelector('.game-container').appendChild(dialog);
        
        dialog.querySelector('.yes').addEventListener('click', () => {
            onConfirm();
            dialog.remove();
        });
        
        dialog.querySelector('.no').addEventListener('click', () => {
            dialog.remove();
        });
    }

    hideAllScreens() {
        this.menuScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.helpScreen.classList.add('hidden');
        this.leaderboardScreen.classList.add('hidden');
    }

    showMainMenu() {
        this.hideAllScreens();
        this.menuScreen.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');
    }

    showPauseScreen() {
        this.pauseScreen.classList.remove('hidden');
    }

    showHelpScreen() {
        this.hideAllScreens();
        this.helpScreen.classList.remove('hidden');
    }

    loadLeaderboard() {
        const savedData = localStorage.getItem('gameLeaderboard');
        return savedData ? JSON.parse(savedData) : [];
    }

    saveScore(score, duration) {
        const now = new Date();
        const scoreData = {
            score: score,
            duration: this.formatDuration(duration),
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString()
        };
        
        this.leaderboard.push(scoreData);
        this.leaderboard.sort((a, b) => b.score - a.score);
        if (this.leaderboard.length > 10) {
            this.leaderboard = this.leaderboard.slice(0, 10);
        }
        
        localStorage.setItem('gameLeaderboard', JSON.stringify(this.leaderboard));
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    showLeaderboard() {
        this.hideAllScreens();
        this.leaderboardScreen.classList.remove('hidden');
        
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';
        
        this.leaderboard.forEach((item, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'leaderboard-item';
            scoreElement.innerHTML = `
                <span class="leaderboard-rank">${index + 1}</span>
                <span class="leaderboard-score">${item.score}分</span>
                <span class="leaderboard-duration">${item.duration}</span>
                <span class="leaderboard-date">${item.date} ${item.time}</span>
            `;
            leaderboardList.appendChild(scoreElement);
        });
    }

    showGameOverDialog(score, duration) {
        const dialog = document.createElement('div');
        dialog.className = 'game-over-dialog';
        dialog.innerHTML = `
            <h2>游戏结束</h2>
            <div class="game-over-stats">
                <p>得分：${score}分</p>
                <p>时长：${this.formatDuration(duration)}</p>
            </div>
            <div class="game-over-buttons">
                <button id="retryBtn" class="menu-btn">再来一次</button>
                <button id="homeBtn" class="menu-btn">返回首页</button>
            </div>
        `;
        
        document.querySelector('.game-container').appendChild(dialog);
        
        dialog.querySelector('#retryBtn').addEventListener('click', () => {
            dialog.remove();
            this.hideAllScreens();
            this.game.audio.startBackgroundMusic();  // 重新开始时播放音乐
            this.game.restart();
        });
        
        dialog.querySelector('#homeBtn').addEventListener('click', () => {
            dialog.remove();
            this.game.audio.startBackgroundMusic();  // 返回首页时播放音乐
            this.showMainMenu();
        });
    }

    clearLeaderboard() {
        this.leaderboard = [];
        localStorage.removeItem('gameLeaderboard');
    }
} 
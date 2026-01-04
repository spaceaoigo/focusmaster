/**
 * Pomodoro Timer Module - Enhanced with Sound System
 */

const Timer = {
    // State
    isRunning: false,
    isPaused: false,
    currentMode: 'work', // work, shortBreak, longBreak
    timeRemaining: 25 * 60, // in seconds
    totalTime: 25 * 60,
    currentSession: 1,
    intervalId: null,
    selectedTaskId: null,
    isCountingDown: false, // Last 5 seconds countdown
    bgmEnabled: false,

    // DOM Elements
    elements: {},

    // Initialize timer
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.updateDisplay();
        this.loadSelectedTask();
        this.setupFullscreenMode();
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            timerTime: document.getElementById('timerTime'),
            timerSession: document.getElementById('timerSession'),
            timerProgress: document.getElementById('timerProgress'),
            timerDisplay: document.querySelector('.timer-display'),
            timerContainer: document.querySelector('.timer-container'),
            startBtn: document.getElementById('startBtn'),
            resetBtn: document.getElementById('resetBtn'),
            skipBtn: document.getElementById('skipBtn'),
            playIcon: document.getElementById('playIcon'),
            pauseIcon: document.getElementById('pauseIcon'),
            modeBtns: document.querySelectorAll('.mode-btn'),
            currentTaskName: document.getElementById('currentTaskName'),
            quickTaskInput: document.getElementById('quickTaskInput'),
            quickTaskBtn: document.getElementById('quickTaskBtn'),
            bgmToggle: document.getElementById('bgmToggle'),
            fullscreenBtn: document.getElementById('fullscreenBtn')
        };
    },

    // Bind events
    bindEvents() {
        // Start/Pause button
        this.elements.startBtn?.addEventListener('click', () => {
            SoundSystem.playClick();
            if (this.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        });

        // Reset button
        this.elements.resetBtn?.addEventListener('click', () => {
            SoundSystem.playClick();
            this.reset();
        });

        // Skip button
        this.elements.skipBtn?.addEventListener('click', () => {
            SoundSystem.playClick();
            this.skip();
        });

        // Mode buttons
        this.elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                SoundSystem.playClick();
                const mode = btn.dataset.mode;
                this.setMode(mode);
            });
        });

        // Quick task add
        this.elements.quickTaskBtn?.addEventListener('click', () => {
            SoundSystem.playClick();
            this.addQuickTask();
        });

        this.elements.quickTaskInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addQuickTask();
            }
        });

        // BGM toggle
        this.elements.bgmToggle?.addEventListener('click', () => {
            this.toggleBGM();
        });

        // Fullscreen button
        this.elements.fullscreenBtn?.addEventListener('click', () => {
            this.toggleFullscreen();
        });
    },

    // Setup fullscreen mode
    setupFullscreenMode() {
        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;
            document.body.classList.toggle('fullscreen-mode', isFullscreen);
            this.elements.fullscreenBtn?.classList.toggle('active', isFullscreen);
        });
    },

    // Toggle fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    },

    // Toggle BGM
    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        this.elements.bgmToggle?.classList.toggle('active', this.bgmEnabled);

        const settings = SettingsStorage.get();
        const bgmType = settings.bgmType || 'lofi';

        if (this.bgmEnabled && this.isRunning) {
            const isBreak = this.currentMode !== 'work';
            SoundSystem.startBGM(bgmType, isBreak);
        } else {
            SoundSystem.fadeOutBGM(1);
        }

        showToast(this.bgmEnabled ? 'BGMをオンにしました 🎵' : 'BGMをオフにしました', 'info');
        this.updateBGMIcon();
    },

    // Update BGM icon
    updateBGMIcon() {
        if (!this.elements.bgmToggle) return;

        const iconInfo = this.bgmEnabled
            ? '<path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-4 0a9 9 0 0 0-9 9 9 9 0 0 0 9 9v-2a7 7 0 0 1-7-7 7 7 0 0 1 7-7v-2zm-2.7 13.7L5.58 15H3v-6h2.58l1.72-1.93V16.93z" fill="currentColor"/>'
            : '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>';

        // Use simple volume up/off SVGs
        const svgContent = this.bgmEnabled
            ? '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>'
            : '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';

        this.elements.bgmToggle.innerHTML = `<svg viewBox="0 0 24 24">${svgContent}</svg>`;
        this.elements.bgmToggle.setAttribute('title', this.bgmEnabled ? 'BGMをオフにする' : 'BGMをオンにする');
    },

    // Load settings
    loadSettings() {
        const settings = SettingsStorage.get();
        this.updateModeTime('work', settings.workDuration);
        this.updateModeTime('shortBreak', settings.shortBreakDuration);
        this.updateModeTime('longBreak', settings.longBreakDuration);
        this.bgmEnabled = settings.bgmEnabled || false;
        this.elements.bgmToggle?.classList.toggle('active', this.bgmEnabled);
        this.updateBGMIcon();
    },

    // Update mode time
    updateModeTime(mode, minutes) {
        if (this.currentMode === mode && !this.isRunning) {
            this.totalTime = minutes * 60;
            this.timeRemaining = this.totalTime;
            this.updateDisplay();
        }
    },

    // Load selected task
    loadSelectedTask() {
        const selectedId = Storage.get('selectedTask');
        if (selectedId) {
            const tasks = TaskStorage.getAll();
            const task = tasks.find(t => t.id === selectedId);
            if (task && !task.completed) {
                this.selectedTaskId = selectedId;
                this.updateCurrentTask(task.name);
            }
        }
    },

    // Set mode
    setMode(mode) {
        if (this.isRunning) {
            if (!confirm('タイマーが動作中です。モードを変更しますか？')) {
                return;
            }
            this.stop();
        }

        this.currentMode = mode;
        const settings = SettingsStorage.get();

        switch (mode) {
            case 'work':
                this.totalTime = settings.workDuration * 60;
                document.body.classList.remove('break-mode', 'long-break-mode');
                break;
            case 'shortBreak':
                this.totalTime = settings.shortBreakDuration * 60;
                document.body.classList.add('break-mode');
                document.body.classList.remove('long-break-mode');
                break;
            case 'longBreak':
                this.totalTime = settings.longBreakDuration * 60;
                document.body.classList.add('long-break-mode');
                document.body.classList.remove('break-mode');
                break;
        }

        this.timeRemaining = this.totalTime;
        this.updateDisplay();
        this.updateModeButtons();
        this.updateProgressColor();
    },

    // Start timer
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.updatePlayPauseButton();
        this.elements.timerDisplay?.classList.add('running');

        // Play start sound
        SoundSystem.playSessionStart();

        // Start BGM if enabled
        if (this.bgmEnabled) {
            const settings = SettingsStorage.get();
            const bgmType = settings.bgmType || 'lofi';
            const isBreak = this.currentMode !== 'work';
            SoundSystem.startBGM(bgmType, isBreak);
        }

        // Request notification permission on first start
        requestNotificationPermission();

        // Request wake lock
        if (window.requestWakeLock) {
            window.requestWakeLock();
        }

        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    },

    // Pause timer
    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        this.updatePlayPauseButton();
        this.elements.timerDisplay?.classList.remove('running');

        // Stop countdown tick
        SoundSystem.stopCountdownTick();
        this.isCountingDown = false;

        // Fade out BGM
        if (this.bgmEnabled) {
            SoundSystem.fadeOutBGM(0.5);
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Stop timer
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.updatePlayPauseButton();
        this.elements.timerDisplay?.classList.remove('running');

        // Stop sounds
        SoundSystem.stopCountdownTick();
        SoundSystem.stopBGM();
        this.isCountingDown = false;

        // Release wake lock
        if (window.releaseWakeLock) {
            window.releaseWakeLock();
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Reset timer
    reset() {
        this.stop();
        this.timeRemaining = this.totalTime;
        this.updateDisplay();
    },

    // Skip to next session
    skip() {
        if (this.isRunning) {
            if (!confirm('現在のセッションをスキップしますか？')) {
                return;
            }
        }

        this.stop();
        this.completeSession(true);
    },

    // Timer tick
    tick() {
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.updateDisplay();

            // Start countdown tick in last 5 seconds
            if (this.timeRemaining <= 5 && this.timeRemaining > 0 && !this.isCountingDown) {
                this.isCountingDown = true;
                this.elements.timerDisplay?.classList.add('countdown');
                SoundSystem.startCountdownTick();
            }

            // Add urgency class in last 10 seconds
            if (this.timeRemaining <= 10) {
                this.elements.timerDisplay?.classList.add('urgent');
            }
        } else {
            this.completeSession();
        }
    },

    // Complete session
    completeSession(skipped = false) {
        this.stop();

        // Stop countdown effects
        SoundSystem.stopCountdownTick();
        this.isCountingDown = false;
        this.elements.timerDisplay?.classList.remove('countdown', 'urgent');

        this.elements.timerDisplay?.classList.add('complete');
        setTimeout(() => {
            this.elements.timerDisplay?.classList.remove('complete');
        }, 1000);

        const settings = SettingsStorage.get();

        // If it was a work session
        if (this.currentMode === 'work' && !skipped) {
            // Play completion sound
            SoundSystem.playWorkComplete();

            // Record session
            SessionStorage.add({
                date: getTodayString(),
                duration: settings.workDuration,
                taskId: this.selectedTaskId,
                timestamp: new Date().toISOString(),
                hour: new Date().getHours()
            });

            // Update stats
            StatsStorage.incrementPomodoro(settings.workDuration);

            // Update task pomodoro count
            if (this.selectedTaskId) {
                const tasks = TaskStorage.getAll();
                const task = tasks.find(t => t.id === this.selectedTaskId);
                if (task) {
                    TaskStorage.update(this.selectedTaskId, {
                        completedPomodoros: (task.completedPomodoros || 0) + 1
                    });
                }
            }

            // Log activity
            ActivityStorage.add({
                type: 'pomodoro',
                icon: '🍅',
                title: 'Pomodoroを完了',
                detail: this.selectedTaskId ?
                    TaskStorage.getAll().find(t => t.id === this.selectedTaskId)?.name :
                    null
            });

            // Check achievements
            this.checkAchievements();

            // Notification
            if (settings.browserNotification) {
                showNotification('Pomodoro完了！', '休憩を取りましょう 🎉');
            }

            showToast('🍅 Pomodoro完了！休憩を取りましょう', 'success');

            // Switch to break
            this.currentSession++;
            if (this.currentSession > settings.sessionsUntilLongBreak) {
                this.currentSession = 1;
                this.setMode('longBreak');
            } else {
                this.setMode('shortBreak');
            }
        } else {
            // Break completed
            if (!skipped) {
                SoundSystem.playBreakComplete();

                if (settings.browserNotification) {
                    showNotification('休憩終了！', '作業を再開しましょう 💪');
                }

                showToast('💪 休憩終了！作業を再開しましょう', 'info');
            }

            this.setMode('work');
        }

        this.updateDisplay();
    },

    // Check achievements
    checkAchievements() {
        const stats = StatsStorage.get();
        const achievements = [
            { id: 'first', condition: stats.totalPomodoros >= 1 },
            { id: 'ten', condition: stats.totalPomodoros >= 10 },
            { id: 'fifty', condition: stats.totalPomodoros >= 50 },
            { id: 'hundred', condition: stats.totalPomodoros >= 100 },
            { id: 'fivehundred', condition: stats.totalPomodoros >= 500 },
            { id: 'streak3', condition: stats.currentStreak >= 3 },
            { id: 'streak7', condition: stats.currentStreak >= 7 },
            { id: 'streak14', condition: stats.currentStreak >= 14 },
            { id: 'streak30', condition: stats.currentStreak >= 30 }
        ];

        achievements.forEach(a => {
            if (a.condition && !stats.achievements.includes(a.id)) {
                StatsStorage.unlockAchievement(a.id);
                SoundSystem.playSuccess();
                showToast('🏆 新しい実績を獲得しました！', 'success');
            }
        });
    },

    // Update display
    updateDisplay() {
        if (this.elements.timerTime) {
            this.elements.timerTime.textContent = formatTime(this.timeRemaining);
        }

        if (this.elements.timerSession) {
            const settings = SettingsStorage.get();
            this.elements.timerSession.textContent =
                `セッション ${this.currentSession}/${settings.sessionsUntilLongBreak}`;
        }

        // Update page title
        document.title = `${formatTime(this.timeRemaining)} - Focus Flow`;

        this.updateProgress();
    },

    // Update progress ring
    updateProgress() {
        if (this.elements.timerProgress) {
            const circumference = 2 * Math.PI * 90; // radius = 90
            const progress = this.timeRemaining / this.totalTime;
            const offset = circumference * (1 - progress);
            this.elements.timerProgress.style.strokeDashoffset = offset;
        }
    },

    // Update progress color
    updateProgressColor() {
        if (this.elements.timerProgress) {
            this.elements.timerProgress.classList.remove('break', 'long-break');
            if (this.currentMode === 'shortBreak') {
                this.elements.timerProgress.classList.add('break');
            } else if (this.currentMode === 'longBreak') {
                this.elements.timerProgress.classList.add('long-break');
            }
        }
    },

    // Update mode buttons
    updateModeButtons() {
        this.elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
    },

    // Update play/pause button
    updatePlayPauseButton() {
        if (this.elements.playIcon && this.elements.pauseIcon) {
            this.elements.playIcon.style.display = this.isRunning ? 'none' : 'block';
            this.elements.pauseIcon.style.display = this.isRunning ? 'block' : 'none';
        }
    },

    // Update current task display
    updateCurrentTask(taskName) {
        if (this.elements.currentTaskName) {
            this.elements.currentTaskName.textContent = taskName || 'タスクを選択してください';
        }
    },

    // Select task
    selectTask(taskId, taskName) {
        this.selectedTaskId = taskId;
        Storage.set('selectedTask', taskId);
        this.updateCurrentTask(taskName);
    },

    // Clear selected task
    clearSelectedTask() {
        this.selectedTaskId = null;
        Storage.remove('selectedTask');
        this.updateCurrentTask(null);
    },

    // Add quick task
    addQuickTask() {
        const input = this.elements.quickTaskInput;
        if (!input || !input.value.trim()) return;

        const taskName = input.value.trim();
        const task = {
            id: generateId(),
            name: taskName,
            priority: 'medium',
            estimatedPomodoros: 1,
            completedPomodoros: 0,
            completed: false,
            createdAt: new Date().toISOString()
        };

        TaskStorage.add(task);
        this.selectTask(task.id, task.name);
        input.value = '';

        SoundSystem.playClick();

        // Refresh task list if visible
        if (typeof Tasks !== 'undefined' && Tasks.render) {
            Tasks.render();
        }

        showToast('タスクを追加しました', 'success');
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Timer.init();
});

/**
 * Statistics Module - Enhanced with Productivity Score & Heatmap
 */

const Stats = {
    currentPeriod: 'today',
    charts: {},
    elements: {},

    // Achievement definitions
    achievementDefs: [
        { id: 'first', icon: '🍅', name: '初めてのPomodoro', desc: '最初のPomodoroを完了' },
        { id: 'ten', icon: '🔟', name: '10 Pomodoro', desc: '10回のPomodoroを完了' },
        { id: 'fifty', icon: '5️⃣0️⃣', name: '50 Pomodoro', desc: '50回のPomodoroを完了' },
        { id: 'hundred', icon: '💯', name: '100 Pomodoro', desc: '100回のPomodoroを完了' },
        { id: 'fivehundred', icon: '🌟', name: '500 Pomodoro', desc: '500回のPomodoroを完了' },
        { id: 'streak3', icon: '🔥', name: '3日連続', desc: '3日連続で作業' },
        { id: 'streak7', icon: '📅', name: '1週間連続', desc: '7日連続で作業' },
        { id: 'streak14', icon: '🏅', name: '2週間連続', desc: '14日連続で作業' },
        { id: 'streak30', icon: '👑', name: '1ヶ月連続', desc: '30日連続で作業' },
        { id: 'earlybird', icon: '🌅', name: 'アーリーバード', desc: '早朝（5-7時）に作業' },
        { id: 'nightowl', icon: '🦉', name: 'ナイトオウル', desc: '深夜（22-24時）に作業' },
        { id: 'marathon', icon: '🏃', name: 'マラソン', desc: '1日で10個以上のPomodoro' },
        { id: 'taskmaster', icon: '✅', name: 'タスクマスター', desc: '10個のタスクを完了' },
        { id: 'focused', icon: '🎯', name: '集中の達人', desc: '中断なしで5セッション連続' }
    ],

    // Initialize
    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            statPomodoros: document.getElementById('statPomodoros'),
            statTime: document.getElementById('statTime'),
            statTasks: document.getElementById('statTasks'),
            statStreak: document.getElementById('statStreak'),
            productivityScore: document.getElementById('productivityScore'),
            periodBtns: document.querySelectorAll('.period-btn'),
            achievementsGrid: document.getElementById('achievementsGrid'),
            activityList: document.getElementById('activityList'),
            pomodoroChart: document.getElementById('pomodoroChart'),
            hourlyChart: document.getElementById('hourlyChart'),
            heatmapContainer: document.getElementById('heatmapContainer')
        };
    },

    // Bind events
    bindEvents() {
        this.elements.periodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                SoundSystem.playClick();
                this.currentPeriod = btn.dataset.period;
                this.updatePeriodButtons();
                this.render();
            });
        });
    },

    // Update period buttons
    updatePeriodButtons() {
        this.elements.periodBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === this.currentPeriod);
        });
    },

    // Get sessions for current period
    getSessions() {
        switch (this.currentPeriod) {
            case 'week':
                return SessionStorage.getWeek();
            case 'month':
                return SessionStorage.getMonth();
            default:
                return SessionStorage.getToday();
        }
    },

    // Calculate productivity score (0-100)
    calculateProductivityScore(sessions, tasks) {
        if (sessions.length === 0) return 0;

        const settings = SettingsStorage.get();
        const dailyGoal = settings.dailyGoal || 8;

        // Session consistency (up to 40 points)
        const sessionScore = Math.min(sessions.length / dailyGoal, 1) * 40;

        // Task completion rate (up to 30 points)
        const activeTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);
        const taskScore = completedTasks.length > 0
            ? Math.min(completedTasks.length / (completedTasks.length + activeTasks.length), 1) * 30
            : 0;

        // Focus quality - average session completion (up to 30 points)
        const avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 25), 0) / sessions.length;
        const focusScore = (avgDuration / 25) * 30;

        return Math.round(sessionScore + taskScore + focusScore);
    },

    // Calculate stats
    calculateStats() {
        const sessions = this.getSessions();
        const stats = StatsStorage.get();
        const tasks = TaskStorage.getAll();

        // Calculate period stats
        const periodPomodoros = sessions.length;
        const periodMinutes = sessions.reduce((sum, s) => sum + (s.duration || 25), 0);

        // Count tasks completed in period
        const periodStart = this.getPeriodStart();
        const completedTasks = tasks.filter(t =>
            t.completed &&
            t.completedAt &&
            new Date(t.completedAt) >= periodStart
        ).length;

        // Productivity score
        const productivityScore = this.calculateProductivityScore(sessions, tasks);

        return {
            pomodoros: periodPomodoros,
            time: periodMinutes,
            tasks: completedTasks,
            streak: stats.currentStreak,
            productivityScore,
            sessions
        };
    },

    // Get period start date
    getPeriodStart() {
        switch (this.currentPeriod) {
            case 'week':
                return getWeekStart();
            case 'month':
                return getMonthStart();
            default:
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return today;
        }
    },

    // Render stats
    render() {
        const data = this.calculateStats();

        // Update stat cards with animation
        this.animateValue(this.elements.statPomodoros, data.pomodoros);

        if (this.elements.statTime) {
            this.elements.statTime.textContent = formatDuration(data.time);
        }

        this.animateValue(this.elements.statTasks, data.tasks);

        if (this.elements.statStreak) {
            this.elements.statStreak.textContent = `${data.streak}日`;
        }

        // Productivity score
        if (this.elements.productivityScore) {
            this.animateValue(this.elements.productivityScore, data.productivityScore);
            this.updateProductivityScoreColor(data.productivityScore);
        }

        // Render charts
        this.renderPomodoroChart(data.sessions);
        this.renderHourlyChart(data.sessions);

        // Render heatmap if month view
        if (this.currentPeriod === 'month') {
            this.renderHeatmap();
        }

        // Render achievements
        this.renderAchievements();

        // Render activity
        this.renderActivity();
    },

    // Animate value change
    animateValue(element, targetValue) {
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuad = t => t * (2 - t);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuad(progress));

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Update productivity score color
    updateProductivityScoreColor(score) {
        const element = this.elements.productivityScore?.parentElement;
        if (!element) return;

        element.classList.remove('score-low', 'score-medium', 'score-high');

        if (score >= 80) {
            element.classList.add('score-high');
        } else if (score >= 50) {
            element.classList.add('score-medium');
        } else {
            element.classList.add('score-low');
        }
    },

    // Render Pomodoro chart
    renderPomodoroChart(sessions) {
        const ctx = this.elements.pomodoroChart?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.pomodoro) {
            this.charts.pomodoro.destroy();
        }

        // Prepare data
        const labels = [];
        const data = [];

        if (this.currentPeriod === 'today') {
            // Hourly breakdown
            for (let i = 0; i < 24; i++) {
                labels.push(`${i}時`);
                const count = sessions.filter(s => s.hour === i).length;
                data.push(count);
            }
        } else if (this.currentPeriod === 'week') {
            // Daily breakdown
            const days = ['日', '月', '火', '水', '木', '金', '土'];
            const weekStart = getWeekStart();

            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];

                labels.push(days[date.getDay()]);
                const count = sessions.filter(s => s.date === dateStr).length;
                data.push(count);
            }
        } else {
            // Weekly breakdown for month
            const weeks = ['第1週', '第2週', '第3週', '第4週', '第5週'];
            const monthStart = getMonthStart();

            for (let i = 0; i < 5; i++) {
                labels.push(weeks[i]);
                const weekStart = new Date(monthStart);
                weekStart.setDate(weekStart.getDate() + (i * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);

                const count = sessions.filter(s => {
                    const sessionDate = new Date(s.date);
                    return sessionDate >= weekStart && sessionDate < weekEnd;
                }).length;
                data.push(count);
            }
        }

        // Create chart
        const isDark = document.documentElement.dataset.theme === 'dark' ||
            (document.documentElement.dataset.theme !== 'light' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);

        this.charts.pomodoro = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Pomodoro',
                    data,
                    backgroundColor: data.map(v => {
                        const max = Math.max(...data) || 1;
                        const intensity = 0.4 + (v / max) * 0.6;
                        return `rgba(255, 107, 107, ${intensity})`;
                    }),
                    borderColor: 'rgba(255, 107, 107, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                        titleColor: isDark ? '#fff' : '#000',
                        bodyColor: isDark ? '#ccc' : '#333',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: isDark ? '#8E8E93' : '#86868B'
                        },
                        grid: {
                            color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#8E8E93' : '#86868B'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    // Render hourly activity chart
    renderHourlyChart(sessions) {
        const ctx = this.elements.hourlyChart?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        // Prepare data - group by hour across all sessions
        const hourlyData = new Array(24).fill(0);
        sessions.forEach(s => {
            if (s.hour !== undefined) {
                hourlyData[s.hour]++;
            }
        });

        // Find peak hours
        const labels = [];
        const data = [];
        const maxValue = Math.max(...hourlyData);

        for (let i = 5; i < 24; i++) {
            labels.push(`${i}時`);
            data.push(hourlyData[i]);
        }

        const isDark = document.documentElement.dataset.theme === 'dark' ||
            (document.documentElement.dataset.theme !== 'light' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);

        // Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(0, 122, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 122, 255, 0.2)');

        this.charts.hourly = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '作業量',
                    data,
                    backgroundColor: gradient,
                    borderColor: 'rgba(0, 122, 255, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(0, 122, 255, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: isDark ? '#8E8E93' : '#86868B'
                        },
                        grid: {
                            color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#8E8E93' : '#86868B',
                            maxRotation: 0
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    // Render activity heatmap
    renderHeatmap() {
        if (!this.elements.heatmapContainer) return;

        const sessions = SessionStorage.getMonth();
        const monthStart = getMonthStart();

        // Create 7x5 grid (weeks x days)
        const weeks = 5;
        const days = 7;
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

        // Count sessions per day
        const dayCounts = {};
        sessions.forEach(s => {
            dayCounts[s.date] = (dayCounts[s.date] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(dayCounts), 1);

        let html = '<div class="heatmap">';
        html += '<div class="heatmap-labels">';
        dayNames.forEach(d => {
            html += `<span class="heatmap-day-label">${d}</span>`;
        });
        html += '</div>';
        html += '<div class="heatmap-grid">';

        for (let week = 0; week < weeks; week++) {
            for (let day = 0; day < days; day++) {
                const date = new Date(monthStart);
                date.setDate(date.getDate() + (week * 7) + day);
                const dateStr = date.toISOString().split('T')[0];
                const count = dayCounts[dateStr] || 0;
                const intensity = count > 0 ? Math.ceil((count / maxCount) * 4) : 0;
                const isToday = dateStr === getTodayString();

                html += `
                    <div class="heatmap-cell level-${intensity} ${isToday ? 'today' : ''}"
                         title="${dateStr}: ${count} Pomodoro">
                    </div>
                `;
            }
        }

        html += '</div></div>';
        this.elements.heatmapContainer.innerHTML = html;
    },

    // Render achievements
    renderAchievements() {
        if (!this.elements.achievementsGrid) return;

        const stats = StatsStorage.get();

        this.elements.achievementsGrid.innerHTML = this.achievementDefs.map(a => {
            const unlocked = stats.achievements.includes(a.id);
            return `
                <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                    <span class="achievement-icon">${a.icon}</span>
                    <div class="achievement-info">
                        <span class="achievement-name">${a.name}</span>
                        <span class="achievement-desc">${a.desc}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Render activity
    renderActivity() {
        if (!this.elements.activityList) return;

        const activities = ActivityStorage.getRecent(10);

        if (activities.length === 0) {
            this.elements.activityList.innerHTML = `
                <div class="stats-empty">
                    <span class="stats-empty-icon">📭</span>
                    <p>まだ活動がありません</p>
                </div>
            `;
            return;
        }

        this.elements.activityList.innerHTML = activities.map(a => `
            <div class="activity-item">
                <span class="activity-icon">${a.icon || '📌'}</span>
                <div class="activity-content">
                    <span class="activity-title">${escapeHtml(a.title)}</span>
                    <span class="activity-time">${formatTimeAgo(a.timestamp)}</span>
                </div>
                ${a.detail ? `<span class="activity-detail">${escapeHtml(a.detail)}</span>` : ''}
            </div>
        `).join('');
    },

    // Refresh charts (call after theme change)
    refreshCharts() {
        const data = this.calculateStats();
        this.renderPomodoroChart(data.sessions);
        this.renderHourlyChart(data.sessions);
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Stats.init();
});

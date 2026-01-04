/**
 * Storage Module - LocalStorage wrapper with IndexedDB fallback
 */

const Storage = {
    prefix: 'focusflow_',

    // Get item from storage
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    // Set item to storage
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    // Remove item from storage
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    // Clear all app data
    clear() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
            keys.forEach(k => localStorage.removeItem(k));
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    // Export all data
    exportAll() {
        const data = {};
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
        keys.forEach(k => {
            const shortKey = k.replace(this.prefix, '');
            data[shortKey] = this.get(shortKey);
        });
        return data;
    },

    // Import data
    importAll(data) {
        try {
            Object.keys(data).forEach(key => {
                this.set(key, data[key]);
            });
            return true;
        } catch (e) {
            console.error('Storage import error:', e);
            return false;
        }
    }
};

// Task Storage
const TaskStorage = {
    key: 'tasks',

    getAll() {
        return Storage.get(this.key, []);
    },

    save(tasks) {
        return Storage.set(this.key, tasks);
    },

    add(task) {
        const tasks = this.getAll();
        tasks.push(task);
        return this.save(tasks);
    },

    update(id, updates) {
        const tasks = this.getAll();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            return this.save(tasks);
        }
        return false;
    },

    delete(id) {
        const tasks = this.getAll();
        const filtered = tasks.filter(t => t.id !== id);
        return this.save(filtered);
    },

    getActive() {
        return this.getAll().filter(t => !t.completed);
    },

    getCompleted() {
        return this.getAll().filter(t => t.completed);
    }
};

// Session Storage (Pomodoro sessions)
const SessionStorage = {
    key: 'sessions',

    getAll() {
        return Storage.get(this.key, []);
    },

    save(sessions) {
        return Storage.set(this.key, sessions);
    },

    add(session) {
        const sessions = this.getAll();
        sessions.push(session);
        return this.save(sessions);
    },

    getToday() {
        const today = getTodayString();
        return this.getAll().filter(s => s.date === today);
    },

    getByDateRange(startDate, endDate) {
        const sessions = this.getAll();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return sessions.filter(s => {
            const sessionDate = new Date(s.date).getTime();
            return sessionDate >= start && sessionDate <= end;
        });
    },

    getWeek() {
        const weekStart = getWeekStart();
        const today = new Date();
        return this.getByDateRange(weekStart, today);
    },

    getMonth() {
        const monthStart = getMonthStart();
        const today = new Date();
        return this.getByDateRange(monthStart, today);
    }
};

// Activity Storage
const ActivityStorage = {
    key: 'activities',
    maxItems: 100,

    getAll() {
        return Storage.get(this.key, []);
    },

    save(activities) {
        return Storage.set(this.key, activities);
    },

    add(activity) {
        const activities = this.getAll();
        activities.unshift({
            ...activity,
            timestamp: new Date().toISOString()
        });

        // Keep only last N items
        if (activities.length > this.maxItems) {
            activities.splice(this.maxItems);
        }

        return this.save(activities);
    },

    getRecent(limit = 10) {
        return this.getAll().slice(0, limit);
    }
};

// Settings Storage
const SettingsStorage = {
    key: 'settings',

    defaults: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        browserNotification: true,
        soundNotification: true,
        theme: 'system',
        dailyGoal: 8
    },

    get() {
        return { ...this.defaults, ...Storage.get(this.key, {}) };
    },

    save(settings) {
        return Storage.set(this.key, settings);
    },

    update(key, value) {
        const settings = this.get();
        settings[key] = value;
        return this.save(settings);
    },

    reset() {
        return Storage.set(this.key, this.defaults);
    }
};

// Stats Storage
const StatsStorage = {
    key: 'stats',

    defaults: {
        totalPomodoros: 0,
        totalMinutes: 0,
        totalTasksCompleted: 0,
        longestStreak: 0,
        currentStreak: 0,
        lastActiveDate: null,
        achievements: []
    },

    get() {
        return { ...this.defaults, ...Storage.get(this.key, {}) };
    },

    save(stats) {
        return Storage.set(this.key, stats);
    },

    update(updates) {
        const stats = this.get();
        Object.assign(stats, updates);
        return this.save(stats);
    },

    incrementPomodoro(minutes) {
        const stats = this.get();
        const today = getTodayString();

        stats.totalPomodoros++;
        stats.totalMinutes += minutes;

        // Update streak
        if (stats.lastActiveDate === today) {
            // Already active today, no streak change
        } else if (stats.lastActiveDate === getYesterdayString()) {
            // Continued from yesterday
            stats.currentStreak++;
        } else {
            // Streak broken or first day
            stats.currentStreak = 1;
        }

        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }

        stats.lastActiveDate = today;

        return this.save(stats);
    },

    incrementTasksCompleted() {
        const stats = this.get();
        stats.totalTasksCompleted++;
        return this.save(stats);
    },

    unlockAchievement(achievementId) {
        const stats = this.get();
        if (!stats.achievements.includes(achievementId)) {
            stats.achievements.push(achievementId);
            return this.save(stats);
        }
        return true;
    }
};

// Helper function
function getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

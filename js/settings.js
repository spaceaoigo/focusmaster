/**
 * Settings Module - Enhanced with Sound Controls
 */

const Settings = {
    elements: {},

    // Initialize
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.initDailyGoal();
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Timer settings
            workDuration: document.getElementById('workDuration'),
            workDurationValue: document.getElementById('workDurationValue'),
            shortBreakDuration: document.getElementById('shortBreakDuration'),
            shortBreakDurationValue: document.getElementById('shortBreakDurationValue'),
            longBreakDuration: document.getElementById('longBreakDuration'),
            longBreakDurationValue: document.getElementById('longBreakDurationValue'),
            sessionsUntilLongBreak: document.getElementById('sessionsUntilLongBreak'),
            sessionsUntilLongBreakValue: document.getElementById('sessionsUntilLongBreakValue'),

            // Notification settings
            browserNotification: document.getElementById('browserNotification'),
            soundNotification: document.getElementById('soundNotification'),

            // Sound settings
            masterVolume: document.getElementById('masterVolume'),
            masterVolumeValue: document.getElementById('masterVolumeValue'),
            bgmVolume: document.getElementById('bgmVolume'),
            bgmVolumeValue: document.getElementById('bgmVolumeValue'),
            sfxVolume: document.getElementById('sfxVolume'),
            sfxVolumeValue: document.getElementById('sfxVolumeValue'),
            bgmTypeSelect: document.getElementById('bgmTypeSelect'),
            countdownSound: document.getElementById('countdownSound'),

            // Appearance
            themeSelect: document.getElementById('themeSelect'),

            // Data
            exportDataBtn: document.getElementById('exportDataBtn'),
            importDataBtn: document.getElementById('importDataBtn'),
            importDataInput: document.getElementById('importDataInput'),
            clearDataBtn: document.getElementById('clearDataBtn'),

            // Daily goal
            goalProgress: document.getElementById('goalProgress'),
            goalBarFill: document.getElementById('goalBarFill')
        };
    },

    // Bind events
    bindEvents() {
        // Timer settings
        this.elements.workDuration?.addEventListener('input', (e) => {
            this.updateSettingValue('workDuration', e.target.value, '分');
            this.saveSetting('workDuration', parseInt(e.target.value));
            Timer.updateModeTime('work', parseInt(e.target.value));
        });

        this.elements.shortBreakDuration?.addEventListener('input', (e) => {
            this.updateSettingValue('shortBreakDuration', e.target.value, '分');
            this.saveSetting('shortBreakDuration', parseInt(e.target.value));
            Timer.updateModeTime('shortBreak', parseInt(e.target.value));
        });

        this.elements.longBreakDuration?.addEventListener('input', (e) => {
            this.updateSettingValue('longBreakDuration', e.target.value, '分');
            this.saveSetting('longBreakDuration', parseInt(e.target.value));
            Timer.updateModeTime('longBreak', parseInt(e.target.value));
        });

        this.elements.sessionsUntilLongBreak?.addEventListener('input', (e) => {
            this.updateSettingValue('sessionsUntilLongBreak', e.target.value, '回');
            this.saveSetting('sessionsUntilLongBreak', parseInt(e.target.value));
        });

        // Notification settings
        this.elements.browserNotification?.addEventListener('change', (e) => {
            if (e.target.checked) {
                requestNotificationPermission().then(granted => {
                    if (!granted) {
                        e.target.checked = false;
                        showToast('通知の許可が必要です', 'warning');
                    } else {
                        this.saveSetting('browserNotification', true);
                    }
                });
            } else {
                this.saveSetting('browserNotification', false);
            }
        });

        this.elements.soundNotification?.addEventListener('change', (e) => {
            this.saveSetting('soundNotification', e.target.checked);
            if (e.target.checked) {
                SoundSystem.playClick();
            }
        });

        // Sound settings
        this.elements.masterVolume?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            SoundSystem.setVolume('master', value);
            this.updateSettingValue('masterVolume', e.target.value, '%');
        });

        this.elements.bgmVolume?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            SoundSystem.setVolume('bgm', value);
            this.updateSettingValue('bgmVolume', e.target.value, '%');
        });

        this.elements.sfxVolume?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            SoundSystem.setVolume('sfx', value);
            this.updateSettingValue('sfxVolume', e.target.value, '%');
            // Play test sound
            SoundSystem.playClick();
        });

        this.elements.bgmTypeSelect?.addEventListener('change', (e) => {
            this.saveSetting('bgmType', e.target.value);
        });

        this.elements.countdownSound?.addEventListener('change', (e) => {
            this.saveSetting('countdownSound', e.target.checked);
        });

        // Theme
        this.elements.themeSelect?.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
            this.saveSetting('theme', e.target.value);
        });

        // Data export
        this.elements.exportDataBtn?.addEventListener('click', () => {
            SoundSystem.playClick();
            this.exportData();
        });

        // Data import
        this.elements.importDataBtn?.addEventListener('click', () => {
            SoundSystem.playClick();
            this.elements.importDataInput?.click();
        });

        this.elements.importDataInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file);
            }
        });

        // Clear data
        this.elements.clearDataBtn?.addEventListener('click', () => {
            SoundSystem.playClick();
            this.clearData();
        });
    },

    // Load settings
    loadSettings() {
        const settings = SettingsStorage.get();

        // Timer settings
        if (this.elements.workDuration) {
            this.elements.workDuration.value = settings.workDuration;
            this.updateSettingValue('workDuration', settings.workDuration, '分');
        }

        if (this.elements.shortBreakDuration) {
            this.elements.shortBreakDuration.value = settings.shortBreakDuration;
            this.updateSettingValue('shortBreakDuration', settings.shortBreakDuration, '分');
        }

        if (this.elements.longBreakDuration) {
            this.elements.longBreakDuration.value = settings.longBreakDuration;
            this.updateSettingValue('longBreakDuration', settings.longBreakDuration, '分');
        }

        if (this.elements.sessionsUntilLongBreak) {
            this.elements.sessionsUntilLongBreak.value = settings.sessionsUntilLongBreak;
            this.updateSettingValue('sessionsUntilLongBreak', settings.sessionsUntilLongBreak, '回');
        }

        // Notification settings
        if (this.elements.browserNotification) {
            this.elements.browserNotification.checked = settings.browserNotification;
        }

        if (this.elements.soundNotification) {
            this.elements.soundNotification.checked = settings.soundNotification;
        }

        // Sound settings
        const volumes = Storage.get('soundVolumes') || { master: 0.7, bgm: 0.3, sfx: 0.5 };

        if (this.elements.masterVolume) {
            this.elements.masterVolume.value = Math.round(volumes.master * 100);
            this.updateSettingValue('masterVolume', Math.round(volumes.master * 100), '%');
        }

        if (this.elements.bgmVolume) {
            this.elements.bgmVolume.value = Math.round(volumes.bgm * 100);
            this.updateSettingValue('bgmVolume', Math.round(volumes.bgm * 100), '%');
        }

        if (this.elements.sfxVolume) {
            this.elements.sfxVolume.value = Math.round(volumes.sfx * 100);
            this.updateSettingValue('sfxVolume', Math.round(volumes.sfx * 100), '%');
        }

        if (this.elements.bgmTypeSelect) {
            this.elements.bgmTypeSelect.value = settings.bgmType || 'lofi';
        }

        if (this.elements.countdownSound) {
            this.elements.countdownSound.checked = settings.countdownSound !== false;
        }

        // Theme
        if (this.elements.themeSelect) {
            this.elements.themeSelect.value = settings.theme;
        }

        // Apply theme
        this.setTheme(settings.theme);
    },

    // Initialize daily goal
    initDailyGoal() {
        this.updateDailyGoal();

        // Update every minute
        setInterval(() => this.updateDailyGoal(), 60000);
    },

    // Update daily goal display
    updateDailyGoal() {
        const settings = SettingsStorage.get();
        const dailyGoal = settings.dailyGoal || 8;
        const sessions = SessionStorage.getByDate(getTodayString());
        const completed = sessions.length;
        const percentage = Math.min((completed / dailyGoal) * 100, 100);

        if (this.elements.goalProgress) {
            this.elements.goalProgress.textContent = `${completed}/${dailyGoal} 🍅`;
        }

        if (this.elements.goalBarFill) {
            this.elements.goalBarFill.style.width = `${percentage}%`;

            // Add celebration effect when goal is reached
            if (completed >= dailyGoal && !this.goalReached) {
                this.goalReached = true;
                this.elements.goalBarFill.style.background =
                    'linear-gradient(90deg, var(--color-success), #FFD700)';
                showToast('🎉 今日の目標を達成しました！', 'success');
                SoundSystem.playSuccess();
            }
        }
    },

    // Update setting value display
    updateSettingValue(key, value, unit) {
        const valueEl = this.elements[key + 'Value'];
        if (valueEl) {
            valueEl.textContent = value + unit;
        }
    },

    // Save setting
    saveSetting(key, value) {
        SettingsStorage.update(key, value);
    },

    // Set theme
    setTheme(theme) {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Refresh charts if stats view is visible
        if (typeof Stats !== 'undefined' && Stats.refreshCharts) {
            setTimeout(() => Stats.refreshCharts(), 100);
        }
    },

    // Export data
    exportData() {
        const data = Storage.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `focusflow-backup-${getTodayString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('データをエクスポートしました', 'success');
    },

    // Import data
    importData(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (confirm('現在のデータを上書きしますか？この操作は取り消せません。')) {
                    Storage.importAll(data);
                    showToast('データをインポートしました', 'success');

                    // Reload settings and views
                    this.loadSettings();
                    Timer.loadSettings();
                    Tasks.render();
                    Stats.render();
                }
            } catch (err) {
                showToast('無効なファイル形式です', 'error');
            }
        };

        reader.readAsText(file);

        // Reset file input
        this.elements.importDataInput.value = '';
    },

    // Clear all data
    clearData() {
        if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
            if (confirm('本当に削除しますか？すべてのタスク、統計、設定が失われます。')) {
                Storage.clear();
                showToast('すべてのデータを削除しました', 'info');

                // Reload
                location.reload();
            }
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Settings.init();
});

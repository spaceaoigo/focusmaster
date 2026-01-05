/**
 * Main App Module
 */

// View switching
function showView(viewName) {
    const views = document.querySelectorAll('.view');
    const navLinks = document.querySelectorAll('.nav-link');

    views.forEach(view => {
        view.classList.remove('active');
        if (view.id === viewName + 'View') {
            view.classList.add('active');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewName) {
            link.classList.add('active');
        }
    });

    // Refresh stats when showing stats view
    if (viewName === 'stats' && typeof Stats !== 'undefined') {
        Stats.render();
    }

    // Refresh tasks when showing tasks view
    if (viewName === 'tasks' && typeof Tasks !== 'undefined') {
        Tasks.render();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Navigation handling
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            showView(link.dataset.view);
        });
    });

    // Check for PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Could show install button here
        console.log('PWA install available');
    });

    // Handle visibility change (for timer accuracy)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Refresh display when coming back
            if (typeof Timer !== 'undefined') {
                Timer.updateDisplay();
            }
        }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing
        if (e.target.matches('input, textarea, select')) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (typeof Timer !== 'undefined') {
                    if (Timer.isRunning) {
                        Timer.pause();
                    } else {
                        Timer.start();
                    }
                }
                break;
            case 'KeyR':
                if (typeof Timer !== 'undefined') {
                    Timer.reset();
                }
                break;
            case 'Digit1':
                showView('timer');
                break;
            case 'Digit2':
                showView('tasks');
                break;
            case 'Digit3':
                showView('stats');
                break;
            case 'Digit4':
                showView('settings');
                break;
        }
    });

    // Service Worker registration for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('SW registered:', registration.scope);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        });
    }

    // Apply saved theme
    const settings = SettingsStorage.get();
    if (settings.theme && settings.theme !== 'system') {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }

    console.log('Focus Flow initialized');
});

// Wake lock to prevent screen sleep during timer
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
            console.log('Wake Lock acquired');
        } catch (err) {
            console.log('Wake Lock error:', err.message);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// Export for use in timer
window.requestWakeLock = requestWakeLock;
window.releaseWakeLock = releaseWakeLock;
window.showView = showView;

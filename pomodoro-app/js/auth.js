/**
 * Authentication Module - Google Only
 * Uses Firebase Authentication with Google Sign-In
 */

const Auth = {
    currentUser: null,
    storageKey: 'auth',
    firebaseApp: null,
    firebaseAuth: null,
    isInitialized: false,

    // Initialize auth
    async init() {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return;
        }

        // Check config
        if (typeof firebaseConfig === 'undefined' || firebaseConfig.apiKey === 'YOUR_API_KEY') {
            console.warn('Firebase not configured. Please update js/firebase-config.js');
            return;
        }

        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                this.firebaseApp = firebase.initializeApp(firebaseConfig);
            } else {
                this.firebaseApp = firebase.apps[0];
            }

            this.firebaseAuth = firebase.auth();
            this.isInitialized = true;

            // Listen for auth state changes
            this.firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    this.handleSignIn(user);
                } else {
                    this.handleSignOut();
                }
            });

            console.log('Firebase Auth initialized');
        } catch (error) {
            console.error('Firebase init error:', error);
        }
    },

    // Handle successful sign in
    handleSignIn(firebaseUser) {
        this.currentUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'ユーザー',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
        };

        Storage.set(this.storageKey, {
            isLoggedIn: true,
            user: this.currentUser
        });

        this.updateUI();
    },

    // Handle sign out
    handleSignOut() {
        this.currentUser = null;
        Storage.remove(this.storageKey);
        this.updateUI();
    },

    // Sign in with Google
    async signInWithGoogle() {
        if (!this.isInitialized) {
            showToast('認証システムが初期化されていません。firebase-config.jsを設定してください。', 'error');
            return { success: false };
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await this.firebaseAuth.signInWithPopup(provider);

            showToast(`ようこそ、${result.user.displayName}さん！`, 'success');

            // Hide auth modal
            document.getElementById('authModal')?.classList.remove('active');

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Sign in error:', error);

            let message = 'ログインに失敗しました';
            if (error.code === 'auth/popup-closed-by-user') {
                message = 'ログインがキャンセルされました';
            } else if (error.code === 'auth/popup-blocked') {
                message = 'ポップアップがブロックされました';
            } else if (error.code === 'auth/network-request-failed') {
                message = 'ネットワークエラーです';
            }

            showToast(message, 'error');
            return { success: false };
        }
    },

    // Sign out
    async signOut() {
        if (this.firebaseAuth) {
            try {
                await this.firebaseAuth.signOut();
                showToast('ログアウトしました', 'info');
                showView('timer');
            } catch (error) {
                console.error('Sign out error:', error);
            }
        }
    },

    // Check if logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },

    // Get current user
    getUser() {
        return this.currentUser;
    },

    // Update UI based on auth state
    updateUI() {
        const loggedOutState = document.getElementById('loggedOutState');
        const loggedInState = document.getElementById('loggedInState');
        const userAvatarBtn = document.getElementById('userAvatarBtn');
        const userAvatarLarge = document.getElementById('userAvatarLarge');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');

        if (this.isLoggedIn()) {
            if (loggedOutState) loggedOutState.style.display = 'none';
            if (loggedInState) loggedInState.style.display = 'block';

            // Show profile photo or initial
            if (this.currentUser.photoURL) {
                if (userAvatarBtn) {
                    userAvatarBtn.innerHTML = `<img src="${this.currentUser.photoURL}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                }
                if (userAvatarLarge) {
                    userAvatarLarge.innerHTML = `<img src="${this.currentUser.photoURL}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                }
            } else {
                const initial = this.currentUser.name.charAt(0).toUpperCase();
                if (userAvatarBtn) {
                    userAvatarBtn.innerHTML = `<span>${initial}</span>`;
                    userAvatarBtn.style.background = 'var(--color-primary)';
                    userAvatarBtn.style.color = 'white';
                }
                if (userAvatarLarge) userAvatarLarge.textContent = initial;
            }

            if (userName) userName.textContent = this.currentUser.name;
            if (userEmail) userEmail.textContent = this.currentUser.email;
        } else {
            if (loggedOutState) loggedOutState.style.display = 'block';
            if (loggedInState) loggedInState.style.display = 'none';

            if (userAvatarBtn) {
                userAvatarBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 21a8 8 0 10-16 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
                userAvatarBtn.style.background = '';
                userAvatarBtn.style.color = '';
            }
        }
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('authModal');

    // Show modal
    const showAuthModal = () => {
        authModal?.classList.add('active');
    };

    // Hide modal
    const hideAuthModal = () => {
        authModal?.classList.remove('active');
    };

    // User avatar click
    document.getElementById('userAvatarBtn')?.addEventListener('click', () => {
        if (Auth.isLoggedIn()) {
            showView('settings');
        } else {
            showAuthModal();
        }
    });

    // Show login buttons
    document.getElementById('showLoginBtn')?.addEventListener('click', showAuthModal);
    document.getElementById('showRegisterBtn')?.addEventListener('click', showAuthModal);

    // Close modal
    document.getElementById('closeAuthModal')?.addEventListener('click', hideAuthModal);

    // Google login button
    document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
        Auth.signInWithGoogle();
    });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('ログアウトしますか？')) {
            Auth.signOut();
        }
    });

    // Click outside to close
    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) hideAuthModal();
    });

    // Initialize
    Auth.init();
});

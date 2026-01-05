/**
 * Firebase Configuration Template
 * 
 * 使用方法:
 * 1. https://console.firebase.google.com/ でプロジェクトを作成
 * 2. Authentication > Sign-in method > Google を有効化
 * 3. プロジェクト設定 > マイアプリ > ウェブアプリを追加
 * 4. 下記の firebaseConfig を実際の値に置き換え
 * 5. ファイル名を firebase-config.js に変更
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Export for use in other modules
window.firebaseConfig = firebaseConfig;

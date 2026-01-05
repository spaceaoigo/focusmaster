# Focus Flow - Pomodoro タイマー

![Focus Flow](https://img.shields.io/badge/version-2.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

集中力を高め、生産性を向上させるPomodoroタイマー付き作業管理ツール。

## ✨ 主な機能

### 🍅 Pomodoro タイマー
- 作業/休憩時間のカスタマイズ
- 視覚的なプログレスリング
- デイリーゴール進捗表示
- フルスクリーンモード

### 🎵 BGM & サウンド
- **10種類のBGM**: Lo-Fi Beats、ジャズ、雨音、カフェ、焚き火など
- カウントダウン音（残り5秒）
- セッション完了通知音
- 個別の音量調整

### 📊 統計 & 実績
- 生産性スコア
- 活動ヒートマップ
- 14種類の実績バッジ
- 日別/週別/月別グラフ

### ✅ タスク管理
- 優先度設定
- ドラッグ&ドロップ並び替え
- Pomodoroタイマー連携

### 🔐 認証
- **Googleログイン**（Firebase）
- ローカルアカウント

## 🚀 デプロイ方法

### 静的ホスティング（Netlify/Vercel/GitHub Pages）

1. **そのままデプロイ**
   ```bash
   # すべてのファイルをアップロードするだけ
   ```

2. **Firebase認証を使用する場合**
   - [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
   - Authentication > Sign-in method > Google を有効化
   - `js/firebase-config.template.js` を `js/firebase-config.js` にコピー
   - 設定値を入力
   - `index.html` の `</body>` 前に以下を追加:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
   <script src="js/firebase-config.js"></script>
   ```

### ローカル開発

```bash
# 任意のHTTPサーバーで起動
npx serve .
# または
python -m http.server 8000
```

## 📁 ファイル構成

```
pomodoro-app/
├── index.html          # メインHTML
├── manifest.json       # PWAマニフェスト
├── sw.js              # Service Worker
├── css/               # スタイル
│   ├── variables.css  # デザイントークン
│   ├── base.css       # 基本スタイル
│   ├── components.css # コンポーネント
│   ├── timer.css      # タイマー
│   ├── tasks.css      # タスク
│   ├── stats.css      # 統計
│   ├── auth.css       # 認証
│   └── responsive.css # レスポンシブ
├── js/
│   ├── utils.js       # ユーティリティ
│   ├── storage.js     # ストレージ
│   ├── sound.js       # サウンドシステム
│   ├── auth.js        # 認証
│   ├── timer.js       # タイマー
│   ├── tasks.js       # タスク管理
│   ├── stats.js       # 統計
│   ├── settings.js    # 設定
│   └── app.js         # アプリ初期化
└── assets/            # アイコン等
```

## 🛠 技術スタック

- **フロントエンド**: 純粋HTML/CSS/JavaScript
- **サウンド**: Web Audio API
- **グラフ**: Chart.js
- **認証**: Firebase Authentication（オプション）
- **PWA**: Service Worker + manifest.json

## 📱 対応ブラウザ

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- モバイルブラウザ

## 📄 ライセンス

MIT License

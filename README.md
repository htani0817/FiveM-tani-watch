# Tani Watch - FiveM YouTube ビデオプレイヤー

FiveM用のビデオ視聴スクリプトです。ゲーム内でYouTubeの動画を視聴・共有できます。

## 機能

- `/watch` コマンドでURL入力画面を表示
- YouTube動画に対応
- **画面共有機能** - 付近のプレイヤーに動画を共有
- モダンなダークテーマUI
- 音量調整スライダー＆ミュート機能
- ペーストボタンでURL簡単入力
- ESCキーまたは×ボタンで閉じる

## インストール方法

1. `tani-watch` フォルダを `resources` ディレクトリにコピー
2. `server.cfg` に以下を追加:
   ```
   ensure tani-watch
   ```
3. サーバーを再起動

## 使用方法

### 個人で視聴
1. ゲーム内で `/watch` を入力
2. URL入力画面が表示される
3. YouTubeのURLを貼り付け
4. 「再生」ボタンをクリック（またはEnterキー）
5. 動画が再生される

### 画面共有
1. ゲーム内で `/watch` を入力
2. YouTubeのURLを貼り付け
3. 「画面共有」ボタンをクリック
4. 付近のプレイヤー一覧が表示される（50m以内）
5. 共有したいプレイヤーをクリックして選択（複数選択可）
6. 「○人に共有」ボタンをクリック
7. 選択したプレイヤーの画面にも同じ動画が表示される

### 閉じ方
- ESCキー
- ×ボタン
- 「戻る」ボタンでURL入力画面に戻る

## 対応URL形式

### YouTube
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

## 設定

`client.lua` の以下の値を変更することで、付近プレイヤーの検出距離を調整できます：

```lua
local NEARBY_DISTANCE = 50.0 -- 付近プレイヤーの検出距離（メートル）
```

## ファイル構成

```
tani-watch/
├── fxmanifest.lua    # リソース定義
├── client.lua        # クライアントスクリプト
├── server.lua        # サーバースクリプト（共有機能）
├── html/
│   ├── index.html    # UI構造
│   ├── style.css     # スタイル
│   └── script.js     # UI制御
└── README.md
```

## 注意事項

- YouTubeの埋め込みプレイヤーを使用しています
- 一部の動画は埋め込みが無効になっている場合があります
- **TwitchはFiveMのNUI環境のセキュリティ制限により非対応です**
- 画面共有は50m以内のプレイヤーにのみ可能です

## ライセンス

MIT License

# Tani Watch - FiveM YouTube/Twitch ビデオプレイヤー

FiveM用のビデオ視聴スクリプトです。ゲーム内でYouTubeとTwitchの動画を視聴・共有できます。

## 機能

- `/watch` コマンドでURL入力画面を表示
- **YouTube動画に対応**
- **Twitchライブ配信・VOD・クリップに対応** (DUI技術使用)
- **画面共有機能** - 付近のプレイヤーに動画を共有
- モダンなオーバーレイUI
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
3. YouTubeまたはTwitchのURLを貼り付け
4. 「再生」ボタンをクリック（またはEnterキー）
5. 動画が画面中央に表示される

### 画面共有
1. ゲーム内で `/watch` を入力
2. URLを貼り付け
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

### Twitch
- ライブ配信: `https://www.twitch.tv/CHANNEL_NAME`
- VOD: `https://www.twitch.tv/videos/VIDEO_ID`
- クリップ: `https://www.twitch.tv/CHANNEL/clip/CLIP_ID`
- クリップ: `https://clips.twitch.tv/CLIP_ID`

## 技術仕様

このスクリプトは **DUI (DirectUI)** 技術を使用しています。これにより：

- FiveM NUI環境のCSP (Content Security Policy) 制限を回避
- Twitch埋め込みプレイヤーが正常に動作
- ゲーム内3D空間にビデオをレンダリング可能

## 設定

`client.lua` の以下の値を変更することでカスタマイズできます：

```lua
local NEARBY_DISTANCE = 50.0 -- 付近プレイヤーの検出距離（メートル）
local duiWidth = 1280        -- DUI解像度（幅）
local duiHeight = 720        -- DUI解像度（高さ）
```

## ファイル構成

```
tani-watch/
├── fxmanifest.lua    # リソース定義
├── client.lua        # クライアントスクリプト（DUI制御）
├── server.lua        # サーバースクリプト（共有機能）
├── html/
│   ├── index.html    # メインUI（URL入力・コントロール）
│   ├── style.css     # スタイル
│   ├── script.js     # UI制御
│   └── player.html   # DUI用プレイヤー（YouTube/Twitch SDK）
└── README.md
```

## 注意事項

- YouTubeの一部の動画は埋め込みが無効になっている場合があります
- Twitchの一部コンテンツは地域制限がある場合があります
- 画面共有は50m以内のプレイヤーにのみ可能です
- 動画は画面中央にオーバーレイ表示されます

## クレジット

- DUI技術の参考: [ptelevision](https://github.com/PickleModifications/ptelevision)

## ライセンス

MIT License

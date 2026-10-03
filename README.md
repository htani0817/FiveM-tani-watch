# Tani Watch - FiveM YouTube/Twitch ビデオプレイヤー

FiveM用のビデオ視聴スクリプトです。ゲーム内でYouTubeとTwitchの動画を視聴・共有できます。

## 機能

- `/watch` コマンドでURL入力画面を表示
- **YouTube動画に対応**
- **Twitchライブ配信・VOD・クリップに対応** (DUI技術使用)
- **画面共有機能** - 付近のプレイヤーに動画を共有（受け取る側が承諾してから再生）
- モダンなオーバーレイUI
- 音量調整スライダー＆ミュート機能
- ペーストボタンでURL簡単入力
- ESCキーまたは×ボタンで閉じる
- 視聴中も歩く・運転するなどのゲーム操作が可能（設定で切り替え）

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
4. 付近のプレイヤー一覧が表示される（50m以内。開いている間は2秒ごとに自動更新）
5. 共有したいプレイヤーをクリックして選択（複数選択可。「全選択」も使えます）
6. 「○人に共有」ボタンをクリック
7. 共有した本人も同じ動画を再生し、相手には承諾確認が出る
8. 相手が視聴・辞退した結果は、画面右上の通知で届く

### 共有を受け取る
- 動画が共有されると、画面上部に確認が出ます。**承諾するまで再生も入力の奪取もしません。**
- 「視聴する」ボタン、または `Y` キーで視聴開始。「辞退」ボタン、または `N` キーで辞退（初期設定のキー。`ESC` → 設定 → キー割り当て → FiveM から変更できます）
- 15秒以内に応答しないと辞退扱いになります
- `/watchdnd` または入力画面の「共有を受け取る」スイッチで、受信のオン/オフを切り替えられます（設定はクライアントに保存されます）
- `/watchblock` で、最後に共有してきた人からの共有をブロックできます（再接続するまで有効）

### 閉じ方
- ESCキー
- ×ボタン
- 「戻る」ボタンでURL入力画面に戻る

## コマンドとキー

| 操作 | 内容 |
| --- | --- |
| `/watch` | URL入力画面を開く |
| `/watchdnd` | 共有の受信をオン/オフ |
| `/watchblock` | 最後に共有してきた人をブロック |
| `Y`（初期） | 共有された動画を視聴する |
| `N`（初期） | 共有された動画を辞退する |

`N` は音声チャットの発話キーと重なることがあります。重なる場合は `config.lua` の `Config.DeclineKey` か、FiveM のキー設定で変更してください。

## 対応URL形式

URLは「許可したホストと形式に完全一致するもの」だけ受け付け、動画ID・チャンネル名などを取り出して作り直したURLだけを使います。`https://` が無くても貼り付けられます。

### YouTube
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/live/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `m.youtube.com` / `music.youtube.com` も可

### Twitch
- ライブ配信: `https://www.twitch.tv/CHANNEL_NAME`（`?sr=a` などのクエリ付きも可）
- VOD: `https://www.twitch.tv/videos/VIDEO_ID`
- クリップ: `https://www.twitch.tv/CHANNEL/clip/CLIP_ID`
- クリップ: `https://clips.twitch.tv/CLIP_ID`

## 技術仕様

このスクリプトは **DUI (DirectUI)** 技術を使用しています。これにより：

- FiveM NUI環境のCSP (Content Security Policy) 制限を回避
- Twitch埋め込みプレイヤーが正常に動作
- ゲーム内3D空間にビデオをレンダリング可能

動画は画面の縦横比に合わせて 16:9 のまま描画します（ウルトラワイドでも歪みません）。

## 設定

`config.lua` の値を変更することでカスタマイズできます（変更後は `restart tani-watch`）。

| 設定 | 初期値 | 内容 |
| --- | --- | --- |
| `Config.Debug` | `false` | `true` で詳細ログを出す |
| `Config.NearbyDistance` | `50.0` | 付近プレイヤーの検出距離（メートル） |
| `Config.MaxShareTargets` | `10` | 1回の共有で選べる最大人数 |
| `Config.ShareCooldownMs` | `5000` | 同じ送信者の共有間隔の下限（ミリ秒） |
| `Config.ServerDistanceCheck` | `true` | サーバー側でも距離を検証する（OneSync 必須） |
| `Config.ServerDistanceMargin` | `15.0` | サーバー側の距離検証に足す余裕（メートル） |
| `Config.RequireAcceptance` | `true` | 受け取る側に承諾確認を出す。`false` にすると届いた動画を即再生する |
| `Config.ShareRequestTimeoutMs` | `15000` | 承諾確認の待ち時間（ミリ秒） |
| `Config.AllowGameInputWhileWatching` | `true` | 視聴中もキーボードでのゲーム操作を許可する |
| `Config.AcceptKey` / `Config.DeclineKey` | `Y` / `N` | 承諾・辞退のキーの初期値 |
| `Config.MaxUrlLength` | `300` | 受け付けるURLの最大長 |
| `Config.DuiWidth` / `Config.DuiHeight` | `1280` / `720` | DUI解像度 |
| `Config.DuiReadyTimeoutMs` | `8000` | DUI の準備を待つ上限（ミリ秒） |

## セキュリティ

画面共有のイベントは、クライアントから届く値を信用せず、サーバー側で検証します。

- 送信者の名前とIDは、サーバーが `source` から取得します（クライアントの申告は使いません）
- URLは `shared.lua` で許可リストと完全一致で検証し、正規化したURLだけを中継します（`youtube.com` を含むだけの別サイトのURLは通りません）
- 共有先は、型・件数の上限・在線・重複・距離（OneSync 時）を検証します
- 同じ送信者の連続共有は `Config.ShareCooldownMs` で制限します
- 受け取る側でもURLを再検証し、承諾するまで再生や入力の奪取をしません

**外部サーバーへの通信について**: 動画を再生するとき、プレイヤーのPCが YouTube（`www.youtube.com`）または Twitch（`player.twitch.tv` / `clips.twitch.tv`）へ直接接続します。これらのスクリプトは配信元が更新するため SRI（改ざん検知）は付けられません。動画を再生しない限り外部へは接続しません。UI フォント（Outfit）はリソースに同梱しており、Google Fonts へは接続しません。

**OneSync について**: サーバー側の距離検証は OneSync が有効なサーバーでのみ働きます。サーバーから座標を取れない環境では、距離の検証だけを自動でスキップします（他の検証は常に有効です）。

## ファイル構成

```
tani-watch/
├── fxmanifest.lua    # リソース定義
├── config.lua        # 設定（client / server 共通）
├── shared.lua        # URL検証などの共通処理（client / server 共通）
├── client.lua        # クライアントスクリプト（DUI制御・共有の受信）
├── server.lua        # サーバースクリプト（共有の検証と中継）
├── html/
│   ├── index.html    # メインUI（URL入力・コントロール・承諾確認）
│   ├── style.css     # スタイル
│   ├── script.js     # UI制御
│   ├── player.html   # DUI用プレイヤー（YouTube/Twitch SDK）
│   └── fonts/        # 同梱フォント（Outfit、SIL Open Font License）
└── README.md
```

## 注意事項

- YouTubeの一部の動画は埋め込みが無効になっている場合があります（理由は画面に表示されます）
- Twitchの一部コンテンツは地域制限がある場合があります
- Twitchのクリップは、埋め込みの仕様上、音量の操作ができません
- 画面共有は `Config.NearbyDistance` 以内のプレイヤーにのみ可能です
- 動画は画面中央にオーバーレイ表示されます
- リソースのフォルダ名を変えても動作します（リソース名は実行時に取得します）

## 更新履歴

### 2.2.0
- 【セキュリティ】共有イベントの送信者を `source` から取得、URLを許可リストで完全一致検証、共有先・人数・距離・頻度をサーバーで検証
- 【セキュリティ】共有を受け取る側に承諾確認を追加（受信オフ・ブロックも可能）
- 【不具合修正】共有した本人の画面が黒画面になる問題、Twitchの共有が無言で捨てられる問題、通信失敗でも再生中画面になる問題、ミュートの状態がずれる問題、一覧の選択人数がずれる問題
- 【安定化】DUIの準備を `IsDuiAvailable` と準備完了通知で待つ、YouTube/Twitchの読み込み失敗・埋め込み不可を画面に表示、JS側にESC処理を追加、リソース停止時に入力フォーカスを解除
- 【UI/UX】付近プレイヤー一覧の自動更新と全選択、共有結果のトースト通知、処理中表示、貼り付け失敗時の案内、日本語入力の確定Enterで再生しない、視聴中のゲーム操作を許可、読み取りやすい配色とフォーカス表示、キーボード操作とスクリーンリーダー対応
- 【その他】設定を `config.lua` に分離、リソース名の直書きを廃止、フォントを同梱、アイドル時の負荷を軽減

## クレジット

- DUI技術の参考: [ptelevision](https://github.com/PickleModifications/ptelevision)
- フォント: [Outfit](https://github.com/Outfitio/Outfit-Fonts)（SIL Open Font License 1.1）

## ライセンス

MIT License

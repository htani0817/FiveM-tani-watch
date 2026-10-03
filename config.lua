-- tani-watch 設定ファイル（client / server の両方から読み込まれる）
Config = {}

-- デバッグログ（true にすると client / server で詳細ログを出す）
Config.Debug = false

-- ================== 共有・視聴 ==================

-- 付近プレイヤーとして扱う距離（メートル）
Config.NearbyDistance = 50.0

-- 1回の共有で選べる最大人数
Config.MaxShareTargets = 10

-- 同じ送信者が続けて共有できる間隔の下限（ミリ秒）
Config.ShareCooldownMs = 5000

-- サーバ側でも距離を検証する（OneSync 必須。サーバから座標を取れない環境では自動でスキップ）
Config.ServerDistanceCheck = true

-- サーバ側の距離検証に足す余裕（メートル。クライアント側の算出とのずれを吸収する）
Config.ServerDistanceMargin = 15.0

-- 共有を受け取る側に承諾確認を出す（false にすると届いた動画を即再生する）
Config.RequireAcceptance = true

-- 承諾確認の待ち時間（ミリ秒。超えたら辞退扱い）
Config.ShareRequestTimeoutMs = 15000

-- 視聴中もキーボードでのゲーム操作（歩く・運転する）を許可する
Config.AllowGameInputWhileWatching = true

-- 承諾・辞退のキー（初期値。FiveM のキー設定から各自で変更できる）
Config.AcceptKey = 'Y'
Config.DeclineKey = 'N'

-- ================== URL ==================

-- 受け付けるURLの最大長
Config.MaxUrlLength = 300

-- ================== DUI ==================

-- DUI の解像度
Config.DuiWidth = 1280
Config.DuiHeight = 720

-- DUI の準備を待つ上限（ミリ秒）
Config.DuiReadyTimeoutMs = 8000

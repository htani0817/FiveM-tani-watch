local isOpen = false
local isPlaying = false
local NEARBY_DISTANCE = 50.0

-- DUI関連
local duiObject = nil
local duiBrowser = nil
local duiIsReady = false
local txd = nil
local txn = 'tani_watch_txd'
local duiWidth = 1280
local duiHeight = 720
local currentVolume = 50

-- DUIを作成
function CreateDuiPlayer()
    if duiObject then return end
    
    local url = "https://cfx-nui-tani-watch/html/player.html"
    duiObject = CreateDui(url, duiWidth, duiHeight)
    
    -- テクスチャを作成
    txd = CreateRuntimeTxd('tani_watch_dict')
    local duiHandle = GetDuiHandle(duiObject)
    CreateRuntimeTextureFromDuiHandle(txd, txn, duiHandle)
    
    duiIsReady = true
    print("[tani-watch] DUI Player created")
end

-- DUIを破棄
function DestroyDuiPlayer()
    if duiObject then
        DestroyDui(duiObject)
        duiObject = nil
        duiIsReady = false
        print("[tani-watch] DUI Player destroyed")
    end
end

-- DUIにメッセージを送信
function SendDuiAction(action, data)
    if not duiObject then return end
    
    local message = { action = action }
    if data then
        for k, v in pairs(data) do
            message[k] = v
        end
    end
    
    SendDuiMessage(duiObject, json.encode(message))
end

-- DUIで動画を再生
function PlayDuiVideo(url)
    if not duiObject then
        CreateDuiPlayer()
        Citizen.Wait(500) -- DUIの初期化を待つ
    end
    
    SendDuiAction('play', { url = url })
    isPlaying = true
end

-- DUIの動画を停止
function StopDuiVideo()
    SendDuiAction('stop')
    isPlaying = false
end

-- DUIの音量を設定
function SetDuiVolume(volume)
    currentVolume = volume
    SendDuiAction('volume', { volume = volume })
end

-- /watch コマンドを登録
RegisterCommand('watch', function(source, args, rawCommand)
    if isOpen then
        return
    end
    
    OpenUrlInput()
end, false)

-- URL入力UIを開く
function OpenUrlInput()
    isOpen = true
    
    -- DUIを事前に作成
    if not duiObject then
        CreateDuiPlayer()
    end
    
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "openInput"
    })
end

-- プレイヤーを閉じる
function ClosePlayer()
    if isOpen or isPlaying then
        isOpen = false
        isPlaying = false
        SetNuiFocus(false, false)
        SendNUIMessage({
            action = "close"
        })
        StopDuiVideo()
    end
end

-- NUIからのコールバック（閉じる）
RegisterNUICallback('close', function(data, cb)
    ClosePlayer()
    cb('ok')
end)

-- NUIからのコールバック（動画再生）
RegisterNUICallback('playVideo', function(data, cb)
    local url = data.url
    print("[tani-watch] playVideo called with URL: " .. tostring(url))
    
    if not url or url == "" then
        cb({ success = false, message = "URLを入力してください" })
        return
    end
    
    -- YouTube または Twitch のURLかチェック
    local isYouTube = string.find(url, "youtube.com") or string.find(url, "youtu.be")
    local isTwitch = string.find(url, "twitch.tv") or string.find(url, "clips.twitch.tv")
    
    if not isYouTube and not isTwitch then
        cb({ success = false, message = "YouTubeまたはTwitchのURLを入力してください" })
        return
    end
    
    -- DUIで再生
    PlayDuiVideo(url)
    
    print("[tani-watch] Success: Playing video via DUI")
    cb({ success = true })
end)

-- NUIからのコールバック（音量変更）
RegisterNUICallback('volumeChange', function(data, cb)
    local volume = data.volume or 50
    SetDuiVolume(volume)
    cb('ok')
end)

-- NUIからのコールバック（動画停止）
RegisterNUICallback('stopVideo', function(data, cb)
    StopDuiVideo()
    cb('ok')
end)

-- NUIからのコールバック（入力画面に戻る）
RegisterNUICallback('backToInput', function(data, cb)
    StopDuiVideo()
    isPlaying = false
    cb('ok')
end)

-- ================== 画面共有機能 ==================

function GetNearbyPlayers()
    local players = {}
    local myPed = PlayerPedId()
    local myCoords = GetEntityCoords(myPed)
    local myPlayerId = PlayerId()
    
    for _, playerId in ipairs(GetActivePlayers()) do
        if playerId ~= myPlayerId then
            local targetPed = GetPlayerPed(playerId)
            local targetCoords = GetEntityCoords(targetPed)
            local distance = #(myCoords - targetCoords)
            
            if distance <= NEARBY_DISTANCE then
                local playerName = GetPlayerName(playerId)
                local serverId = GetPlayerServerId(playerId)
                
                table.insert(players, {
                    id = serverId,
                    name = playerName,
                    distance = distance
                })
            end
        end
    end
    
    table.sort(players, function(a, b)
        return a.distance < b.distance
    end)
    
    return players
end

RegisterNUICallback('getNearbyPlayers', function(data, cb)
    local players = GetNearbyPlayers()
    
    SendNUIMessage({
        action = "updateNearbyPlayers",
        players = players
    })
    
    cb('ok')
end)

RegisterNUICallback('shareVideo', function(data, cb)
    local url = data.url
    local targetPlayers = data.targetPlayers
    
    if not url or url == "" then
        cb({ success = false, message = "URLがありません" })
        return
    end
    
    if not targetPlayers or #targetPlayers == 0 then
        cb({ success = false, message = "共有先が選択されていません" })
        return
    end
    
    local myName = GetPlayerName(PlayerId())
    local myServerId = GetPlayerServerId(PlayerId())
    
    print("[tani-watch] Sharing video to " .. #targetPlayers .. " players")
    
    TriggerServerEvent('tani-watch:shareVideo', url, targetPlayers, myName, myServerId)
    
    cb({ success = true })
end)

RegisterNetEvent('tani-watch:receiveShare')
AddEventHandler('tani-watch:receiveShare', function(url, fromPlayerName, fromPlayerId)
    print("[tani-watch] Received share from " .. fromPlayerName)
    
    isOpen = true
    isPlaying = true
    
    -- DUIを作成して再生
    if not duiObject then
        CreateDuiPlayer()
        Citizen.Wait(500)
    end
    PlayDuiVideo(url)
    
    SetNuiFocus(true, true)
    
    SendNUIMessage({
        action = "receiveShare",
        url = url,
        fromPlayer = fromPlayerName
    })
end)

-- ================== 描画スレッド ==================

-- DUIをスクリーンに描画
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        
        if isPlaying and duiObject and duiIsReady then
            -- 画面中央に動画を表示（16:9のアスペクト比）
            local screenW, screenH = 0.7, 0.7 * (9/16) -- 画面の70%幅
            local screenX, screenY = 0.5, 0.45 -- 少し上寄り
            
            SetScriptGfxDrawBehindPausemenu(true)
            DrawSprite('tani_watch_dict', txn, screenX, screenY, screenW, screenH, 0.0, 255, 255, 255, 255)
            SetScriptGfxDrawBehindPausemenu(false)
        end
    end
end)

-- ================== キー入力処理 ==================

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        if isOpen then
            DisableControlAction(0, 200, true) -- ESC
            if IsDisabledControlJustReleased(0, 200) then
                ClosePlayer()
            end
        end
    end
end)

-- リソース停止時にクリーンアップ
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        DestroyDuiPlayer()
    end
end)

-- ヘルプメッセージ
TriggerEvent('chat:addSuggestion', '/watch', 'YouTube/Twitchのビデオを視聴・共有')

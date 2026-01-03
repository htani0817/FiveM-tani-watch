local isOpen = false
local NEARBY_DISTANCE = 50.0 -- 付近プレイヤーの検出距離（メートル）

-- /watch コマンドを登録（URL入力UIを開く）
RegisterCommand('watch', function(source, args, rawCommand)
    if isOpen then
        return
    end
    
    OpenUrlInput()
end, false)

-- URL入力UIを開く
function OpenUrlInput()
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "openInput"
    })
end

-- ビデオプレイヤーを閉じる
function ClosePlayer()
    if isOpen then
        isOpen = false
        SetNuiFocus(false, false)
        SendNUIMessage({
            action = "close"
        })
    end
end

-- NUIからのコールバック（閉じるボタン）
RegisterNUICallback('close', function(data, cb)
    ClosePlayer()
    cb('ok')
end)

-- NUIからのコールバック（URL送信）
RegisterNUICallback('playVideo', function(data, cb)
    local url = data.url
    print("[tani-watch] playVideo called with URL: " .. tostring(url))
    
    -- URLの検証
    if not url or url == "" then
        print("[tani-watch] Error: Empty URL")
        cb({ success = false, message = "URLを入力してください" })
        return
    end
    
    -- Twitchは非対応
    if string.find(url, "twitch.tv") then
        print("[tani-watch] Error: Twitch not supported")
        cb({ success = false, message = "TwitchはFiveMのNUI環境では再生できません" })
        return
    end
    
    if not (string.find(url, "youtube.com") or string.find(url, "youtu.be")) then
        print("[tani-watch] Error: Invalid URL format")
        cb({ success = false, message = "YouTubeのURLを入力してください" })
        return
    end
    
    -- 成功
    print("[tani-watch] Success: Playing video")
    cb({ success = true })
end)

-- NUIからの音量変更コールバック
RegisterNUICallback('volumeChange', function(data, cb)
    cb('ok')
end)

-- ================== 画面共有機能 ==================

-- 付近プレイヤーを取得
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
    
    -- 距離でソート
    table.sort(players, function(a, b)
        return a.distance < b.distance
    end)
    
    return players
end

-- NUIからのコールバック（付近プレイヤー取得）
RegisterNUICallback('getNearbyPlayers', function(data, cb)
    local players = GetNearbyPlayers()
    
    -- NUIに送信
    SendNUIMessage({
        action = "updateNearbyPlayers",
        players = players
    })
    
    cb('ok')
end)

-- NUIからのコールバック（画面共有）
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
    
    -- 自分の情報を取得
    local myName = GetPlayerName(PlayerId())
    local myServerId = GetPlayerServerId(PlayerId())
    
    print("[tani-watch] Sharing video to " .. #targetPlayers .. " players")
    
    -- サーバーイベントを通じて共有
    TriggerServerEvent('tani-watch:shareVideo', url, targetPlayers, myName, myServerId)
    
    cb({ success = true })
end)

-- サーバーからの共有受信
RegisterNetEvent('tani-watch:receiveShare')
AddEventHandler('tani-watch:receiveShare', function(url, fromPlayerName, fromPlayerId)
    print("[tani-watch] Received share from " .. fromPlayerName .. " (ID: " .. fromPlayerId .. ")")
    
    -- UIを開いて動画を再生
    isOpen = true
    SetNuiFocus(true, true)
    
    SendNUIMessage({
        action = "receiveShare",
        url = url,
        fromPlayer = fromPlayerName
    })
end)

-- ================== キー入力処理 ==================

-- ESCキーで閉じる
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

-- ヘルプメッセージ
TriggerEvent('chat:addSuggestion', '/watch', 'YouTubeのビデオを視聴・共有')

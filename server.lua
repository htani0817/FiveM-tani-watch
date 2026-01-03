-- tani-watch サーバースクリプト
-- 画面共有イベントの中継

RegisterNetEvent('tani-watch:shareVideo')
AddEventHandler('tani-watch:shareVideo', function(url, targetPlayers, fromPlayerName, fromPlayerId)
    local source = source
    
    -- URLのバリデーション
    if not url or url == "" then
        return
    end
    
    -- YouTubeのURLかチェック
    if not (string.find(url, "youtube.com") or string.find(url, "youtu.be")) then
        return
    end
    
    print("[tani-watch] Player " .. fromPlayerName .. " (ID: " .. fromPlayerId .. ") is sharing video to " .. #targetPlayers .. " players")
    
    -- ターゲットプレイヤーに共有を送信
    for _, targetServerId in ipairs(targetPlayers) do
        if targetServerId ~= source then
            TriggerClientEvent('tani-watch:receiveShare', targetServerId, url, fromPlayerName, fromPlayerId)
            print("[tani-watch] Sent share to player ID: " .. targetServerId)
        end
    end
end)

-- リソース開始時のログ
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        print("[tani-watch] Resource started - Screen sharing enabled")
    end
end)

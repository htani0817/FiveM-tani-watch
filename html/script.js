// DOM要素 - URL入力画面
const inputContainer = document.getElementById('input-container');
const urlInput = document.getElementById('url-input');
const pasteBtn = document.getElementById('paste-btn');
const playBtn = document.getElementById('play-btn');
const inputCloseBtn = document.getElementById('input-close-btn');
const errorMessage = document.getElementById('error-message');

// DOM要素 - 画面共有
const shareBtn = document.getElementById('share-btn');
const playerListContainer = document.getElementById('player-list-container');
const playerList = document.getElementById('player-list');
const playerCount = document.getElementById('player-count');
const shareConfirmBtn = document.getElementById('share-confirm-btn');

// DOM要素 - プレイヤー画面
const playerContainer = document.getElementById('player-container');
const videoFrame = document.getElementById('video-frame');
const playerCloseBtn = document.getElementById('player-close-btn');
const backBtn = document.getElementById('back-btn');
const volumeBtn = document.getElementById('volume-btn');
const volumeSlider = document.getElementById('volume-slider');
const volumeFill = document.getElementById('volume-fill');
const volumeValue = document.getElementById('volume-value');
const volumeIcon = document.getElementById('volume-icon');
const platformBadge = document.getElementById('platform-badge');

let currentVolume = 50;
let isMuted = false;
let previousVolume = 50;
let selectedPlayers = new Set();
let nearbyPlayers = [];
let isPlayerListOpen = false;

// FiveMからのメッセージを受信
window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === 'openInput') {
        showInputScreen();
        // 付近プレイヤーを取得
        requestNearbyPlayers();
    } else if (data.action === 'close') {
        closeAll();
    } else if (data.action === 'updateNearbyPlayers') {
        // 付近プレイヤーリストを更新
        updateNearbyPlayersList(data.players);
    } else if (data.action === 'receiveShare') {
        // 画面共有を受信
        showSharedVideo(data.url, data.fromPlayer);
    }
});

// 付近プレイヤーを要求
function requestNearbyPlayers() {
    fetch('https://tani-watch/getNearbyPlayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
}

// URL入力画面を表示
function showInputScreen() {
    inputContainer.classList.remove('hidden');
    playerContainer.classList.add('hidden');
    urlInput.value = '';
    errorMessage.classList.add('hidden');
    hidePlayerList();
    urlInput.focus();
}

// プレイヤー画面を表示
function showPlayerScreen(url) {
    const embedUrl = parseVideoUrl(url);
    
    if (embedUrl) {
        videoFrame.src = embedUrl.url;
        updatePlatformBadge(embedUrl.platform);
        inputContainer.classList.add('hidden');
        playerContainer.classList.remove('hidden');
    }
}

// 全て閉じる
function closeAll() {
    inputContainer.classList.add('hidden');
    playerContainer.classList.add('hidden');
    videoFrame.src = '';
    urlInput.value = '';
    errorMessage.classList.add('hidden');
    hidePlayerList();
    removeNotifications();
}

// URL入力画面に戻る
function backToInput() {
    videoFrame.src = '';
    playerContainer.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    requestNearbyPlayers();
    urlInput.focus();
}

// URLを解析して埋め込みURLを生成
function parseVideoUrl(url) {
    // YouTube 通常動画
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
        return {
            url: `https://www.youtube.com/embed/${match[1]}?autoplay=1&enablejsapi=1`,
            platform: 'youtube'
        };
    }

    // YouTube Shorts
    match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (match) {
        return {
            url: `https://www.youtube.com/embed/${match[1]}?autoplay=1&enablejsapi=1`,
            platform: 'youtube'
        };
    }

    return null;
}

// プラットフォームバッジを更新
function updatePlatformBadge(platform) {
    platformBadge.className = 'platform-badge ' + platform;
    platformBadge.textContent = 'YouTube';
}

// エラーを表示
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

// エラーを非表示
function hideError() {
    errorMessage.classList.add('hidden');
}

// URLを検証して再生
function validateAndPlay() {
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('URLを入力してください');
        return;
    }
    
    // Twitchは非対応
    if (url.includes('twitch.tv')) {
        showError('TwitchはFiveMのNUI環境では再生できません。YouTubeをご利用ください。');
        return;
    }
    
    if (!(url.includes('youtube.com') || url.includes('youtu.be'))) {
        showError('YouTubeのURLを入力してください');
        return;
    }
    
    const embedUrl = parseVideoUrl(url);
    if (!embedUrl) {
        showError('無効なURLです。正しいURLを入力してください');
        return;
    }
    
    hideError();
    
    // サーバーに通知
    fetch('https://tani-watch/playVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.text())
    .then(text => {
        console.log('Server response:', text);
        if (!text || text === 'ok' || text === '1') {
            showPlayerScreen(url);
            return;
        }
        try {
            const data = JSON.parse(text);
            if (data.success || data.success === undefined) {
                showPlayerScreen(url);
            } else {
                showError(data.message || 'サーバーエラーが発生しました');
            }
        } catch (e) {
            showPlayerScreen(url);
        }
    })
    .catch(err => {
        console.log('Fetch error:', err);
        showPlayerScreen(url);
    });
}

// ================== 画面共有機能 ==================

// 画面共有ボタン
shareBtn.addEventListener('click', function() {
    if (isPlayerListOpen) {
        hidePlayerList();
    } else {
        showPlayerList();
        requestNearbyPlayers();
    }
});

// プレイヤーリストを表示
function showPlayerList() {
    isPlayerListOpen = true;
    playerListContainer.classList.remove('hidden');
    shareBtn.classList.add('active');
}

// プレイヤーリストを非表示
function hidePlayerList() {
    isPlayerListOpen = false;
    playerListContainer.classList.add('hidden');
    shareBtn.classList.remove('active');
    selectedPlayers.clear();
    updateShareButton();
}

// 付近プレイヤーリストを更新
function updateNearbyPlayersList(players) {
    nearbyPlayers = players || [];
    playerCount.textContent = nearbyPlayers.length + '人';
    
    if (nearbyPlayers.length === 0) {
        playerList.innerHTML = '<div class="no-players">付近にプレイヤーがいません</div>';
        return;
    }
    
    playerList.innerHTML = nearbyPlayers.map(player => `
        <div class="player-item ${selectedPlayers.has(player.id) ? 'selected' : ''}" data-id="${player.id}">
            <div class="player-checkbox">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="player-info">
                <div class="player-name">${escapeHtml(player.name)}</div>
                <div class="player-id">ID: ${player.id}</div>
            </div>
            <div class="player-distance">${player.distance.toFixed(1)}m</div>
        </div>
    `).join('');
    
    // プレイヤーアイテムにクリックイベントを設定
    playerList.querySelectorAll('.player-item').forEach(item => {
        item.addEventListener('click', function() {
            const playerId = parseInt(this.dataset.id);
            togglePlayerSelection(playerId);
            this.classList.toggle('selected');
        });
    });
    
    updateShareButton();
}

// プレイヤー選択を切り替え
function togglePlayerSelection(playerId) {
    if (selectedPlayers.has(playerId)) {
        selectedPlayers.delete(playerId);
    } else {
        selectedPlayers.add(playerId);
    }
    updateShareButton();
}

// 共有ボタンの状態を更新
function updateShareButton() {
    const count = selectedPlayers.size;
    if (count === 0) {
        shareConfirmBtn.disabled = true;
        shareConfirmBtn.querySelector('span').textContent = '選択したプレイヤーに共有';
    } else {
        shareConfirmBtn.disabled = false;
        shareConfirmBtn.querySelector('span').textContent = `${count}人に共有`;
    }
}

// 共有確定ボタン
shareConfirmBtn.addEventListener('click', function() {
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('URLを入力してください');
        return;
    }
    
    if (selectedPlayers.size === 0) {
        showError('共有するプレイヤーを選択してください');
        return;
    }
    
    // Twitchチェック
    if (url.includes('twitch.tv')) {
        showError('TwitchはFiveMのNUI環境では再生できません。YouTubeをご利用ください。');
        return;
    }
    
    if (!(url.includes('youtube.com') || url.includes('youtu.be'))) {
        showError('YouTubeのURLを入力してください');
        return;
    }
    
    const embedUrl = parseVideoUrl(url);
    if (!embedUrl) {
        showError('無効なURLです。正しいURLを入力してください');
        return;
    }
    
    hideError();
    
    // 共有を送信
    fetch('https://tani-watch/shareVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: url,
            targetPlayers: Array.from(selectedPlayers)
        })
    })
    .then(response => response.text())
    .then(text => {
        console.log('Share response:', text);
        // 自分も再生開始
        showPlayerScreen(url);
    })
    .catch(err => {
        console.log('Share error:', err);
        showPlayerScreen(url);
    });
});

// 共有を受信して動画を表示
function showSharedVideo(url, fromPlayer) {
    // 通知を表示
    showShareNotification(fromPlayer);
    
    // 動画を再生
    showPlayerScreen(url);
    inputContainer.classList.add('hidden');
    playerContainer.classList.remove('hidden');
}

// 共有通知を表示
function showShareNotification(fromPlayer) {
    removeNotifications();
    
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.innerHTML = `
        <div class="share-notification-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
        </div>
        <div class="share-notification-content">
            <div class="share-notification-title">画面共有を受信</div>
            <div class="share-notification-text">${escapeHtml(fromPlayer)}さんから</div>
        </div>
        <button class="share-notification-close" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // 5秒後に自動削除
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// 通知を削除
function removeNotifications() {
    document.querySelectorAll('.share-notification').forEach(n => n.remove());
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================== 基本機能 ==================

// ペーストボタン
pasteBtn.addEventListener('click', async function() {
    try {
        const text = await navigator.clipboard.readText();
        urlInput.value = text;
        hideError();
    } catch (err) {
        // クリップボードアクセス拒否
    }
});

// 再生ボタン
playBtn.addEventListener('click', validateAndPlay);

// Enterキーで再生
urlInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        validateAndPlay();
    }
});

// 入力時にエラーを消す
urlInput.addEventListener('input', hideError);

// 閉じるボタン（入力画面）
inputCloseBtn.addEventListener('click', function() {
    fetch('https://tani-watch/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
});

// 閉じるボタン（プレイヤー画面）
playerCloseBtn.addEventListener('click', function() {
    fetch('https://tani-watch/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
});

// 戻るボタン
backBtn.addEventListener('click', backToInput);

// 音量スライダー
volumeSlider.addEventListener('input', function() {
    currentVolume = parseInt(this.value);
    updateVolumeUI();
    sendVolumeToServer();
});

// ミュートボタン
volumeBtn.addEventListener('click', function() {
    if (isMuted) {
        isMuted = false;
        currentVolume = previousVolume || 50;
    } else {
        isMuted = true;
        previousVolume = currentVolume;
        currentVolume = 0;
    }
    
    volumeSlider.value = currentVolume;
    updateVolumeUI();
    sendVolumeToServer();
});

// 音量UIを更新
function updateVolumeUI() {
    volumeFill.style.width = currentVolume + '%';
    volumeValue.textContent = currentVolume + '%';
    
    if (currentVolume === 0) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
        volumeBtn.classList.add('muted');
    } else if (currentVolume < 50) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        `;
        volumeBtn.classList.remove('muted');
    } else {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        `;
        volumeBtn.classList.remove('muted');
    }

    // iframeに音量を適用
    try {
        if (videoFrame.contentWindow) {
            videoFrame.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [currentVolume]
            }), '*');
        }
    } catch (e) {}
}

// サーバーに音量を送信
function sendVolumeToServer() {
    fetch('https://tani-watch/volumeChange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: currentVolume })
    });
}

// 初期化
updateVolumeUI();

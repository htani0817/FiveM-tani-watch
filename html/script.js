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
let currentPlatform = 'youtube';

// FiveMからのメッセージを受信
window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === 'openInput') {
        showInputScreen();
        requestNearbyPlayers();
    } else if (data.action === 'close') {
        closeAll();
    } else if (data.action === 'updateNearbyPlayers') {
        updateNearbyPlayersList(data.players);
    } else if (data.action === 'receiveShare') {
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
    const platform = detectPlatform(url);
    currentPlatform = platform;
    updatePlatformBadge(platform);
    inputContainer.classList.add('hidden');
    playerContainer.classList.remove('hidden');
}

// プラットフォームを検出
function detectPlatform(url) {
    if (url.includes('twitch.tv') || url.includes('clips.twitch.tv')) {
        return 'twitch';
    }
    return 'youtube';
}

// 全て閉じる
function closeAll() {
    inputContainer.classList.add('hidden');
    playerContainer.classList.add('hidden');
    urlInput.value = '';
    errorMessage.classList.add('hidden');
    hidePlayerList();
    removeNotifications();
}

// URL入力画面に戻る
function backToInput() {
    playerContainer.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    requestNearbyPlayers();
    urlInput.focus();
    
    // Luaに停止を通知
    fetch('https://tani-watch/stopVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
}

// プラットフォームバッジを更新
function updatePlatformBadge(platform) {
    platformBadge.className = 'platform-badge ' + platform;
    platformBadge.textContent = platform === 'twitch' ? 'Twitch' : 'YouTube';
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

// URLを検証
function validateUrl(url) {
    if (!url) {
        return { valid: false, message: 'URLを入力してください' };
    }
    
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isTwitch = url.includes('twitch.tv') || url.includes('clips.twitch.tv');
    
    if (!isYouTube && !isTwitch) {
        return { valid: false, message: 'YouTubeまたはTwitchのURLを入力してください' };
    }
    
    return { valid: true };
}

// URLを検証して再生
function validateAndPlay() {
    const url = urlInput.value.trim();
    const validation = validateUrl(url);
    
    if (!validation.valid) {
        showError(validation.message);
        return;
    }
    
    hideError();
    
    // サーバーに通知（DUIで再生）
    fetch('https://tani-watch/playVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.text())
    .then(text => {
        console.log('Server response:', text);
        try {
            const data = JSON.parse(text);
            if (data.success === false) {
                showError(data.message || 'エラーが発生しました');
                return;
            }
        } catch (e) {}
        showPlayerScreen(url);
    })
    .catch(err => {
        console.log('Fetch error:', err);
        showPlayerScreen(url);
    });
}

// ================== 画面共有機能 ==================

shareBtn.addEventListener('click', function() {
    if (isPlayerListOpen) {
        hidePlayerList();
    } else {
        showPlayerList();
        requestNearbyPlayers();
    }
});

function showPlayerList() {
    isPlayerListOpen = true;
    playerListContainer.classList.remove('hidden');
    shareBtn.classList.add('active');
}

function hidePlayerList() {
    isPlayerListOpen = false;
    playerListContainer.classList.add('hidden');
    shareBtn.classList.remove('active');
    selectedPlayers.clear();
    updateShareButton();
}

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
    
    playerList.querySelectorAll('.player-item').forEach(item => {
        item.addEventListener('click', function() {
            const playerId = parseInt(this.dataset.id);
            togglePlayerSelection(playerId);
            this.classList.toggle('selected');
        });
    });
    
    updateShareButton();
}

function togglePlayerSelection(playerId) {
    if (selectedPlayers.has(playerId)) {
        selectedPlayers.delete(playerId);
    } else {
        selectedPlayers.add(playerId);
    }
    updateShareButton();
}

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

shareConfirmBtn.addEventListener('click', function() {
    const url = urlInput.value.trim();
    const validation = validateUrl(url);
    
    if (!validation.valid) {
        showError(validation.message);
        return;
    }
    
    if (selectedPlayers.size === 0) {
        showError('共有するプレイヤーを選択してください');
        return;
    }
    
    hideError();
    
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
        showPlayerScreen(url);
    })
    .catch(err => {
        console.log('Share error:', err);
        showPlayerScreen(url);
    });
});

function showSharedVideo(url, fromPlayer) {
    showShareNotification(fromPlayer);
    showPlayerScreen(url);
}

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
    setTimeout(() => notification.remove(), 5000);
}

function removeNotifications() {
    document.querySelectorAll('.share-notification').forEach(n => n.remove());
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================== 基本機能 ==================

pasteBtn.addEventListener('click', async function() {
    try {
        const text = await navigator.clipboard.readText();
        urlInput.value = text;
        hideError();
    } catch (err) {}
});

playBtn.addEventListener('click', validateAndPlay);

urlInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        validateAndPlay();
    }
});

urlInput.addEventListener('input', hideError);

inputCloseBtn.addEventListener('click', function() {
    fetch('https://tani-watch/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
});

playerCloseBtn.addEventListener('click', function() {
    fetch('https://tani-watch/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
});

backBtn.addEventListener('click', function() {
    fetch('https://tani-watch/backToInput', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    backToInput();
});

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
}

function sendVolumeToServer() {
    fetch('https://tani-watch/volumeChange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: currentVolume })
    });
}

// 初期化
updateVolumeUI();

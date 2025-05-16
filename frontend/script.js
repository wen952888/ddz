// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 卡牌定义 (与之前相同) ---
    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2'];
    const JOKERS = [
        { name: 'joker_black', displayName: '小王', id: 'joker_black' },
        { name: 'joker_red', displayName: '大王', id: 'joker_red' }
    ];
    const CARD_BACK_IMAGE = 'back.png';
    const IMAGE_PATH = 'assets/cards/';
    const RANK_VALUES = {
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'jack': 11, 'queen': 12, 'king': 13, 'ace': 14, '2': 16,
        'joker_black': 17, 'joker_red': 18
    };
    const BACKEND_API_BASE_URL = 'https://wkddz.wenxiu9528.workers.dev';

    // --- DOM Elements (与之前相同) ---
    const playerBottomLeftHandDiv = document.getElementById('player-bottom-left-hand');
    // ... (所有其他 DOM 元素获取与上一版本相同) ...
    const authArea = document.getElementById('auth-area');
    const userGreeting = document.getElementById('user-greeting');
    const usernameDisplay = document.getElementById('username-display');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const authMessage = document.getElementById('auth-message');

    const roomSelectionArea = document.getElementById('room-selection-area');
    const gameTable = document.getElementById('game-table');
    const roomIdInput = document.getElementById('room-id-input');
    const joinRoomButton = document.getElementById('join-room-button');
    const createRoomButton = document.getElementById('create-room-button');
    const roomListUl = document.getElementById('room-list');
    const roomStatusMessage = document.getElementById('room-status-message');

    // --- 游戏状态变量 (与之前相同，只是 currentUser 会被真实填充) ---
    let gameDeck = [];
    let players = { /* ... (与之前相同) ... */ };
    const playerOrder = ['self', 'nextPlayer', 'prevPlayer'];
    let currentPlayerIndex = 0;
    let landlordCards = [];
    let gameStarted = false;
    let selectedCards = [];
    let landlordPlayerId = null;
    let currentRoomId = null;
    let currentUser = null; // { username: "xxx", id: "xxx", token: "xxx" (可选) }


    // --- 卡牌工具函数 (与之前相同) ---
    function createFullDeck() { /* ... */ }
    function getSuitDisplayName(suit) { /* ... */ }
    function getRankDisplayName(rank) { /* ... */ }
    function createCardElement(card, isOpponent = false, isLandlordCard = false) { /* ... */ }
    function displayPlayerHand(playerId) { /* ... */ }
    function displayLandlordCards(showFace = false) { /* ... */ }
    function shuffleDeck(deckToShuffle) { /* ... */ }

    // --- 游戏逻辑函数 (dealCards, sortPlayerHand, toggleSelectCard, playSelectedCards, passTurn, switchPlayer, updateGameInfo, startGame 与之前相同) ---
    function dealCards() { /* ... */ }
    function sortPlayerHand(playerId, ascending = false) { /* ... */ }
    function toggleSelectCard(cardElement, card) { /* ... */ }
    function playSelectedCards() { /* ... */ }
    function passTurn() { /* ... */ }
    function switchPlayer() { /* ... */ }
    function updateGameInfo() { /* ... */ }
    function startGame() { /* ... */ }


    // --- 房间功能函数 (暂时保持模拟，因为后端房间API未实现) ---
    async function createRoom() { /* ... (与之前模拟版本相同) ... */ }
    async function joinRoom(roomId) { /* ... (与之前模拟版本相同) ... */ }
    function enterRoom(roomId) { /* ... (与之前相同) ... */ }
    function displayAvailableRooms(rooms) { /* ... (与之前相同) ... */ }
    function fetchAvailableRooms() { /* ... (与之前模拟版本相同) ... */ }


    // --- 用户认证函数 (修改为调用真实API) ---
    function updateAuthUI() {
        // ... (与之前相同，根据 currentUser 更新UI) ...
        if (!authArea) return;
        if (currentUser && currentUser.username) { // 检查 currentUser.username 是否存在
            if (userGreeting) userGreeting.style.display = 'inline';
            if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
            if (usernameInput) usernameInput.style.display = 'none';
            if (passwordInput) passwordInput.style.display = 'none';
            if (loginButton) loginButton.style.display = 'none';
            if (registerButton) registerButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'inline';
            if (authMessage) authMessage.textContent = '';
        } else {
            if (userGreeting) userGreeting.style.display = 'none';
            if (usernameInput) { usernameInput.style.display = 'inline'; usernameInput.value = ''; }
            if (passwordInput) { passwordInput.style.display = 'inline'; passwordInput.value = ''; }
            if (loginButton) loginButton.style.display = 'inline';
            if (registerButton) registerButton.style.display = 'inline';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    }

    async function registerUser() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        // const email = emailInput ? emailInput.value.trim() : ''; // 如果有email输入框

        if (!username || !password) {
            if (authMessage) authMessage.textContent = '用户名和密码不能为空！';
            return;
        }
        if (username.length < 3 || password.length < 6) {
            if (authMessage) authMessage.textContent = '用户名至少3位，密码至少6位。';
            return;
        }
        if (authMessage) authMessage.textContent = '正在注册...';
        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password /*, email */ }) // 如果有email，也传过去
            });
            const data = await response.json();

            if (response.ok) { // HTTP 201 Created
                if (authMessage) authMessage.textContent = `注册成功！用户ID: ${data.userId}。请登录。`;
                if (usernameInput) usernameInput.value = '';
                if (passwordInput) passwordInput.value = '';
            } else { // HTTP 4xx or 5xx
                if (authMessage) authMessage.textContent = `注册失败: ${data.error || response.statusText || '未知错误'}`;
            }
        } catch (error) {
            console.error("注册请求错误:", error);
            if (authMessage) authMessage.textContent = '注册时发生网络错误或服务器无响应。';
        }
    }

    async function loginUser() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        if (!username || !password) {
            if (authMessage) authMessage.textContent = '请输入用户名和密码。';
            return;
        }
        if (authMessage) authMessage.textContent = '正在登录...';
        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) { // HTTP 200 OK
                currentUser = { username: data.username, id: data.userId /*, token: data.token */ };
                // if(data.token) localStorage.setItem('authToken', data.token); // 存储token
                if (authMessage) authMessage.textContent = '';
                updateAuthUI();
                console.log("登录成功:", currentUser);
            } else { // HTTP 4xx or 5xx
                if (authMessage) authMessage.textContent = `登录失败: ${data.error || response.statusText || '用户名或密码错误'}`;
                currentUser = null; // 确保登录失败时 currentUser 被清空
                updateAuthUI(); // 更新UI以显示登录表单
            }
        } catch (error) {
            console.error("登录请求错误:", error);
            if (authMessage) authMessage.textContent = '登录时发生网络错误或服务器无响应。';
            currentUser = null;
            updateAuthUI();
        }
    }

    function logoutUser() {
        currentUser = null;
        // localStorage.removeItem('authToken');
        if (authMessage) authMessage.textContent = '已登出。';
        updateAuthUI();
        if (roomSelectionArea) roomSelectionArea.style.display = 'block';
        if (gameTable) gameTable.style.display = 'none';
        currentRoomId = null;
        gameStarted = false;
        document.title = "网页斗地主";
        // 可以选择性地清除房间列表等其他状态
        if (roomListUl) roomListUl.innerHTML = '<li>请登录以查看房间。</li>';
        if (roomStatusMessage) roomStatusMessage.textContent = '';
    }

    // --- 事件监听器 (与之前相同) ---
    if (registerButton) { /* ... */ }
    if (loginButton) { /* ... */ }
    if (logoutButton) { /* ... */ }
    if (createRoomButton) { /* ... */ }
    if (joinRoomButton) { /* ... */ }
    // ... (其他游戏按钮的事件监听器)

    // --- 初始化 ---
    function initializeApp() {
        console.log("Initializing app...");
        if (gameTable) gameTable.style.display = 'none';
        if (roomSelectionArea) roomSelectionArea.style.display = 'block'; // 默认显示房间选择

        updateAuthUI(); // 根据登录状态初始化UI
        fetchHelloFromBackend(); // 尝试连接后端获取全局消息
        // fetchAvailableRooms(); // 房间列表现在可能需要登录后才能获取
        if (roomListUl) roomListUl.innerHTML = '<li>请登录以查看房间。</li>';
    }

    function initializeGameAndUI() { /* ... (与之前相同) ... */ }
    async function fetchHelloFromBackend() { /* ... (与之前相同，确保文本更新逻辑正确) ... */ }

    initializeApp();
});

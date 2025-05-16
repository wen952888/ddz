// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (所有之前的变量和函数定义保持不变) ...
    // ... (房间功能 DOM Elements 和函数定义保持不变) ...

    // +++++ 用户认证 DOM Elements +++++
    const authArea = document.getElementById('auth-area');
    const userGreeting = document.getElementById('user-greeting');
    const usernameDisplay = document.getElementById('username-display');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const authMessage = document.getElementById('auth-message');

    // +++++ 用户状态 +++++
    let currentUser = null; // { username: "xxx" }

    // --- 用户认证函数 (简化版) ---
    function updateAuthUI() {
        if (!authArea) return; // 确保元素存在
        if (currentUser) {
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
            if (usernameInput) usernameInput.style.display = 'inline'; // 初始显示输入框
            if (passwordInput) passwordInput.style.display = 'inline'; // 初始显示输入框
            if (loginButton) loginButton.style.display = 'inline';
            if (registerButton) registerButton.style.display = 'inline';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    }

    async function registerUser() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        if (!username || !password) {
            if (authMessage) authMessage.textContent = '用户名和密码不能为空！';
            return;
        }
        if (authMessage) authMessage.textContent = '正在注册...';
        try {
            // 模拟后端API调用
            // 真实场景: const response = await fetch(`${BACKEND_API_BASE_URL}/api/auth/register`, { method: 'POST', body: JSON.stringify({ username, password }), headers: {'Content-Type': 'application/json'} });
            // const data = await response.json();
            // if (response.ok) {
            //     authMessage.textContent = '注册成功！请登录。';
            //     usernameInput.value = ''; passwordInput.value = '';
            // } else {
            //     authMessage.textContent = `注册失败: ${data.error || '未知错误'}`;
            // }
            setTimeout(() => {
                if (username === "test" && password === "test") { // 模拟已存在用户
                     if (authMessage) authMessage.textContent = '注册失败: 用户名已存在。';
                } else {
                    if (authMessage) authMessage.textContent = `用户 ${username} 注册成功！请登录。`;
                    if (usernameInput) usernameInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                }
            }, 1000);
        } catch (error) {
            console.error("注册错误:", error);
            if (authMessage) authMessage.textContent = '注册时发生网络错误。';
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
            // 模拟后端API调用
            // 真实场景: const response = await fetch(`${BACKEND_API_BASE_URL}/api/auth/login`, { method: 'POST', body: JSON.stringify({ username, password }), headers: {'Content-Type': 'application/json'} });
            // const data = await response.json();
            // if (response.ok && data.token) { // 假设后端返回token
            //     currentUser = { username: data.username }; // 或从token解析
            //     localStorage.setItem('authToken', data.token); // 存储token
            //     updateAuthUI();
            // } else {
            //     authMessage.textContent = `登录失败: ${data.error || '用户名或密码错误'}`;
            // }
            setTimeout(() => {
                if (username === "test" && password === "test") {
                    currentUser = { username: "test" };
                    if (authMessage) authMessage.textContent = '';
                    updateAuthUI();
                } else if (username && password) {
                     if (authMessage) authMessage.textContent = '登录失败: 用户名或密码错误。';
                }
            }, 1000);
        } catch (error) {
            console.error("登录错误:", error);
            if (authMessage) authMessage.textContent = '登录时发生网络错误。';
        }
    }

    function logoutUser() {
        currentUser = null;
        // localStorage.removeItem('authToken'); // 清除token
        if (authMessage) authMessage.textContent = '已登出。';
        updateAuthUI();
        // 可能需要重置游戏状态或返回房间选择界面
        if (roomSelectionArea) roomSelectionArea.style.display = 'block';
        if (gameTable) gameTable.style.display = 'none';
        currentRoomId = null;
        gameStarted = false;
        document.title = "网页斗地主";
    }

    // --- 事件监听器 (用户认证) ---
    if (registerButton) {
        registerButton.addEventListener('click', registerUser);
    }
    if (loginButton) {
        loginButton.addEventListener('click', loginUser);
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    // 在 initializeApp 中调用 updateAuthUI
    function initializeApp() {
        console.log("Initializing app...");
        if (gameTable) gameTable.style.display = 'none';
        if (roomSelectionArea) roomSelectionArea.style.display = 'block';

        updateAuthUI(); // 根据登录状态初始化UI
        fetchHelloFromBackend();
        fetchAvailableRooms();
    }

    // ... (其他所有函数，包括 initializeGameAndUI, startGame, dealCards 等保持不变)

    initializeApp(); // 调用应用初始化
});

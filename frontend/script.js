document.addEventListener('DOMContentLoaded', () => {
    // --- 卡牌定义 (与之前类似，保持不变) ---
    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2']; // 2放到最后，方便排序
    const JOKERS = [
        { name: 'joker_black', displayName: '小王' },
        { name: 'joker_red', displayName: '大王' }
    ];
    const CARD_BACK_IMAGE = 'back.png';
    const IMAGE_PATH = 'assets/cards/';

    const RANK_VALUES = { // 用于牌值比较和排序
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'jack': 11, 'queen': 12, 'king': 13, 'ace': 14, '2': 16, // A是14, 2是16 (比A大)
        'joker_black': 17, 'joker_red': 18
    };
    // 注意：上面 RANK_VALUES 中 '2' 的值是16，joker_black 是17，joker_red 是18。
    // Ace (A) 的值是14。这样排序时 3...10,J,Q,K,A,2,小王,大王

    const BACKEND_API_BASE_URL = 'https://wkddz.wenxiu9528.workers.dev';

    // --- DOM Elements ---
    const playerBottomHandDiv = document.getElementById('player-bottom-hand');
    const playerTopHandDiv = document.getElementById('player-top-hand');
    const playerLeftHandDiv = document.getElementById('player-left-hand');
    const landlordCardsDiv = document.getElementById('landlord-cards');

    const playerBottomCardCountSpan = document.getElementById('player-bottom-card-count');
    const playerTopCardCountSpan = document.getElementById('player-top-card-count');
    const playerLeftCardCountSpan = document.getElementById('player-left-card-count');

    const playerBottomPlayedDiv = document.getElementById('player-bottom-played');
    const playerTopPlayedDiv = document.getElementById('player-top-played');
    const playerLeftPlayedDiv = document.getElementById('player-left-played');

    const startGameButton = document.getElementById('start-game-button');
    const playSelectedButton = document.getElementById('play-selected-button');
    const passButton = document.getElementById('pass-button');
    const sortHandButton = document.getElementById('sort-hand-button');

    const currentTurnIndicator = document.getElementById('current-turn-indicator');
    const landlordIndicator = document.getElementById('landlord-indicator');
    const backendMessageDiv = document.getElementById('backend-message');
    const footerTextElement = document.querySelector('footer p');

    // --- 游戏状态变量 ---
    let deck = [];
    let players = {
        bottom: { id: 'bottom', hand: [], handElement: playerBottomHandDiv, countElement: playerBottomCardCountSpan, playedElement: playerBottomPlayedDiv, isLandlord: false, displayName: '你' },
        left: { id: 'left', hand: [], handElement: playerLeftHandDiv, countElement: playerLeftCardCountSpan, playedElement: playerLeftPlayedDiv, isLandlord: false, displayName: '下家' },
        top: { id: 'top', hand: [], handElement: playerTopHandDiv, countElement: playerTopCardCountSpan, playedElement: playerTopPlayedDiv, isLandlord: false, displayName: '上家' }
    };
    let landlordCards = [];
    let currentPlayerId = 'bottom'; // 假设底部玩家先开始 (后续会有叫地主逻辑)
    let gameStarted = false;
    let selectedCards = []; // 存储当前玩家选中的牌

    // --- 卡牌工具函数 (与之前类似，但注意 RANK_VALUES 的使用) ---
    function createDeck() {
        const newDeck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                newDeck.push({
                    suit: suit,
                    rank: rank,
                    value: RANK_VALUES[rank],
                    imageFile: `${rank}_of_${suit}.png`,
                    displayName: `${getSuitDisplayName(suit)}${getRankDisplayName(rank)}`,
                    id: `${rank}_of_${suit}` // 给牌一个唯一ID
                });
            }
        }
        for (const joker of JOKERS) {
            newDeck.push({
                suit: 'joker',
                rank: joker.name,
                value: RANK_VALUES[joker.name],
                imageFile: `${joker.name}.png`,
                displayName: joker.displayName,
                id: joker.name
            });
        }
        return newDeck;
    }

    function getSuitDisplayName(suit) { /* ... (与之前相同) ... */ }
    function getRankDisplayName(rank) { /* ... (与之前相同) ... */ }

    function createCardElement(card, isOpponent = false, isLandlordCard = false) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const imageName = (isOpponent && !isLandlordCard) ? CARD_BACK_IMAGE : card.imageFile; // 对手牌显示牌背，除非是明示的底牌
        cardDiv.style.backgroundImage = `url('${IMAGE_PATH}${imageName}')`;

        // 存储卡牌数据，用于后续逻辑
        cardDiv.dataset.id = card.id;
        cardDiv.dataset.rank = card.rank;
        cardDiv.dataset.suit = card.suit;
        cardDiv.dataset.value = card.value;
        cardDiv.dataset.displayName = card.displayName;

        cardDiv.title = (isOpponent && !isLandlordCard) ? '对手的牌' : card.displayName;

        // 为自己的牌添加点击事件 (选牌)
        if (!isOpponent && gameStarted) {
            cardDiv.addEventListener('click', () => toggleSelectCard(cardDiv, card));
        }
        return cardDiv;
    }

    function displayPlayerHand(playerId) {
        const player = players[playerId];
        player.handElement.innerHTML = ''; // 清空
        player.hand.forEach(card => {
            const cardElement = createCardElement(card, playerId !== 'bottom');
            player.handElement.appendChild(cardElement);
        });
        player.countElement.textContent = `牌: ${player.hand.length}`;
    }

    function displayLandlordCards(showFace = false) {
        landlordCardsDiv.innerHTML = '';
        landlordCards.forEach(card => {
            // 底牌始终明牌显示（如果showFace为true）
            const cardElement = createCardElement(card, false, true);
            if (!showFace) { // 如果不显示正面，则显示牌背
                 cardElement.style.backgroundImage = `url('${IMAGE_PATH}${CARD_BACK_IMAGE}')`;
                 cardElement.title = '底牌';
            }
            landlordCardsDiv.appendChild(cardElement);
        });
    }

    function shuffleDeck(deckToShuffle) { /* ... (与之前相同) ... */ }

    // --- 游戏逻辑函数 ---
    function dealCards() {
        deck = shuffleDeck(createDeck());
        
        // 清空手牌和出牌区
        for (const playerId in players) {
            players[playerId].hand = [];
            if (players[playerId].playedElement) players[playerId].playedElement.innerHTML = '';
            players[playerId].isLandlord = false;
        }
        landlordCards = [];
        selectedCards = []; // 清空选中的牌

        // 发牌给三个玩家，每人17张
        for (let i = 0; i < 17; i++) {
            players.bottom.hand.push(deck.pop());
            players.left.hand.push(deck.pop());
            players.top.hand.push(deck.pop());
        }

        // 剩余3张作为底牌
        landlordCards = deck.splice(0, 3); // deck 现在为空

        // 理牌 (按牌值从大到小排序)
        for (const playerId in players) {
            sortPlayerHand(playerId); // 调用新的理牌函数
        }
        
        // 显示牌
        displayPlayerHand('bottom');
        displayPlayerHand('left');
        displayPlayerHand('top');
        displayLandlordCards(false); // 初始时底牌不亮出

        updateGameInfo();
        playSelectedButton.disabled = true; // 初始禁用出牌
        passButton.disabled = true; // 初始禁用不要
    }

    function sortPlayerHand(playerId, ascending = false) { // ascending 参数决定升序还是降序
        const player = players[playerId];
        player.hand.sort((a, b) => {
            // 主要按点数排序，点数相同按花色 (花色排序规则可选)
            if (a.value === b.value) {
                // 定义花色顺序 (可选，如果需要同点数牌有固定顺序)
                // const suitOrder = { 'spades': 4, 'hearts': 3, 'clubs': 2, 'diamonds': 1, 'joker': 0 };
                // return ascending ? (suitOrder[a.suit] - suitOrder[b.suit]) : (suitOrder[b.suit] - suitOrder[a.suit]);
                return 0; // 简单处理，同点数不特意排序花色
            }
            return ascending ? (a.value - b.value) : (b.value - a.value); // 默认降序 (大牌在前)
        });
        if (playerId === 'bottom') { // 只重新渲染自己的手牌区
             displayPlayerHand('bottom');
        }
    }


    function toggleSelectCard(cardElement, card) {
        if (!gameStarted || currentPlayerId !== 'bottom') return; // 非游戏开始或非自己回合不能选牌

        cardElement.classList.toggle('selected');
        const cardIndex = selectedCards.findIndex(c => c.id === card.id);

        if (cardIndex > -1) { // 如果已选中，则取消选中
            selectedCards.splice(cardIndex, 1);
        } else { // 如果未选中，则加入选中列表
            selectedCards.push(card);
        }
        // 根据是否有选中的牌来启用/禁用出牌按钮
        playSelectedButton.disabled = selectedCards.length === 0;
    }

    function playSelectedCards() {
        if (selectedCards.length === 0 || currentPlayerId !== 'bottom') return;

        // TODO: 实现牌型判断和出牌规则校验
        console.log("玩家出牌:", selectedCards.map(c => c.displayName).join(', '));

        // 1. 从手牌中移除已出的牌
        players.bottom.hand = players.bottom.hand.filter(cardInHand =>
            !selectedCards.some(selectedCard => selectedCard.id === cardInHand.id)
        );

        // 2. 显示已出的牌到出牌区
        players.bottom.playedElement.innerHTML = ''; // 清空上次出的牌
        selectedCards.forEach(card => {
            players.bottom.playedElement.appendChild(createCardElement(card, false)); // 出的牌明牌显示
        });


        // 3. 清空选中牌列表和界面选中状态
        selectedCards = [];
        const cardElements = playerBottomHandDiv.querySelectorAll('.card.selected');
        cardElements.forEach(el => el.classList.remove('selected'));

        // 4. 更新手牌显示和数量
        displayPlayerHand('bottom'); // 会重新渲染，清除已打出的牌

        // 5. 禁用出牌和不要按钮，直到下一次轮到自己
        playSelectedButton.disabled = true;
        passButton.disabled = true;


        // TODO: 检查游戏是否结束

        // TODO: 轮到下一个玩家 (简化处理)
        switchPlayer();
        updateGameInfo();
    }

    function passTurn() {
        if (currentPlayerId !== 'bottom') return;
        console.log("玩家选择不要");
        players.bottom.playedElement.innerHTML = '<p style="color:white; font-style:italic;">不要</p>'; // 显示“不要”
        // 禁用出牌和不要按钮
        playSelectedButton.disabled = true;
        passButton.disabled = true;

        switchPlayer();
        updateGameInfo();
    }


    function switchPlayer() {
        // 非常简化的轮换逻辑
        if (currentPlayerId === 'bottom') {
            currentPlayerId = 'left';
        } else if (currentPlayerId === 'left') {
            currentPlayerId = 'top';
        } else {
            currentPlayerId = 'bottom';
        }

        // 如果轮到自己，启用操作按钮
        if (currentPlayerId === 'bottom') {
            passButton.disabled = false; // 允许“不要”
            // 出牌按钮根据是否有选中牌决定，在 toggleSelectCard 中处理
        } else {
            // TODO: 模拟AI出牌或提示其他玩家操作
            // 简单延迟后自动跳过AI回合
            setTimeout(() => {
                if (currentPlayerId !== 'bottom') { // 再次检查，防止玩家快速操作
                    console.log(`${players[currentPlayerId].displayName} AI回合跳过 (待实现)`);
                    if(players[currentPlayerId].playedElement) players[currentPlayerId].playedElement.innerHTML = ''; // AI回合清空出牌区
                    switchPlayer();
                    updateGameInfo();
                }
            }, 1500);
        }
    }


    function updateGameInfo() {
        currentTurnIndicator.textContent = `轮到: ${players[currentPlayerId].displayName}`;
        
        let landlordName = '待定';
        for (const id in players) {
            if (players[id].isLandlord) {
                landlordName = players[id].displayName;
                break;
            }
        }
        landlordIndicator.textContent = `地主: ${landlordName}`;

        // 更新所有玩家牌数
        for (const id in players) {
            if (players[id].countElement) {
                players[id].countElement.textContent = `牌: ${players[id].hand.length}`;
            }
        }
    }

    function startGame() {
        gameStarted = true;
        // 简化：默认底部玩家是地主，并获得底牌
        players.bottom.isLandlord = true;
        players.bottom.hand.push(...landlordCards);
        sortPlayerHand('bottom'); // 获得底牌后重新理牌
        displayPlayerHand('bottom');
        displayLandlordCards(true); // 亮出底牌

        currentPlayerId = 'bottom'; // 地主先出牌
        passButton.disabled = false; // 允许“不要”
        playSelectedButton.disabled = true; // 出牌按钮初始禁用
        updateGameInfo();
        console.log("游戏开始！");
    }


    // --- 事件监听器 ---
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            dealCards(); // 发牌
            startGame(); // 开始游戏 (简化版，直接让底部玩家当地主)
        });
    }
    if (playSelectedButton) {
        playSelectedButton.addEventListener('click', playSelectedCards);
    }
    if (passButton) {
        passButton.addEventListener('click', passTurn);
    }
    if (sortHandButton) {
        sortHandButton.addEventListener('click', () => {
            if (players.bottom.hand.length > 0) {
                sortPlayerHand('bottom'); // 点击理牌按钮时整理自己的手牌
            }
        });
    }

    // --- 初始化 ---
    dealCards(); // 页面加载时先发一次牌作为初始状态，但不开始游戏
    updateGameInfo(); // 更新初始游戏信息
    if (footerTextElement) footerTextElement.textContent = '点击"开始新游戏"按钮开始';


    // --- (可选) 与后端通信示例 (保持不变) ---
    async function fetchHelloFromBackend() { /* ... (与之前相同) ... */ }
    // fetchHelloFromBackend(); // 暂时注释或按需调用
});

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

    // --- DOM Elements ---
    // 主要玩家区域
    const playerBottomHandDiv = document.getElementById('player-bottom-hand');
    const playerTopHandDiv = document.getElementById('player-top-hand');
    const playerLeftHandDiv = document.getElementById('player-left-hand');
    // const playerRightHandDiv = document.getElementById('player-right-hand'); // 如果三人游戏，这个可以不直接操作手牌

    const landlordCardsDiv = document.getElementById('landlord-cards');

    // 牌数显示
    const playerBottomCardCountSpan = document.getElementById('player-bottom-card-count');
    const playerTopCardCountSpan = document.getElementById('player-top-card-count');
    const playerLeftCardCountSpan = document.getElementById('player-left-card-count');
    // const playerRightCardCountSpan = document.getElementById('player-right-card-count');

    // 地主身份显示
    const playerBottomLandlordIdentity = document.getElementById('player-bottom-landlord-identity');
    const playerTopLandlordIdentity = document.getElementById('player-top-landlord-identity');
    const playerLeftLandlordIdentity = document.getElementById('player-left-landlord-identity');
    // const playerRightLandlordIdentity = document.getElementById('player-right-landlord-identity');


    // 出牌区域
    const playerBottomPlayedDiv = document.getElementById('player-bottom-played');
    const playerTopPlayedDiv = document.getElementById('player-top-played');
    const playerLeftPlayedDiv = document.getElementById('player-left-played');
    // const playerRightPlayedDiv = document.getElementById('player-right-played');

    // 按钮和信息显示
    const startGameButton = document.getElementById('start-game-button');
    const playSelectedButton = document.getElementById('play-selected-button');
    const passButton = document.getElementById('pass-button');
    const sortHandButton = document.getElementById('sort-hand-button');

    const currentTurnIndicator = document.getElementById('current-turn-indicator');
    const landlordIndicator = document.getElementById('landlord-indicator');
    const backendMessageDiv = document.getElementById('backend-message');
    const footerTextElement = document.querySelector('footer p');

    // --- 游戏状态变量 ---
    let gameDeck = [];
    // 标准三人斗地主玩家映射
    // 'bottom' 是自己
    // 'left' 是自己的下家 (坐在你的左手边，按出牌顺序是你的下一个)
    // 'top' 是自己的上家 (坐在你的右手边，按出牌顺序是你的上一个)
    let players = {
        bottom: { id: 'bottom', hand: [], handElement: playerBottomHandDiv, countElement: playerBottomCardCountSpan, playedElement: playerBottomPlayedDiv, landlordIdentityElement: playerBottomLandlordIdentity, isLandlord: false, displayName: '你' },
        left: { id: 'left', hand: [], handElement: playerLeftHandDiv, countElement: playerLeftCardCountSpan, playedElement: playerLeftPlayedDiv, landlordIdentityElement: playerLeftLandlordIdentity, isLandlord: false, displayName: '下家' }, // 左边的玩家作为下家
        top: { id: 'top', hand: [], handElement: playerTopHandDiv, countElement: playerTopCardCountSpan, playedElement: playerTopPlayedDiv, landlordIdentityElement: playerTopLandlordIdentity, isLandlord: false, displayName: '上家' }  // 顶部的玩家作为上家
    };
    const playerOrder = ['bottom', 'left', 'top']; // 出牌顺序
    let currentPlayerIndex = 0; // 指向 playerOrder 中的当前玩家

    let landlordCards = [];
    let gameStarted = false;
    let selectedCards = [];
    let landlordPlayerId = null;


    // --- 卡牌工具函数 (与之前相同，确保 createCardElement 中的 dataset.value 是字符串) ---
    function createFullDeck() { /* ... (与之前相同) ... */ }
    function getSuitDisplayName(suit) { /* ... (与之前相同) ... */ }
    function getRankDisplayName(rank) { /* ... (与之前相同) ... */ }
    function createCardElement(card, isOpponent = false, isLandlordCard = false) {
        // ... (与之前版本类似，确保 dataset.value = String(card.value);)
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const imageName = (isOpponent && !isLandlordCard) ? CARD_BACK_IMAGE : card.imageFile;
        cardDiv.style.backgroundImage = `url('${IMAGE_PATH}${imageName}')`;
        cardDiv.dataset.id = card.id;
        cardDiv.dataset.rank = card.rank;
        cardDiv.dataset.suit = card.suit;
        cardDiv.dataset.value = String(card.value);
        cardDiv.dataset.displayName = card.displayName;
        cardDiv.title = (isOpponent && !isLandlordCard) ? '对手的牌' : card.displayName;

        if (!isOpponent && gameStarted && playerOrder[currentPlayerIndex] === 'bottom') { // 只有轮到自己时才能选牌
            cardDiv.addEventListener('click', () => toggleSelectCard(cardDiv, card));
        }
        return cardDiv;
    }
    function displayPlayerHand(playerId) { /* ... (与之前相同, 确保 DOM 元素存在) ... */ }
    function displayLandlordCards(showFace = false) { /* ... (与之前相同) ... */ }
    function shuffleDeck(deckToShuffle) { /* ... (与之前相同) ... */ }


    // --- 游戏逻辑函数 ---
    function dealCards() {
        console.log("Dealing cards...");
        const fullNewDeck = createFullDeck();
        gameDeck = shuffleDeck(fullNewDeck);
        console.log("Deck shuffled, total cards:", gameDeck.length);

        Object.values(players).forEach(player => { // 使用 Object.values 遍历
            player.hand = [];
            if (player.playedElement) player.playedElement.innerHTML = '';
            player.isLandlord = false;
            if (player.landlordIdentityElement) player.landlordIdentityElement.textContent = '';
        });
        landlordCards = [];
        selectedCards = [];
        landlordPlayerId = null;

        for (let i = 0; i < 17; i++) {
            if (gameDeck.length > 0) players.bottom.hand.push(gameDeck.pop());
            if (gameDeck.length > 0) players.left.hand.push(gameDeck.pop());
            if (gameDeck.length > 0) players.top.hand.push(gameDeck.pop());
        }
        console.log("Cards dealt. Remaining in deck:", gameDeck.length);

        if (gameDeck.length >= 3) {
            landlordCards = gameDeck.splice(0, 3);
        } else {
            landlordCards = [...gameDeck]; gameDeck = [];
            console.warn("Not enough for full landlord hand! Remaining:", landlordCards.length);
        }
        console.log("Landlord cards set. Deck empty:", gameDeck.length === 0);

        Object.keys(players).forEach(sortPlayerHand); // 使用 Object.keys 遍历

        displayPlayerHand('bottom');
        displayPlayerHand('left');
        displayPlayerHand('top');
        displayLandlordCards(false);

        updateGameInfo();
        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;
    }

    function sortPlayerHand(playerId, ascending = false) { /* ... (与之前相同) ... */ }

    function toggleSelectCard(cardElement, card) {
        // 确保只有在轮到当前玩家（自己）且游戏已开始时才能选牌
        if (!gameStarted || playerOrder[currentPlayerIndex] !== 'bottom' || !cardElement) return;

        cardElement.classList.toggle('selected');
        const cardIndex = selectedCards.findIndex(c => c.id === card.id);

        if (cardIndex > -1) {
            selectedCards.splice(cardIndex, 1);
        } else {
            selectedCards.push(card);
        }
        if(playSelectedButton) playSelectedButton.disabled = selectedCards.length === 0;
    }

    function playSelectedCards() {
        if (selectedCards.length === 0 || playerOrder[currentPlayerIndex] !== 'bottom') return;
        const currentPlayer = players[playerOrder[currentPlayerIndex]];

        console.log(`${currentPlayer.displayName} 出牌:`, selectedCards.map(c => c.displayName).join(', '));

        currentPlayer.hand = currentPlayer.hand.filter(cardInHand =>
            !selectedCards.some(selectedCard => selectedCard.id === cardInHand.id)
        );

        if(currentPlayer.playedElement) currentPlayer.playedElement.innerHTML = '';
        selectedCards.forEach(card => {
            if(currentPlayer.playedElement) currentPlayer.playedElement.appendChild(createCardElement(card, false));
        });

        const oldSelectedCards = [...selectedCards]; // 复制一份用于清除选中状态
        selectedCards = []; // 清空逻辑上的选中牌

        // 清除界面选中状态
        if (currentPlayer.handElement) {
             oldSelectedCards.forEach(playedCard => {
                const cardEl = currentPlayer.handElement.querySelector(`.card[data-id="${playedCard.id}"]`);
                if (cardEl) cardEl.classList.remove('selected'); // 理论上这些牌已不在手牌区
             });
             // 也可以直接清除所有选中，因为手牌区会重绘
             const allSelectedInHand = currentPlayer.handElement.querySelectorAll('.card.selected');
             allSelectedInHand.forEach(el => el.classList.remove('selected'));
        }


        displayPlayerHand(currentPlayer.id); // 更新当前玩家手牌

        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;

        // TODO: 检查游戏是否结束 (currentPlayer.hand.length === 0)

        switchPlayer();
        updateGameInfo();
    }

    function passTurn() {
        if (playerOrder[currentPlayerIndex] !== 'bottom') return;
        const currentPlayer = players[playerOrder[currentPlayerIndex]];
        console.log(`${currentPlayer.displayName} 选择不要`);
        if (currentPlayer.playedElement) currentPlayer.playedElement.innerHTML = '<p style="color:white; font-style:italic;">不要</p>';

        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;

        switchPlayer();
        updateGameInfo();
    }

    function switchPlayer() {
        currentPlayerIndex = (currentPlayerIndex + 1) % playerOrder.length;
        const nextPlayerId = playerOrder[currentPlayerIndex];
        console.log("Switching turn to:", nextPlayerId);

        // 清空所有玩家出牌区 (除了刚刚出牌/不要的那个玩家，但为了简化先全清)
        Object.values(players).forEach(p => {
            // if (p.id !== playerOrder[(currentPlayerIndex - 1 + playerOrder.length) % playerOrder.length]) { // 除了上一个玩家
                if(p.playedElement && p.playedElement.querySelector('p')?.textContent !== '不要') { // 如果不是“不要”，则清空
                    // (当前逻辑下，"不要"后也会被AI操作覆盖，所以可以简化为都清)
                     p.playedElement.innerHTML = '';
                }
            // }
        });


        if (nextPlayerId === 'bottom') {
            if(passButton) passButton.disabled = false;
            if(playSelectedButton) playSelectedButton.disabled = selectedCards.length === 0;
            // 重新为自己的牌添加点击事件 (因为 displayPlayerHand 会重建DOM)
            displayPlayerHand('bottom');
        } else {
            // 模拟AI
            if (players[nextPlayerId] && players[nextPlayerId].playedElement) {
                 players[nextPlayerId].playedElement.innerHTML = '';
            }
            setTimeout(() => {
                if (playerOrder[currentPlayerIndex] !== 'bottom' && gameStarted) {
                    console.log(`${players[nextPlayerId].displayName} AI回合跳过 (待实现)`);
                     if (players[nextPlayerId].playedElement) players[nextPlayerId].playedElement.innerHTML = '<p style="color:white; font-style:italic; font-size:0.8em;">(AI跳过)</p>';
                    switchPlayer(); // AI跳过后直接轮到下一个
                    updateGameInfo();
                }
            }, 1000 + Math.random() * 1000); // 随机延迟
        }
    }

    function updateGameInfo() {
        const currentTurnPlayerId = playerOrder[currentPlayerIndex];
        if (currentTurnIndicator && players[currentTurnPlayerId]) currentTurnIndicator.textContent = `轮到: ${players[currentTurnPlayerId].displayName}`;

        landlordPlayerId = null; // 重置
        Object.values(players).forEach(player => {
            if (player.isLandlord) {
                landlordPlayerId = player.id;
                if(player.landlordIdentityElement) player.landlordIdentityElement.textContent = '(地主)';
            } else {
                if(player.landlordIdentityElement) player.landlordIdentityElement.textContent = '(农民)';
            }
        });

        if (landlordIndicator) landlordIndicator.textContent = `地主: ${landlordPlayerId ? players[landlordPlayerId].displayName : '待定'}`;
        if (landlordPlayerId === null && landlordIndicator) landlordIndicator.textContent = '地主: 待定 (点击开始)';


        Object.values(players).forEach(player => {
            if (player.countElement && player.hand) {
                player.countElement.textContent = `牌: ${player.hand.length}`;
            }
        });
    }

    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            // 简化：自己当地主
            landlordPlayerId = 'bottom';
            players.bottom.isLandlord = true;

            if (landlordCards && landlordCards.length > 0) {
                players.bottom.hand.push(...landlordCards);
            }
            sortPlayerHand('bottom'); // 合并底牌后重新排序
            // displayPlayerHand('bottom'); // sortPlayerHand会调用

            displayLandlordCards(true);

            currentPlayerIndex = playerOrder.indexOf(landlordPlayerId); // 地主先出牌
            
            if(passButton) passButton.disabled = false;
            if(playSelectedButton) playSelectedButton.disabled = true;
            updateGameInfo();
            console.log("游戏开始！地主是:", players.bottom.displayName);
        } else {
            console.log("重新开始游戏...");
            gameStarted = false;
            dealCards(); // 先重新发牌
            startGame(); // 递归调用以正确设置新局状态
        }
    }

    // --- 事件监听器 (与之前相同) ---
    if (startGameButton) { /* ... */ }
    if (playSelectedButton) { /* ... */ }
    if (passButton) { /* ... */ }
    if (sortHandButton) { /* ... */ }

    // --- 初始化 ---
    function initializeGame() { /* ... (与之前相同) ... */ }
    async function fetchHelloFromBackend() { /* ... (与之前相同，确保文本更新逻辑正确) ... */ }

    initializeGame();
});

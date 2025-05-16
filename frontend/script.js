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
    const RANK_VALUES = { /* ... (与之前相同) ... */ };
    const BACKEND_API_BASE_URL = 'https://wkddz.wenxiu9528.workers.dev';

    // --- DOM Elements ---
    // 自己 (左下角)
    const playerBottomLeftHandDiv = document.getElementById('player-bottom-left-hand');
    const playerBottomLeftCardCountSpan = document.getElementById('player-bottom-left-card-count');
    const playerBottomLeftLandlordIdentity = document.getElementById('player-bottom-left-landlord-identity');
    const playerBottomLeftPlayedDiv = document.getElementById('player-bottom-left-played');

    // 上家 (左上角)
    const playerTopLeftHandDiv = document.getElementById('player-top-left-hand');
    const playerTopLeftCardCountSpan = document.getElementById('player-top-left-card-count');
    const playerTopLeftLandlordIdentity = document.getElementById('player-top-left-landlord-identity');
    const playerTopLeftPlayedDiv = document.getElementById('player-top-left-played');

    // 下家 (右上角)
    const playerTopRightHandDiv = document.getElementById('player-top-right-hand');
    const playerTopRightCardCountSpan = document.getElementById('player-top-right-card-count');
    const playerTopRightLandlordIdentity = document.getElementById('player-top-right-landlord-identity');
    const playerTopRightPlayedDiv = document.getElementById('player-top-right-played');

    const landlordCardsDiv = document.getElementById('landlord-cards');
    // ... (其他按钮和信息元素获取与之前类似) ...
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
    // 玩家对象映射到新的HTML ID
    // 出牌顺序：自己 -> 右上角 (下家) -> 左上角 (上家) -> 自己
    let players = {
        self: { id: 'self', hand: [], handElement: playerBottomLeftHandDiv, countElement: playerBottomLeftCardCountSpan, playedElement: playerBottomLeftPlayedDiv, landlordIdentityElement: playerBottomLeftLandlordIdentity, isLandlord: false, displayName: '你' },
        nextPlayer: { id: 'nextPlayer', hand: [], handElement: playerTopRightHandDiv, countElement: playerTopRightCardCountSpan, playedElement: playerTopRightPlayedDiv, landlordIdentityElement: playerTopRightLandlordIdentity, isLandlord: false, displayName: '下家' }, // 右上角为下家
        prevPlayer: { id: 'prevPlayer', hand: [], handElement: playerTopLeftHandDiv, countElement: playerTopLeftCardCountSpan, playedElement: playerTopLeftPlayedDiv, landlordIdentityElement: playerTopLeftLandlordIdentity, isLandlord: false, displayName: '上家' }  // 左上角为上家
    };
    const playerOrder = ['self', 'nextPlayer', 'prevPlayer']; // 斗地主出牌顺序 (逆时针)
    let currentPlayerIndex = 0;

    let landlordCards = [];
    let gameStarted = false;
    let selectedCards = [];
    let landlordPlayerId = null;


    // --- 卡牌工具函数 (createFullDeck, getSuitDisplayName, getRankDisplayName, shuffleDeck 与之前相同) ---
    function createFullDeck() { /* ... (与之前相同) ... */ }
    function getSuitDisplayName(suit) { /* ... (与之前相同) ... */ }
    function getRankDisplayName(rank) { /* ... (与之前相同) ... */ }
    function shuffleDeck(deckToShuffle) { /* ... (与之前相同) ... */ }

    function createCardElement(card, isOpponent = false, isLandlordCard = false) {
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

        // 只有轮到自己 (self) 且游戏已开始时，自己的牌才能被点击选中
        if (!isOpponent && gameStarted && playerOrder[currentPlayerIndex] === 'self') {
            cardDiv.addEventListener('click', () => toggleSelectCard(cardDiv, card));
        }
        return cardDiv;
    }

    function displayPlayerHand(playerId) {
        const player = players[playerId];
        if (!player || !player.handElement) {
            console.warn("Attempted to display hand for invalid player or missing handElement:", playerId);
            return;
        }
        player.handElement.innerHTML = '';
        player.hand.forEach(card => {
            // 'self' 不是对手，其他都是对手
            const cardElement = createCardElement(card, playerId !== 'self');
            player.handElement.appendChild(cardElement);
        });
        if (player.countElement) player.countElement.textContent = `牌: ${player.hand.length}`;
    }

    function displayLandlordCards(showFace = false) { /* ... (与之前相同) ... */ }


    // --- 游戏逻辑函数 ---
    function dealCards() {
        console.log("Dealing cards...");
        const fullNewDeck = createFullDeck();
        gameDeck = shuffleDeck(fullNewDeck);

        Object.values(players).forEach(player => {
            player.hand = [];
            if (player.playedElement) player.playedElement.innerHTML = '';
            player.isLandlord = false;
            if (player.landlordIdentityElement) player.landlordIdentityElement.textContent = '';
        });
        landlordCards = [];
        selectedCards = [];
        landlordPlayerId = null;

        // 发牌给三个玩家
        for (let i = 0; i < 17; i++) {
            if (gameDeck.length > 0) players.self.hand.push(gameDeck.pop());
            if (gameDeck.length > 0) players.nextPlayer.hand.push(gameDeck.pop()); // 下家
            if (gameDeck.length > 0) players.prevPlayer.hand.push(gameDeck.pop()); // 上家
        }

        if (gameDeck.length >= 3) {
            landlordCards = gameDeck.splice(0, 3);
        } else { /* ... (错误处理与之前相同) ... */ }

        Object.keys(players).forEach(sortPlayerHand);

        displayPlayerHand('self');
        displayPlayerHand('nextPlayer');
        displayPlayerHand('prevPlayer');
        displayLandlordCards(false);

        updateGameInfo();
        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;
    }

    function sortPlayerHand(playerId, ascending = false) { /* ... (与之前相同, 确保 displayPlayerHand('self') 只在自己理牌时调用) ... */
        const player = players[playerId];
        if (!player || !player.hand) return;
        player.hand.sort((a, b) => {
            if (a.value === b.value) return 0;
            return ascending ? (a.value - b.value) : (b.value - a.value);
        });
        if (playerId === 'self' && player.handElement) {
             displayPlayerHand('self'); // 只有自己的手牌区在理牌后需要立即重绘以反映可选状态
        }
    }


    function toggleSelectCard(cardElement, card) {
        if (!gameStarted || playerOrder[currentPlayerIndex] !== 'self' || !cardElement) return;
        // ... (与之前相同)
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
        if (selectedCards.length === 0 || playerOrder[currentPlayerIndex] !== 'self') return;
        const currentPlayer = players.self; // 出牌的总是自己
        // ... (其余逻辑与之前类似，确保 currentPlayer 指向 players.self)
        console.log(`${currentPlayer.displayName} 出牌:`, selectedCards.map(c => c.displayName).join(', '));

        currentPlayer.hand = currentPlayer.hand.filter(cardInHand =>
            !selectedCards.some(selectedCard => selectedCard.id === cardInHand.id)
        );

        if(currentPlayer.playedElement) currentPlayer.playedElement.innerHTML = '';
        selectedCards.forEach(card => {
            if(currentPlayer.playedElement) currentPlayer.playedElement.appendChild(createCardElement(card, false));
        });

        const oldSelectedCards = [...selectedCards];
        selectedCards = [];

        if (currentPlayer.handElement) {
             const allSelectedInHand = currentPlayer.handElement.querySelectorAll('.card.selected');
             allSelectedInHand.forEach(el => el.classList.remove('selected'));
        }
        
        displayPlayerHand(currentPlayer.id);

        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;

        switchPlayer();
        updateGameInfo();
    }

    function passTurn() {
        if (playerOrder[currentPlayerIndex] !== 'self') return;
        const currentPlayer = players.self;
        // ... (与之前类似)
        console.log(`${currentPlayer.displayName} 选择不要`);
        if (currentPlayer.playedElement) currentPlayer.playedElement.innerHTML = '<p style="color:var(--text-on-dark); font-style:italic;">不要</p>';
        
        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;

        switchPlayer();
        updateGameInfo();
    }

    function switchPlayer() {
        currentPlayerIndex = (currentPlayerIndex + 1) % playerOrder.length;
        const nextPlayerId = playerOrder[currentPlayerIndex];
        console.log("Switching turn to:", nextPlayerId, players[nextPlayerId].displayName);

        // 清空所有非当前回合玩家的出牌区 (如果他们不是pass)
        Object.values(players).forEach(p => {
            if (p.id !== nextPlayerId && p.playedElement) {
                // 保留"不要"的提示，清除其他牌
                const passMessage = p.playedElement.querySelector('p');
                if (!passMessage || !passMessage.textContent.includes('不要')) {
                    p.playedElement.innerHTML = '';
                }
            }
        });


        if (nextPlayerId === 'self') {
            if(passButton) passButton.disabled = false;
            if(playSelectedButton) playSelectedButton.disabled = selectedCards.length === 0;
            displayPlayerHand('self'); // 重新渲染自己的手牌以激活点击事件
        } else { // AI 玩家
            if (players[nextPlayerId] && players[nextPlayerId].playedElement) {
                 players[nextPlayerId].playedElement.innerHTML = ''; // 清空AI之前的出牌
            }
            setTimeout(() => {
                if (playerOrder[currentPlayerIndex] !== 'self' && gameStarted) { // 再次检查，防止快速切换
                    const aiPlayer = players[playerOrder[currentPlayerIndex]];
                    console.log(`${aiPlayer.displayName} AI回合跳过 (待实现)`);
                    if (aiPlayer.playedElement) aiPlayer.playedElement.innerHTML = `<p style="color:var(--text-on-dark); font-style:italic; font-size:0.8em;">(${aiPlayer.displayName} 不要)</p>`;
                    switchPlayer();
                    updateGameInfo();
                }
            }, 1200 + Math.random() * 800);
        }
    }

    function updateGameInfo() {
        const currentTurnPlayerId = playerOrder[currentPlayerIndex];
        if (currentTurnIndicator && players[currentTurnPlayerId]) {
            currentTurnIndicator.textContent = `轮到: ${players[currentTurnPlayerId].displayName}`;
        }

        landlordPlayerId = null;
        Object.values(players).forEach(player => {
            if (player.isLandlord) {
                landlordPlayerId = player.id;
                if(player.landlordIdentityElement) player.landlordIdentityElement.textContent = '(地主)';
            } else {
                // 只有在确定了地主后才显示农民
                if(player.landlordIdentityElement && gameStarted && landlordPlayerId) player.landlordIdentityElement.textContent = '(农民)';
                else if(player.landlordIdentityElement) player.landlordIdentityElement.textContent = ''; // 未确定地主前不显示身份
            }
        });
        
        const landlordDisplayName = landlordPlayerId ? players[landlordPlayerId].displayName : (gameStarted ? '待抢' : '待定');
        if (landlordIndicator) landlordIndicator.textContent = `地主: ${landlordDisplayName}`;


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
            landlordPlayerId = 'self';
            players.self.isLandlord = true;

            if (landlordCards && landlordCards.length > 0) {
                players.self.hand.push(...landlordCards);
                landlordCards = []; // 底牌已加入地主手牌
            }
            sortPlayerHand('self');
            // displayPlayerHand('self'); // sortPlayerHand 会调用

            displayLandlordCards(true); // 亮出（空的）底牌区，或者显示被拿走的底牌图案

            currentPlayerIndex = playerOrder.indexOf(landlordPlayerId);
            
            if(passButton) passButton.disabled = false;
            if(playSelectedButton) playSelectedButton.disabled = true;
            updateGameInfo();
            console.log("游戏开始！地主是:", players.self.displayName);
        } else {
            console.log("重新开始游戏...");
            gameStarted = false; // 允许下一局开始
            dealCards();
            startGame();
        }
    }

    // --- 事件监听器 (与之前相同) ---
    if (startGameButton) { startGameButton.addEventListener('click', () => { dealCards(); startGame(); }); }
    if (playSelectedButton) { playSelectedButton.addEventListener('click', playSelectedCards); }
    if (passButton) { passButton.addEventListener('click', passTurn); }
    if (sortHandButton) { sortHandButton.addEventListener('click', () => { if (players.self.hand && players.self.hand.length > 0) { sortPlayerHand('self'); } }); }

    // --- 初始化 ---
    function initializeGame() { /* ... (与之前相同，调用 dealCards, updateGameInfo, fetchHelloFromBackend) ... */ }
    async function fetchHelloFromBackend() { /* ... (与之前相同，确保文本更新逻辑正确) ... */ }

    initializeGame();
});

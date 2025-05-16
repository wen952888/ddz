// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 卡牌定义 ---
    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2']; // 2放到最后
    const JOKERS = [
        { name: 'joker_black', displayName: '小王', id: 'joker_black' }, // 添加id
        { name: 'joker_red', displayName: '大王', id: 'joker_red' }      // 添加id
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
    let gameDeck = []; // 修改变量名以示区分，这是当前游戏局的牌堆
    let players = {
        bottom: { id: 'bottom', hand: [], handElement: playerBottomHandDiv, countElement: playerBottomCardCountSpan, playedElement: playerBottomPlayedDiv, isLandlord: false, displayName: '你' },
        left: { id: 'left', hand: [], handElement: playerLeftHandDiv, countElement: playerLeftCardCountSpan, playedElement: playerLeftPlayedDiv, isLandlord: false, displayName: '下家' },
        top: { id: 'top', hand: [], handElement: playerTopHandDiv, countElement: playerTopCardCountSpan, playedElement: playerTopPlayedDiv, isLandlord: false, displayName: '上家' }
    };
    let landlordCards = [];
    let currentPlayerId = 'bottom';
    let gameStarted = false;
    let selectedCards = [];

    // --- 卡牌工具函数 ---
    function createFullDeck() { // 更明确的函数名
        const newDeck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                newDeck.push({
                    suit: suit,
                    rank: rank,
                    value: RANK_VALUES[rank],
                    imageFile: `${rank}_of_${suit}.png`,
                    displayName: `${getSuitDisplayName(suit)}${getRankDisplayName(rank)}`,
                    id: `${rank}_of_${suit}`
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
                id: joker.id // 使用 joker 对象中定义的 id
            });
        }
        return newDeck;
    }

    function getSuitDisplayName(suit) {
        switch (suit) {
            case 'hearts': return '红桃';
            case 'diamonds': return '方块';
            case 'clubs': return '梅花';
            case 'spades': return '黑桃';
            default: return '';
        }
    }

    function getRankDisplayName(rank) {
        const rankMap = {
            'jack': 'J', 'queen': 'Q', 'king': 'K', 'ace': 'A', '10': '10',
            '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
        };
        return rankMap[rank] || rank;
    }

    function createCardElement(card, isOpponent = false, isLandlordCard = false) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const imageName = (isOpponent && !isLandlordCard) ? CARD_BACK_IMAGE : card.imageFile;
        cardDiv.style.backgroundImage = `url('${IMAGE_PATH}${imageName}')`;
        cardDiv.dataset.id = card.id;
        cardDiv.dataset.rank = card.rank;
        cardDiv.dataset.suit = card.suit;
        cardDiv.dataset.value = String(card.value); // 确保 value 是字符串
        cardDiv.dataset.displayName = card.displayName;
        cardDiv.title = (isOpponent && !isLandlordCard) ? '对手的牌' : card.displayName;

        if (!isOpponent && gameStarted) {
            cardDiv.addEventListener('click', () => toggleSelectCard(cardDiv, card));
        }
        return cardDiv;
    }

    function displayPlayerHand(playerId) {
        const player = players[playerId];
        if (!player || !player.handElement) return; // 防御性检查
        player.handElement.innerHTML = '';
        player.hand.forEach(card => {
            const cardElement = createCardElement(card, playerId !== 'bottom');
            player.handElement.appendChild(cardElement);
        });
        if (player.countElement) player.countElement.textContent = `牌: ${player.hand.length}`;
    }

    function displayLandlordCards(showFace = false) {
        if (!landlordCardsDiv) return;
        landlordCardsDiv.innerHTML = '';
        landlordCards.forEach(card => {
            const cardElement = createCardElement(card, false, true);
            if (!showFace) {
                cardElement.style.backgroundImage = `url('${IMAGE_PATH}${CARD_BACK_IMAGE}')`;
                cardElement.title = '底牌';
            }
            landlordCardsDiv.appendChild(cardElement);
        });
    }

    function shuffleDeck(deckToShuffle) {
        const array = [...deckToShuffle];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- 游戏逻辑函数 ---
    function dealCards() {
        console.log("Dealing cards..."); // 调试信息
        // 1. 创建一副完整的新牌
        const fullNewDeck = createFullDeck();
        // 2. 打乱这副新牌
        const shuffledNewDeck = shuffleDeck(fullNewDeck);
        // 3. 将打乱后的牌赋值给当前游戏局的牌堆变量
        gameDeck = shuffledNewDeck; // <--- 这是关键的修正

        console.log("Deck shuffled, total cards:", gameDeck.length);


        for (const playerId in players) {
            players[playerId].hand = [];
            if (players[playerId].playedElement) players[playerId].playedElement.innerHTML = '';
            players[playerId].isLandlord = false;
        }
        landlordCards = [];
        selectedCards = [];

        // 发牌
        for (let i = 0; i < 17; i++) {
            if (gameDeck.length > 0) players.bottom.hand.push(gameDeck.pop()); else console.warn("Deck empty prematurely for bottom player");
            if (gameDeck.length > 0) players.left.hand.push(gameDeck.pop()); else console.warn("Deck empty prematurely for left player");
            if (gameDeck.length > 0) players.top.hand.push(gameDeck.pop()); else console.warn("Deck empty prematurely for top player");
        }
        console.log("Cards dealt to players. Remaining in deck:", gameDeck.length);


        if (gameDeck.length >= 3) {
            landlordCards = gameDeck.splice(0, 3);
        } else {
            landlordCards = [...gameDeck];
            gameDeck = [];
            console.warn("Not enough cards for full landlord hand! Remaining:", landlordCards.length);
        }
        console.log("Landlord cards set. Remaining in deck:", gameDeck.length); // 应该为0


        for (const playerId in players) {
            sortPlayerHand(playerId);
        }

        displayPlayerHand('bottom');
        displayPlayerHand('left');
        displayPlayerHand('top');
        displayLandlordCards(false);

        updateGameInfo();
        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;
    }

    function sortPlayerHand(playerId, ascending = false) {
        const player = players[playerId];
        if (!player || !player.hand) return;
        player.hand.sort((a, b) => {
            if (a.value === b.value) {
                return 0;
            }
            return ascending ? (a.value - b.value) : (b.value - a.value);
        });
        if (playerId === 'bottom' && player.handElement) { // 只重新渲染自己的手牌区
             displayPlayerHand('bottom');
        }
    }

    function toggleSelectCard(cardElement, card) {
        if (!gameStarted || currentPlayerId !== 'bottom' || !cardElement) return;

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
        if (selectedCards.length === 0 || currentPlayerId !== 'bottom') return;

        console.log("玩家出牌:", selectedCards.map(c => c.displayName).join(', '));

        players.bottom.hand = players.bottom.hand.filter(cardInHand =>
            !selectedCards.some(selectedCard => selectedCard.id === cardInHand.id)
        );

        if(players.bottom.playedElement) players.bottom.playedElement.innerHTML = '';
        selectedCards.forEach(card => {
            if(players.bottom.playedElement) players.bottom.playedElement.appendChild(createCardElement(card, false));
        });

        selectedCards = [];
        if (playerBottomHandDiv) {
            const cardElements = playerBottomHandDiv.querySelectorAll('.card.selected');
            cardElements.forEach(el => el.classList.remove('selected'));
        }
        
        displayPlayerHand('bottom');

        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;

        switchPlayer();
        updateGameInfo();
    }

    function passTurn() {
        if (currentPlayerId !== 'bottom') return;
        console.log("玩家选择不要");
        if (players.bottom.playedElement) players.bottom.playedElement.innerHTML = '<p style="color:white; font-style:italic;">不要</p>';
        
        if(playSelectedButton) playSelectedButton.disabled = true;
        if(passButton) passButton.disabled = true;

        switchPlayer();
        updateGameInfo();
    }

    function switchPlayer() {
        if (currentPlayerId === 'bottom') {
            currentPlayerId = 'left';
        } else if (currentPlayerId === 'left') {
            currentPlayerId = 'top';
        } else {
            currentPlayerId = 'bottom';
        }

        if (currentPlayerId === 'bottom') {
            if(passButton) passButton.disabled = false;
            if(playSelectedButton) playSelectedButton.disabled = selectedCards.length === 0; // 根据是否有选牌来决定
        } else {
            // 模拟AI
            if (players[currentPlayerId] && players[currentPlayerId].playedElement) {
                 players[currentPlayerId].playedElement.innerHTML = ''; // 清空AI出牌区
            }
            setTimeout(() => {
                if (currentPlayerId !== 'bottom' && gameStarted) {
                    console.log(`${players[currentPlayerId].displayName} AI回合跳过 (待实现)`);
                    switchPlayer();
                    updateGameInfo();
                }
            }, 1500);
        }
    }

    function updateGameInfo() {
        if (currentTurnIndicator) currentTurnIndicator.textContent = `轮到: ${players[currentPlayerId] ? players[currentPlayerId].displayName : '未知'}`;
        
        let landlordName = '待定';
        for (const id in players) {
            if (players[id].isLandlord) {
                landlordName = players[id].displayName;
                break;
            }
        }
        if (landlordIndicator) landlordIndicator.textContent = `地主: ${landlordName}`;

        for (const id in players) {
            if (players[id].countElement && players[id].hand) {
                players[id].countElement.textContent = `牌: ${players[id].hand.length}`;
            }
        }
    }

    function startGame() {
        if (!gameStarted) { // 确保只在游戏未开始时执行开始逻辑的核心部分
            gameStarted = true;
            players.bottom.isLandlord = true; // 简化，自己当地主
            if (landlordCards && landlordCards.length > 0) {
                players.bottom.hand.push(...landlordCards);
            }
            sortPlayerHand('bottom');
            displayPlayerHand('bottom'); // 更新自己的手牌显示
            displayLandlordCards(true); // 亮出底牌

            currentPlayerId = 'bottom';
            if(passButton) passButton.disabled = false;
            if(playSelectedButton) playSelectedButton.disabled = true; // 刚开始不能直接出牌，除非有默认选择
            updateGameInfo();
            console.log("游戏开始！");
        } else {
            console.log("游戏已开始，重新发牌...");
            // 如果游戏已开始，按钮功能变为“重新发牌”
            // dealCards() 已经在按钮的 click 事件中调用了，这里不需要重复
            // 但需要重置游戏状态标记
            gameStarted = false; // 重置游戏状态
            players.bottom.isLandlord = false; // 重置地主
            players.left.isLandlord = false;
            players.top.isLandlord = false;
            // 再次调用startGame来完成新一局的开始设置
            startGame();
        }
    }

    // --- 事件监听器 ---
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            dealCards(); // 总是先发牌
            startGame(); // 然后开始游戏逻辑（如果已开始则处理为新一局）
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
            if (players.bottom.hand && players.bottom.hand.length > 0) {
                sortPlayerHand('bottom');
            }
        });
    }

    // --- 初始化 ---
    function initializeGame() {
        console.log("Initializing game...");
        dealCards(); // 页面加载时先发一次牌
        updateGameInfo();
        if (footerTextElement) footerTextElement.textContent = '点击"开始新游戏"按钮开始';
        fetchHelloFromBackend(); // 获取后端消息
    }

    // --- (可选) 与后端通信示例 ---
    async function fetchHelloFromBackend() {
        console.log("fetchHelloFromBackend function CALLED");
        if (backendMessageDiv) backendMessageDiv.textContent = '正在从后端获取信息...';
        if (footerTextElement && footerTextElement.textContent.includes('点击"开始新游戏"按钮开始')) { // 避免覆盖游戏状态
             footerTextElement.textContent = '游戏开发中... (正在连接后端...)';
        }


        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/api/hello`);
            if (!response.ok) {
                console.error(`后端请求失败，状态码: ${response.status}`);
                const errorText = await response.text();
                console.error(`后端错误信息: ${errorText}`);
                if (backendMessageDiv) backendMessageDiv.textContent = `后端连接错误: ${response.status}`;
                if (footerTextElement) footerTextElement.textContent = '游戏开发中... (后端连接失败)';
                return;
            }
            const data = await response.json();
            console.log('来自后端的消息:', data.message);
            if (backendMessageDiv) {
                backendMessageDiv.textContent = `后端消息: ${data.message}`;
            }
            if (footerTextElement && footerTextElement.textContent.includes('正在连接后端')) {
                 footerTextElement.textContent = '游戏开发中... (后端连接成功!)';
            }

        } catch (error) {
            console.error('无法连接到后端或处理响应时出错:', error);
            if (backendMessageDiv) backendMessageDiv.textContent = '后端连接异常。';
            if (footerTextElement) footerTextElement.textContent = '游戏开发中... (后端连接异常)';
        }
    }

    initializeGame(); // 调用初始化函数
});

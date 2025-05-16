document.addEventListener('DOMContentLoaded', () => {
    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    // 点数顺序按斗地主大小排列 (3最小，大王最大，这里先按标准顺序，后续可调整)
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const JOKERS = [
        { name: 'joker_black', displayName: '小王' }, // 小王
        { name: 'joker_red', displayName: '大王' }    // 大王
    ];
    const CARD_BACK_IMAGE = 'back.png';
    const IMAGE_PATH = 'assets/cards/';

    // 用于实际游戏逻辑，给牌赋予点数值
    // 3=3, 4=4, ..., 10=10, J=11, Q=12, K=13, A=14, 2=15, 小王=16, 大王=17
    const RANK_VALUES = {
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'jack': 11, 'queen': 12, 'king': 13, 'ace': 14, '2': 15
    };
    const JOKER_VALUES = {
        'joker_black': 16,
        'joker_red': 17
    };


    function createDeck() {
        const deck = [];
        // 创建普通牌
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({
                    suit: suit,
                    rank: rank,
                    value: RANK_VALUES[rank], // 获取点数值
                    imageFile: `${rank}_of_${suit}.png`,
                    displayName: `${getSuitDisplayName(suit)}${getRankDisplayName(rank)}`
                });
            }
        }
        // 创建大小王
        for (const joker of JOKERS) {
            deck.push({
                suit: 'joker', // 特殊花色
                rank: joker.name,
                value: JOKER_VALUES[joker.name],
                imageFile: `${joker.name}.png`,
                displayName: joker.displayName
            });
        }
        return deck;
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
        // 对于J, Q, K, A, 10，我们希望显示字母，其他显示数字
        const rankMap = {
            'jack': 'J', 'queen': 'Q', 'king': 'K', 'ace': 'A', '10': '10',
            '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
        };
        return rankMap[rank] || rank;
    }

    function createCardElement(card, showFace = true) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const imageName = showFace ? card.imageFile : CARD_BACK_IMAGE;
        cardDiv.style.backgroundImage = `url('${IMAGE_PATH}${imageName}')`;
        cardDiv.setAttribute('data-rank', card.rank);
        cardDiv.setAttribute('data-suit', card.suit);
        cardDiv.setAttribute('data-value', card.value);
        cardDiv.title = showFace ? card.displayName : '牌背'; // 鼠标悬停提示
        return cardDiv;
    }

    function displayCards(cards, containerElement, showFace = true) {
        containerElement.innerHTML = ''; // 清空现有牌
        cards.forEach(card => {
            const cardElement = createCardElement(card, showFace);
            containerElement.appendChild(cardElement);
        });
    }

    function shuffleDeck(deck) {
        // Fisher-Yates shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // --- 初始化和事件监听 ---
    const fullDeck = createDeck(); // 创建一副完整的牌
    const playerHandDiv = document.getElementById('player-hand');
    const deckDisplayDiv = document.getElementById('deck-display');
    const dealButton = document.getElementById('deal-button');
    const showAllCardsButton = document.getElementById('show-all-cards-button');

    // 示例：显示牌堆中的前几张牌（牌面向上）
    displayCards(fullDeck.slice(0, 5), deckDisplayDiv, true);

    // 示例：发牌按钮功能
    dealButton.addEventListener('click', () => {
        const shuffledDeck = shuffleDeck([...fullDeck]); // 复制并打乱牌堆
        const playerCards = shuffledDeck.slice(0, 17); // 发17张牌给玩家
        
        // 按斗地主规则排序手牌 (值越大牌越大)
        playerCards.sort((a, b) => b.value - a.value); 

        displayCards(playerCards, playerHandDiv, true); // 显示手牌

        // 剩余的牌可以作为底牌或牌堆 (示例显示前3张底牌)
        const dipai = shuffledDeck.slice(17, 20);
        displayCards(dipai, deckDisplayDiv, true); // 显示底牌
    });

    // 显示所有牌型按钮功能
    showAllCardsButton.addEventListener('click', () => {
        // 按花色和点数排序以获得良好显示
        const sortedDeckForDisplay = [...fullDeck].sort((a, b) => {
            if (a.suit === b.suit) {
                return a.value - b.value; // 同花色按点数
            }
            // 为了聚合显示，可以自定义花色顺序
            const suitOrder = { 'hearts': 0, 'diamonds': 1, 'clubs': 2, 'spades': 3, 'joker': 4 };
            return suitOrder[a.suit] - suitOrder[b.suit];
        });
        displayCards(sortedDeckForDisplay, playerHandDiv, true);
        deckDisplayDiv.innerHTML = `<p>上方已显示所有 ${fullDeck.length} 张牌型。</p>`;
    });

    // 初始时显示牌背在手牌区作为占位符，或者提示
    playerHandDiv.innerHTML = '<p>点击 "发一副牌" 开始。</p>';


    // --- (可选) 与后端通信示例 ---
    async function fetchHelloFromBackend() {
        try {
            // 在本地开发时，如果前端用Live Server等运行在不同端口
            // 后端wrangler dev默认在8787，需要处理CORS
            // 部署后，如果前端是 myapp.pages.dev, 后端是 myapi.username.workers.dev
            // 也需要处理CORS，或者通过Pages Functions或自定义域名将API路由到同一域名下
            const response = await fetch('/api/hello'); // 假设后端API在 /api/hello
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('来自后端的消息:', data.message);
            // 你可以将此消息显示在页面上
        } catch (error) {
            console.error('无法连接到后端:', error);
            // 在页脚显示错误信息
            const footer = document.querySelector('footer p');
            if (footer) {
                footer.textContent += ' (后端连接失败)';
            }
        }
    }

    // 页面加载时尝试从后端获取消息
    // fetchHelloFromBackend(); // 暂时注释掉，因为后端还未完全配置
});

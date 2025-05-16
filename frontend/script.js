document.addEventListener('DOMContentLoaded', () => {
    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const JOKERS = [
        { name: 'joker_black', displayName: '小王' },
        { name: 'joker_red', displayName: '大王' }
    ];
    const CARD_BACK_IMAGE = 'back.png';
    const IMAGE_PATH = 'assets/cards/'; // 确保这个路径相对于 index.html 是正确的

    const RANK_VALUES = {
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'jack': 11, 'queen': 12, 'king': 13, 'ace': 14, '2': 15
    };
    const JOKER_VALUES = {
        'joker_black': 16,
        'joker_red': 17
    };

    // +++++++++++++ 后端 API URL +++++++++++++
    const BACKEND_API_BASE_URL = 'https://wkddz.wenxiu9528.workers.dev'; // 你的 Worker 基础 URL
    // ++++++++++++++++++++++++++++++++++++++++

    function createDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({
                    suit: suit,
                    rank: rank,
                    value: RANK_VALUES[rank],
                    imageFile: `${rank}_of_${suit}.png`,
                    displayName: `${getSuitDisplayName(suit)}${getRankDisplayName(rank)}`
                });
            }
        }
        for (const joker of JOKERS) {
            deck.push({
                suit: 'joker',
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
        // 确保图片路径是相对于 index.html 的
        cardDiv.style.backgroundImage = `url('${IMAGE_PATH}${imageName}')`;
        cardDiv.setAttribute('data-rank', card.rank);
        cardDiv.setAttribute('data-suit', card.suit);
        cardDiv.setAttribute('data-value', card.value);
        cardDiv.title = showFace ? card.displayName : '牌背';
        return cardDiv;
    }

    function displayCards(cards, containerElement, showFace = true) {
        containerElement.innerHTML = '';
        cards.forEach(card => {
            const cardElement = createCardElement(card, showFace);
            containerElement.appendChild(cardElement);
        });
    }

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    const fullDeck = createDeck();
    const playerHandDiv = document.getElementById('player-hand');
    const deckDisplayDiv = document.getElementById('deck-display');
    const dealButton = document.getElementById('deal-button');
    const showAllCardsButton = document.getElementById('show-all-cards-button');
    const backendMessageDiv = document.getElementById('backend-message'); // 获取显示后端消息的元素
    const footerTextElement = document.querySelector('footer p'); // 获取页脚元素

    if (dealButton) {
        dealButton.addEventListener('click', () => {
            const shuffledDeck = shuffleDeck([...fullDeck]);
            const playerCards = shuffledDeck.slice(0, 17);
            playerCards.sort((a, b) => b.value - a.value);
            displayCards(playerCards, playerHandDiv, true);
            const dipai = shuffledDeck.slice(17, 20);
            displayCards(dipai, deckDisplayDiv, true);
        });
    }

    if (showAllCardsButton) {
        showAllCardsButton.addEventListener('click', () => {
            const sortedDeckForDisplay = [...fullDeck].sort((a, b) => {
                if (a.suit === b.suit) {
                    return a.value - b.value;
                }
                const suitOrder = { 'hearts': 0, 'diamonds': 1, 'clubs': 2, 'spades': 3, 'joker': 4 };
                return suitOrder[a.suit] - suitOrder[b.suit];
            });
            displayCards(sortedDeckForDisplay, playerHandDiv, true);
            if (deckDisplayDiv) {
                deckDisplayDiv.innerHTML = `<p>上方已显示所有 ${fullDeck.length} 张牌型。</p>`;
            }
        });
    }

    if (playerHandDiv) {
        playerHandDiv.innerHTML = '<p>点击 "发一副牌" 开始。</p>';
    }


    async function fetchHelloFromBackend() {
        if (footerTextElement) footerTextElement.textContent = '正在连接后端...';
        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/api/hello`); // 使用定义的后端 URL
            if (!response.ok) {
                console.error(`后端请求失败，状态码: ${response.status}`);
                const errorText = await response.text();
                console.error(`后端错误信息: ${errorText}`);
                if (backendMessageDiv) backendMessageDiv.textContent = `后端连接错误: ${response.status}`;
                if (footerTextElement) footerTextElement.textContent = '扑克牌图片稍后上传 (后端连接失败)';
                return;
            }
            const data = await response.json();
            console.log('来自后端的消息:', data.message);
            if (backendMessageDiv) {
                backendMessageDiv.textContent = `后端消息: ${data.message}`;
            }
            if (footerTextElement) {
                 footerTextElement.textContent = '扑克牌图片稍后上传 (后端连接成功!)';
            }

        } catch (error) {
            console.error('无法连接到后端或处理响应时出错:', error);
            if (backendMessageDiv) backendMessageDiv.textContent = '后端连接异常。';
            if (footerTextElement) footerTextElement.textContent = '扑克牌图片稍后上传 (后端连接异常)';
        }
    }

    // 页面加载时尝试从后端获取消息
    fetchHelloFromBackend();
});

const board = document.getElementById('board');
const message = document.getElementById('message');
const winMessage = document.getElementById('win-message');
const scoreLeft = document.getElementById('score-left');
const scoreRight = document.getElementById('score-right');
const friendModeBtn = document.getElementById('friendMode');
const aiModeBtn = document.getElementById('aiMode');
const resetBtn = document.getElementById('reset');
const modeSwitchDiv = document.getElementById('mode-switch');

let cells = [];
let gameMode = null;
let player1Symbol = 'X', player2Symbol = 'O';
let player1Color = 'red', player2Color = 'blue';
let currentPlayer = 'player1';
let gameActive = false;
let player1Score = 0, player2Score = 0;
let userStarts = true;

friendModeBtn.addEventListener('click', () => startGame('friend'));
aiModeBtn.addEventListener('click', () => startGame('ai'));
resetBtn.addEventListener('click', resetGame);

function startGame(mode) {
    gameMode = mode;
    player1Score = 0;
    player2Score = 0;
    updateScoreDisplay(); // Update labels and scores
    initGame();
    friendModeBtn.style.display = 'none';
    aiModeBtn.style.display = 'none';
    updateModeSwitchButton();
}

function updateScoreDisplay() {
    // Player 1 (user) is always on the left
    scoreLeft.textContent = `Player 1: ${player1Score}`;
    // Right side depends on the mode
    scoreRight.textContent = `${gameMode === 'ai' ? 'AI' : 'Player 2'}: ${player2Score}`;
}

function initGame() {
    board.innerHTML = '';
    cells = Array(9).fill(null);
    gameActive = true;
    message.textContent = '';
    winMessage.style.display = 'none';
    removeWinningLine();

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', () => handleClick(i));
        board.appendChild(cell);
        cells[i] = cell;
    }

    currentPlayer = userStarts ? 'player1' : 'player2';
    updateTurnMessage();
    if (gameMode === 'ai' && currentPlayer === 'player2') {
        setTimeout(aiMove, 500);
    }
}

function updateModeSwitchButton() {
    modeSwitchDiv.innerHTML = '';
    const switchButton = document.createElement('button');
    if (gameMode === 'friend') {
        switchButton.textContent = 'Play with AI';
        switchButton.addEventListener('click', () => startGame('ai'));
    } else {
        switchButton.textContent = 'Play with Friend';
        switchButton.addEventListener('click', () => startGame('friend'));
    }
    modeSwitchDiv.appendChild(switchButton);
}

function handleClick(index) {
    if (!gameActive || cells[index].textContent) return;
    if (gameMode === 'friend' || (gameMode === 'ai' && currentPlayer === 'player1')) {
        makeMove(index, currentPlayer === 'player1' ? player1Symbol : player2Symbol,
                 currentPlayer === 'player1' ? player1Color : player2Color);
        currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
        if (gameActive) updateTurnMessage();
        if (gameMode === 'ai' && gameActive && currentPlayer === 'player2') {
            setTimeout(aiMove, 500);
        }
    }
}

function makeMove(index, symbol, color) {
    cells[index].textContent = symbol;
    cells[index].classList.add(color);
    cells[index].style.pointerEvents = 'none';
    checkGameState();
}

function aiMove() {
    if (!gameActive || currentPlayer !== 'player2') return;
    const move = minimax(cells.map(cell => cell.textContent || ''), player2Symbol).index;
    makeMove(move, player2Symbol, player2Color);
    currentPlayer = 'player1';
    if (gameActive) updateTurnMessage();
}

function checkGameState() {
    const boardState = cells.map(cell => cell.textContent || '');
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];

    for (let line of lines) {
        const [a, b, c] = line;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            gameActive = false;
            const winner = boardState[a] === player1Symbol ? 'player1' : 'player2';
            updateScore(winner);
            drawWinningLine(line, winner === 'player1' ? player1Color : player2Color);
            if (player1Score >= 5 || player2Score >= 5) {
                showGameWinner(winner);
            } else {
                message.textContent = `${winner === 'player1' ? 'Player 1' : (gameMode === 'ai' ? 'AI' : 'Player 2')} wins this round!`;
            }
            return;
        }
    }

    if (!boardState.includes('')) {
        gameActive = false;
        message.textContent = "It's a draw!";
    }
}

function updateScore(winner) {
    if (winner === 'player1') {
        player1Score++; // Player 1 (user) score
    } else if (winner === 'player2') {
        player2Score++; // Player 2 (friend or AI) score
    }
    updateScoreDisplay();
}

function showGameWinner(winner) {
    message.textContent = '';
    const winnerText = `${winner === 'player1' ? 'Player 1' : (gameMode === 'ai' ? 'AI' : 'Player 2')} won the game!`;
    winMessage.textContent = winnerText;
    winMessage.classList.add(winner === 'player1' ? 'red' : 'blue');
    winMessage.style.display = 'block';
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff073a', '#00d9ff', '#ffd700', '#00ff00', '#ff00ff']
    });
}

function updateTurnMessage() {
    if (!gameActive) return;
    if (player1Score >= 5 || player2Score >= 5) return;
    if (gameMode === 'friend') {
        message.textContent = `${currentPlayer === 'player1' ? 'Player 1' : 'Player 2'}'s turn!`;
    } else {
        message.textContent = `${currentPlayer === 'player1' ? 'Player 1' : 'AI'}'s turn!`;
    }
}

function minimax(board, player) {
    const available = board.map((val, i) => val === '' ? i : null).filter(i => i !== null);
    if (checkWinner(board, player1Symbol)) return { score: -10 };
    if (checkWinner(board, player2Symbol)) return { score: 10 };
    if (available.length === 0) return { score: 0 };

    let best = { score: player === player2Symbol ? -Infinity : Infinity };
    for (let i of available) {
        board[i] = player;
        const score = minimax(board, player === player2Symbol ? player1Symbol : player2Symbol).score;
        board[i] = '';
        if (player === player2Symbol) {
            if (score > best.score) best = { score, index: i };
        } else {
            if (score < best.score) best = { score, index: i };
        }
    }
    return best;
}

function checkWinner(board, symbol) {
    const lines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    return lines.some(([a, b, c]) => board[a] === symbol && board[a] === board[b] && board[a] === board[c]);
}

function drawWinningLine(line, color) {
    const [a, b, c] = line;
    const lineDiv = document.createElement('div');
    lineDiv.classList.add('winning-line', color);

    if (a === 0 && b === 1 && c === 2) { // Top row
        lineDiv.style.width = '294px';
        lineDiv.style.height = '5px';
        lineDiv.style.top = '47px';
        lineDiv.style.left = '10px';
    } else if (a === 3 && b === 4 && c === 5) { // Middle row
        lineDiv.style.width = '294px';
        lineDiv.style.height = '5px';
        lineDiv.style.top = '152px';
        lineDiv.style.left = '10px';
    } else if (a === 6 && b === 7 && c === 8) { // Bottom row
        lineDiv.style.width = '294px';
        lineDiv.style.height = '5px';
        lineDiv.style.top = '257px';
        lineDiv.style.left = '10px';
    } else if (a === 0 && b === 3 && c === 6) { // Left column
        lineDiv.style.width = '5px';
        lineDiv.style.height = '294px';
        lineDiv.style.top = '10px';
        lineDiv.style.left = '47px';
    } else if (a === 1 && b === 4 && c === 7) { // Middle column
        lineDiv.style.width = '5px';
        lineDiv.style.height = '294px';
        lineDiv.style.top = '10px';
        lineDiv.style.left = '152px';
    } else if (a === 2 && b === 5 && c === 8) { // Right column
        lineDiv.style.width = '5px';
        lineDiv.style.height = '294px';
        lineDiv.style.top = '10px';
        lineDiv.style.left = '257px';
    } else if (a === 0 && b === 4 && c === 8) { // Diagonal top-left to bottom-right
        lineDiv.style.width = '416px';
        lineDiv.style.height = '5px';
        lineDiv.style.top = '152px';
        lineDiv.style.left = '-51px';
        lineDiv.style.transform = 'rotate(45deg)';
    } else if (a === 2 && b === 4 && c === 6) { // Diagonal top-right to bottom-left
        lineDiv.style.width = '416px';
        lineDiv.style.height = '5px';
        lineDiv.style.top = '152px';
        lineDiv.style.left = '-51px';
        lineDiv.style.transform = 'rotate(-45deg)';
    }

    board.appendChild(lineDiv);
}

function removeWinningLine() {
    const line = document.querySelector('.winning-line');
    if (line) line.remove();
}

function resetGame() {
    userStarts = !userStarts;
    if (player1Score >= 5 || player2Score >= 5) {
        player1Score = 0;
        player2Score = 0;
        updateScoreDisplay();
    }
    initGame();
}
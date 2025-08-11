// ===== Discord-Aware Game State Management =====
class TicTacToeGame {
    constructor() {
        this.boardSize = 3;
        this.board = [];
        this.currentPlayerIndex = 0; // Index in players array
        this.gameActive = false;
        this.players = []; // Discord users who are players
        this.spectators = []; // Discord users who are spectating
        this.currentUser = null; // Current Discord user
        this.scores = {}; // Dynamic scoring by user ID
        this.symbols = { 0: '❌', 1: '⭕' };
        this.winningCombinations = [];
        this.gameHistory = [];
        this.gameId = this.generateGameId();
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeBoard();
    }

    initializeElements() {
        // Setup Panel Elements
        this.setupPanel = document.getElementById('setupPanel');
        this.gameContainer = document.getElementById('gameContainer');
        this.scoreboard = document.getElementById('scoreboard');
        this.spectatorInfo = document.getElementById('spectatorInfo');
        
        // Game Elements
        this.gameBoard = document.getElementById('gameBoard');
        this.currentPlayerText = document.getElementById('currentPlayerText');
        this.playerIndicator = document.getElementById('playerIndicator');
        this.statusMessage = document.getElementById('statusMessage');
        this.winAnimation = document.getElementById('winAnimation');
        this.winMessage = document.getElementById('winMessage');
        
        // Control Elements
        this.startGameBtn = document.getElementById('startGameBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.player1Symbol = document.getElementById('player1Symbol');
        this.player2Symbol = document.getElementById('player2Symbol');
        
        // Score Elements
        this.player1Score = document.getElementById('player1Score');
        this.player2Score = document.getElementById('player2Score');
    }

    attachEventListeners() {
        // Theme Toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Board Size Selection
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectBoardSize(e));
        });
        
        // Symbol Selection
        this.player1Symbol.addEventListener('change', () => this.updateSymbols());
        this.player2Symbol.addEventListener('change', () => this.updateSymbols());
        
        // Game Control Buttons
        this.startGameBtn.addEventListener('click', () => this.startNewGame());
        this.newGameBtn.addEventListener('click', () => this.resetToSetup());
        
        // Win Animation Click to Close
        this.winAnimation.addEventListener('click', () => this.closeWinAnimation());
    }

    // ===== Theme Management =====
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Animate theme transition
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-mode');
        } else {
            document.body.classList.add('dark-mode');
        }
    }

    // ===== Board Management =====
    selectBoardSize(e) {
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.boardSize = parseInt(e.target.dataset.size);
        
        // Add selection animation
        e.target.style.transform = 'scale(1.1)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 200);
    }

    updateSymbols() {
        this.symbols.player1 = this.player1Symbol.value;
        this.symbols.player2 = this.player2Symbol.value;
        
        // Prevent same symbols
        if (this.symbols.player1 === this.symbols.player2) {
            const alternatives = ['❌', '⭕', '🔥', '❄️', '⭐', '🌟', '💎', '💜', '🚀', '⚡'];
            const currentSymbol = this.symbols.player2;
            this.symbols.player2 = alternatives.find(alt => alt !== this.symbols.player1) || '⭕';
            this.player2Symbol.value = this.symbols.player2;
            
            // Show brief notification
            this.showNotification('Symbole müssen unterschiedlich sein!');
        }
    }

    initializeBoard() {
        this.board = Array(this.boardSize * this.boardSize).fill('');
        this.generateWinningCombinations();
        this.renderBoard();
    }

    generateWinningCombinations() {
        this.winningCombinations = [];
        const size = this.boardSize;
        
        // Rows
        for (let row = 0; row < size; row++) {
            const combination = [];
            for (let col = 0; col < size; col++) {
                combination.push(row * size + col);
            }
            this.winningCombinations.push(combination);
        }
        
        // Columns
        for (let col = 0; col < size; col++) {
            const combination = [];
            for (let row = 0; row < size; row++) {
                combination.push(row * size + col);
            }
            this.winningCombinations.push(combination);
        }
        
        // Diagonals
        const diagonal1 = [];
        const diagonal2 = [];
        for (let i = 0; i < size; i++) {
            diagonal1.push(i * size + i);
            diagonal2.push(i * size + (size - 1 - i));
        }
        this.winningCombinations.push(diagonal1);
        this.winningCombinations.push(diagonal2);
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = `game-board size-${this.boardSize}`;
        
        for (let i = 0; i < this.board.length; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.textContent = this.board[i];
            
            if (this.board[i] === '') {
                cell.addEventListener('click', () => this.makeMove(i));
            } else {
                cell.classList.add('filled');
            }
            
            this.gameBoard.appendChild(cell);
        }
    }

    // ===== Game Logic =====
    startNewGame() {
        // Only allow game start if we have 2 Discord players
        if (this.players.length < 2) {
            this.showNotification('Warten auf 2 Spieler im Voice Channel!');
            return;
        }
        
        this.gameActive = true;
        
        // Random starting player (0 or 1) from Discord users
        this.currentPlayerIndex = Math.floor(Math.random() * 2);
        
        this.initializeBoard();
        this.updateGameDisplay();
        
        // Show game elements with animation
        this.setupPanel.style.display = 'none';
        this.gameContainer.style.display = 'block';
        this.scoreboard.style.display = 'block';
        
        // Update scores display
        this.updateScoreDisplay();
        
        // Add entrance animation
        this.gameContainer.style.opacity = '0';
        this.gameContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.gameContainer.style.transition = 'all 0.6s ease';
            this.gameContainer.style.opacity = '1';
            this.gameContainer.style.transform = 'translateY(0)';
        }, 100);
        
        console.log(`🎮 Spiel gestartet! ${this.players[this.currentPlayerIndex].username} beginnt.`);
    }

    makeMove(index) {
        // Strict validation for Discord multiplayer
        if (!this.canUserMakeMove(index)) return;
        
        // Make the move
        const moveData = {
            index,
            player: this.currentPlayerIndex,
            userId: this.currentUser.id,
            symbol: this.symbols[this.currentPlayerIndex],
            timestamp: Date.now(),
            gameId: this.gameId
        };
        
        this.applyMove(moveData);
        
        // Sync with other participants
        if (window.discordManager) {
            window.discordManager.broadcastMove(moveData);
        }
    }

    checkWin() {
        for (const combination of this.winningCombinations) {
            const symbols = combination.map(index => this.board[index]);
            if (symbols.every(symbol => symbol !== '' && symbol === symbols[0])) {
                return { hasWin: true, combination };
            }
        }
        return { hasWin: false, combination: null };
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    handleWin(winningCombination) {
        this.gameActive = false;
        this.scores[`player${this.currentPlayer}`]++;
        
        // Highlight winning cells
        winningCombination.forEach(index => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('winning');
        });
        
        // Show win animation
        setTimeout(() => {
            this.showWinAnimation(`Spieler ${this.currentPlayer} gewinnt! 🎉`);
        }, 500);
        
        this.updateScoreDisplay();
        this.updateGameDisplay();
    }

    handleDraw() {
        this.gameActive = false;
        setTimeout(() => {
            this.showWinAnimation('Unentschieden! 🤝');
        }, 500);
        this.updateGameDisplay();
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateGameDisplay();
    }

    updateGameDisplay() {
        if (this.gameActive && this.players.length >= 2) {
            const currentPlayer = this.players[this.currentPlayerIndex];
            this.currentPlayerText.textContent = `${currentPlayer.username} ist dran`;
            this.playerIndicator.textContent = this.symbols[this.currentPlayerIndex];
            this.statusMessage.textContent = '';
            
            // Show turn indicator only for current player
            this.updateTurnVisibility();
        } else {
            this.currentPlayerText.textContent = 'Warten auf Spieler...';
            this.playerIndicator.textContent = '⏳';
        }
    }

    updateScoreDisplay() {
        if (this.players.length >= 2) {
            this.player1Score.textContent = this.scores[this.players[0].id] || 0;
            this.player2Score.textContent = this.scores[this.players[1].id] || 0;
        }
    }

    // ===== Discord Multiplayer Core Methods =====
    generateGameId() {
        return 'game_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    canUserMakeMove(index) {
        // Check if game is active
        if (!this.gameActive) return false;
        
        // Check if cell is empty
        if (this.board[index] !== '') return false;
        
        // Check if we have enough players
        if (this.players.length < 2) return false;
        
        // Check if current user is actually a player (not spectator)
        if (!this.currentUser || this.isUserSpectator()) return false;
        
        // Check if it's this user's turn
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer || currentPlayer.id !== this.currentUser.id) return false;
        
        return true;
    }

    applyMove(moveData) {
        // Apply the move to board
        this.board[moveData.index] = moveData.symbol;
        
        // Add smooth animation
        this.animateMove(moveData.index, moveData.symbol);
        
        // Check for win or draw
        const winResult = this.checkWin();
        if (winResult.hasWin) {
            this.handleWin(winResult.combination, moveData.player);
        } else if (this.checkDraw()) {
            this.handleDraw();
        } else {
            this.switchPlayer();
        }
        
        this.renderBoard();
    }

    animateMove(index, symbol) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (!cell) return;
        
        // Smooth scale animation
        cell.style.transform = 'scale(0)';
        cell.style.opacity = '0';
        cell.textContent = symbol;
        cell.classList.add('filled');
        
        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
            cell.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            cell.style.transform = 'scale(1)';
            cell.style.opacity = '1';
        });
    }

    switchPlayer() {
        this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;
        this.updateGameDisplay();
    }

    updateTurnVisibility() {
        // Show visual indicator for current player's turn
        const isMyTurn = this.currentUser && 
                        this.players[this.currentPlayerIndex] && 
                        this.players[this.currentPlayerIndex].id === this.currentUser.id;
        
        // Update UI to show whose turn it is
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            gameBoard.classList.toggle('my-turn', isMyTurn);
            gameBoard.classList.toggle('waiting-turn', !isMyTurn && !this.isUserSpectator());
        }
        
        // Update turn indicator
        const turnIndicator = document.querySelector('.current-player');
        if (turnIndicator) {
            turnIndicator.classList.toggle('active-turn', isMyTurn);
        }
    }

    setPlayers(participants) {
        // First 2 participants become players, rest are spectators
        this.players = participants.slice(0, 2);
        this.spectators = participants.slice(2);
        
        // Initialize scores for new players
        this.players.forEach(player => {
            if (!this.scores[player.id]) {
                this.scores[player.id] = 0;
            }
        });
        
        // Update player names in UI
        this.updatePlayerNames();
        this.updateScoreDisplay();
        this.updateGameDisplay();
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.updateTurnVisibility();
    }

    isUserSpectator() {
        if (!this.currentUser) return true;
        return !this.players.some(player => player.id === this.currentUser.id);
    }

    updatePlayerNames() {
        const scoreDisplay = document.querySelector('.score-display');
        if (scoreDisplay && this.players.length >= 2) {
            const playerNames = scoreDisplay.querySelectorAll('.player-name');
            if (playerNames[0]) playerNames[0].textContent = this.players[0].username;
            if (playerNames[1]) playerNames[1].textContent = this.players[1].username;
        }
    }

    receiveMove(moveData) {
        // Validate move data before applying
        if (!this.validateMoveData(moveData)) return;
        
        // Apply the move from other player
        this.applyMove(moveData);
    }

    validateMoveData(moveData) {
        // Check game ID matches
        if (moveData.gameId !== this.gameId) return false;
        
        // Check if move is valid for current board state
        if (this.board[moveData.index] !== '') return false;
        
        // Check if it's the correct player's turn
        if (moveData.player !== this.currentPlayerIndex) return false;
        
        return true;
    }



    // ===== Animations & Effects =====
    showWinAnimation(message) {
        this.winMessage.textContent = message;
        this.winAnimation.classList.add('active');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            this.closeWinAnimation();
        }, 3000);
    }

    closeWinAnimation() {
        this.winAnimation.classList.remove('active');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 15px 20px;
            color: var(--text-primary);
            font-weight: 500;
            z-index: 1001;
            animation: slideInFromRight 0.5s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.5s ease forwards';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    // ===== Game Reset =====
    resetToSetup() {
        this.gameActive = false;
        this.gameContainer.style.display = 'none';
        this.setupPanel.style.display = 'block';
        this.scoreboard.style.display = 'none';
        
        // Reset with animation
        this.setupPanel.style.opacity = '0';
        this.setupPanel.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            this.setupPanel.style.transition = 'all 0.6s ease';
            this.setupPanel.style.opacity = '1';
            this.setupPanel.style.transform = 'translateY(0)';
        }, 100);
    }

    restartGame() {
        this.initializeBoard();
        // Random starting player for new game
        this.currentPlayerIndex = Math.floor(Math.random() * 2);
        this.gameActive = true;
        this.updateGameDisplay();
        
        // Clear winning highlights
        document.querySelectorAll('.cell.winning').forEach(cell => {
            cell.classList.remove('winning');
        });
        
        if (this.players.length >= 2) {
            console.log(`🔄 Neues Spiel! ${this.players[this.currentPlayerIndex].username} beginnt.`);
        }
    }
}

// ===== Additional CSS for Notifications =====
const additionalStyles = `
@keyframes slideOutToRight {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100px);
    }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// ===== Initialize Game =====
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new TicTacToeGame();
    game.loadTheme();
});

// ===== Export for Discord Integration =====
window.TicTacToeGame = TicTacToeGame;

// ===== Discord Embedded App SDK Integration =====
import { DiscordSDK } from "@discord/embedded-app-sdk";

class DiscordActivityManager {
    constructor() {
        this.discordSdk = null;
        this.auth = null;
        this.participants = [];
        this.currentUser = null;
        this.isSpectator = false;
        this.gameInstance = null;
        
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize Discord SDK
            this.discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
            
            // Wait for SDK to be ready
            await this.discordSdk.ready();
            console.log("Discord SDK is ready");
            
            // Authorize the application
            await this.authorize();
            
            // Set up activity commands
            this.setupActivityCommands();
            
            // Get participants and set up sync
            this.setupParticipants();
            
        } catch (error) {
            console.error("Failed to initialize Discord SDK:", error);
            // Fallback to standalone mode
            this.initializeStandaloneMode();
        }
    }

    async authorize() {
        const { code } = await this.discordSdk.commands.authorize({
            client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
            response_type: "code",
            state: "",
            prompt: "none",
            scope: [
                "identify",
                "guilds",
                "rpc.activities.write",
                "rpc.voice.read",
            ],
        });

        // Exchange code for access token
        const response = await fetch("/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code,
            }),
        });

        const { access_token } = await response.json();

        // Authenticate with Discord
        const auth = await this.discordSdk.commands.authenticate({
            access_token,
        });

        if (auth == null) {
            throw new Error("Authentication failed");
        }

        this.auth = auth;
        this.currentUser = auth.user;
        console.log("Authenticated as:", this.currentUser.username);
    }

    setupActivityCommands() {
        // Set activity status
        this.discordSdk.commands.setActivity({
            activity: {
                type: 0,
                details: "Spielt TicTacToe",
                state: "Im Hauptmenü",
                timestamps: {
                    start: Date.now(),
                },
                assets: {
                    large_image: "tictactoe_logo",
                    large_text: "Discord TicTacToe",
                },
                party: {
                    size: [1, 2],
                },
                instance: true,
            },
        });
    }

    async setupParticipants() {
        // Get current participants
        const { participants } = await this.discordSdk.commands.getInstanceConnectedParticipants();
        this.participants = participants;
        
        // Determine if current user is a player or spectator
        this.determineUserRole();
        
        // Subscribe to participant updates
        this.discordSdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', (event) => {
            this.participants = event.participants;
            this.determineUserRole();
            this.updateParticipantDisplay();
        });
    }

    determineUserRole() {
        // For TicTacToe, only first 2 participants are players
        const playerParticipants = this.participants.slice(0, 2);
        this.isSpectator = !playerParticipants.some(p => p.id === this.currentUser.id);
        
        // Update game with current participants
        if (window.game) {
            window.game.setPlayers(this.participants);
            window.game.setCurrentUser(this.currentUser);
        }
        
        if (this.isSpectator) {
            this.showSpectatorMode();
        } else {
            this.hideSpectatorMode();
        }
    }

    showSpectatorMode() {
        const spectatorInfo = document.getElementById('spectatorInfo');
        if (spectatorInfo) {
            spectatorInfo.style.display = 'block';
            const players = this.participants.slice(0, 2);
            if (players.length >= 2) {
                spectatorInfo.innerHTML = `
                    <span>👥 Zuschauer-Modus</span>
                    <small>Du schaust ${players.map(p => p.username).join(' vs ')} zu</small>
                `;
            } else {
                spectatorInfo.innerHTML = `
                    <span>⏳ Warten auf Spieler</span>
                    <small>Benötigt ${2 - players.length} weitere Spieler</small>
                `;
            }
        }
        
        // Add spectator styling instead of disabling
        document.body.classList.add('spectator-mode');
    }

    hideSpectatorMode() {
        const spectatorInfo = document.getElementById('spectatorInfo');
        if (spectatorInfo) {
            spectatorInfo.style.display = 'none';
        }
        
        // Remove spectator styling
        document.body.classList.remove('spectator-mode');
    }

    updateParticipantDisplay() {
        // Update player names in UI if participants are available
        const player1Name = this.participants[0]?.username || 'Spieler 1';
        const player2Name = this.participants[1]?.username || 'Spieler 2';
        
        const scoreDisplay = document.querySelector('.score-display');
        if (scoreDisplay) {
            const playerNames = scoreDisplay.querySelectorAll('.player-name');
            if (playerNames[0]) playerNames[0].textContent = player1Name;
            if (playerNames[1]) playerNames[1].textContent = player2Name;
        }
        
        // Update current player text
        const currentPlayerText = document.getElementById('currentPlayerText');
        if (currentPlayerText && window.game?.gameActive) {
            const currentPlayerName = window.game.currentPlayer === 1 ? player1Name : player2Name;
            currentPlayerText.textContent = `${currentPlayerName} ist dran`;
        }
    }

    // ===== Game State Synchronization =====
    syncGameState(gameState) {
        if (!this.discordSdk) return;
        
        try {
            // Send game state to other participants
            this.discordSdk.commands.setActivity({
                activity: {
                    type: 0,
                    details: gameState.gameActive ? "Spielt TicTacToe" : "TicTacToe beendet",
                    state: this.getGameStateText(gameState),
                    timestamps: {
                        start: Date.now(),
                    },
                    assets: {
                        large_image: "tictactoe_logo",
                        large_text: "Discord TicTacToe",
                    },
                    party: {
                        size: [this.participants.length, 8], // Max 8 participants (2 players + 6 spectators)
                    },
                    instance: true,
                },
            });
        } catch (error) {
            console.error("Failed to sync game state:", error);
        }
    }

    getGameStateText(gameState) {
        if (!gameState.gameActive) {
            if (gameState.winner) {
                return `${gameState.winner} hat gewonnen!`;
            } else {
                return "Unentschieden";
            }
        }
        
        const playerName = this.participants[gameState.currentPlayer - 1]?.username || `Spieler ${gameState.currentPlayer}`;
        return `${playerName} ist dran`;
    }

    // ===== Standalone Mode Fallback =====
    initializeStandaloneMode() {
        console.log("Running in standalone mode (not in Discord)");
        // Hide spectator info and enable all controls
        const spectatorInfo = document.getElementById('spectatorInfo');
        if (spectatorInfo) {
            spectatorInfo.style.display = 'none';
        }
        
        // Add development notice
        const devNotice = document.createElement('div');
        devNotice.className = 'dev-notice glass-panel';
        devNotice.innerHTML = `
            <span>🔧 Entwicklungsmodus</span>
            <small>Läuft außerhalb von Discord</small>
        `;
        devNotice.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 10px 15px;
            font-size: 0.9rem;
            z-index: 1000;
        `;
        document.body.appendChild(devNotice);
    }

    // ===== Move Broadcasting & Synchronization =====
    broadcastMove(moveData) {
        if (!this.discordSdk) return;
        
        try {
            // Send move to all participants via Discord's messaging system
            this.discordSdk.commands.setActivity({
                activity: {
                    type: 0,
                    details: "Spielt TicTacToe",
                    state: `Zug von ${this.currentUser.username}`,
                    timestamps: {
                        start: Date.now(),
                    },
                    assets: {
                        large_image: "tictactoe_logo",
                        large_text: "Discord TicTacToe",
                    },
                    party: {
                        size: [this.participants.length, 8],
                    },
                    instance: true,
                    metadata: JSON.stringify(moveData) // Send move data
                },
            });
        } catch (error) {
            console.error("Failed to broadcast move:", error);
        }
    }

    // Setup message handlers for receiving moves from other players
    setupMessageHandlers() {
        if (!this.discordSdk) return;
        
        // Listen for activity updates that contain move data
        this.discordSdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', (event) => {
            this.participants = event.participants;
            this.determineUserRole();
            this.updateParticipantDisplay();
            
            // Check if there's move data in the activity
            if (event.activity && event.activity.metadata) {
                try {
                    const moveData = JSON.parse(event.activity.metadata);
                    if (moveData.gameId && window.game && moveData.userId !== this.currentUser.id) {
                        // Apply move from other player
                        window.game.receiveMove(moveData);
                    }
                } catch (e) {
                    // Ignore invalid move data
                }
            }
        });
    }

    // ===== Public API =====
    isUserSpectator() {
        return this.isSpectator;
    }

    getCurrentParticipants() {
        return this.participants;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// ===== Integration with Game Class =====
let discordManager;

// Initialize Discord integration when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    discordManager = new DiscordActivityManager();
    
    // Connect game events to Discord sync
    if (window.game) {
        const originalStartNewGame = window.game.startNewGame.bind(window.game);
        window.game.startNewGame = function() {
            originalStartNewGame();
            discordManager.syncGameState({
                gameActive: this.gameActive,
                currentPlayer: this.currentPlayer,
                scores: this.scores
            });
        };
        
        const originalMakeMove = window.game.makeMove.bind(window.game);
        window.game.makeMove = function(index) {
            originalMakeMove(index);
            discordManager.syncGameState({
                gameActive: this.gameActive,
                currentPlayer: this.currentPlayer,
                scores: this.scores,
                winner: !this.gameActive ? `Spieler ${this.currentPlayer}` : null
            });
        };
    }
});

// Export for global access
window.discordManager = discordManager;

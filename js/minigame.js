/**
 * EcoVators Mini-Game Module
 * Simple sustainable farming mini-game to demonstrate gamification
 */

class FarmingMiniGame {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.gameContainer = null;
        this.plants = [];
        this.waterDrops = [];
        this.isPlaying = false;
        this.gameInterval = null;
        this.difficultyInterval = 3000; // Time between water drops in ms
        this.maxPlants = 5;
    }

    // Initialize the game
    init(containerId) {
        this.gameContainer = document.getElementById(containerId);
        if (!this.gameContainer) {
            console.error('Game container not found');
            return;
        }

        // Create game UI
        this.createGameUI();
        
        // Add event listeners
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('game-field').addEventListener('click', (e) => this.handleFieldClick(e));
    }

    // Create the game UI
    createGameUI() {
        this.gameContainer.innerHTML = `
            <div class="minigame-container">
                <div class="game-header">
                    <h3>Sustainable Farming Mini-Game</h3>
                    <div class="game-stats">
                        <div class="game-score">Score: <span id="game-score">0</span></div>
                        <div class="game-level">Level: <span id="game-level">1</span></div>
                    </div>
                </div>
                <div class="game-instructions">
                    <p>Water the plants by clicking on them when water drops appear. Don't let plants dry out!</p>
                </div>
                <div id="game-field" class="game-field"></div>
                <div class="game-controls">
                    <button id="start-game-btn" class="btn-primary">Start Game</button>
                </div>
                <div class="game-rewards" style="display: none;" id="game-rewards">
                    <h4>Rewards Earned</h4>
                    <div class="rewards-list">
                        <div class="reward"><span class="xp">+25 XP</span></div>
                        <div class="reward"><span class="cc">+10 Carbon Credits</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Start the game
    startGame() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.score = 0;
        this.level = 1;
        this.plants = [];
        this.waterDrops = [];
        
        // Update UI
        document.getElementById('game-score').textContent = this.score;
        document.getElementById('game-level').textContent = this.level;
        document.getElementById('game-rewards').style.display = 'none';
        
        // Clear game field
        const gameField = document.getElementById('game-field');
        gameField.innerHTML = '';
        
        // Create plants
        for (let i = 0; i < this.maxPlants; i++) {
            this.createPlant();
        }
        
        // Start game loop
        this.gameInterval = setInterval(() => this.gameLoop(), 100);
        
        // Change button to "End Game"
        const startButton = document.getElementById('start-game-btn');
        startButton.textContent = 'End Game';
        startButton.removeEventListener('click', () => this.startGame());
        startButton.addEventListener('click', () => this.endGame());
    }

    // Create a plant
    createPlant() {
        const gameField = document.getElementById('game-field');
        const plant = document.createElement('div');
        plant.className = 'plant healthy';
        plant.dataset.health = 100;
        plant.dataset.id = Date.now() + Math.random().toString(16).slice(2);
        plant.style.left = `${Math.random() * 80 + 10}%`;
        plant.style.top = `${Math.random() * 70 + 15}%`;
        
        // Plant visual
        plant.innerHTML = `
            <div class="plant-visual">🌱</div>
            <div class="plant-health-bar">
                <div class="plant-health" style="width: 100%"></div>
            </div>
        `;
        
        gameField.appendChild(plant);
        this.plants.push(plant);
    }

    // Create a water drop
    createWaterDrop() {
        if (this.plants.length === 0) return;
        
        // Select a random plant
        const plantIndex = Math.floor(Math.random() * this.plants.length);
        const plant = this.plants[plantIndex];
        
        // Create water drop
        const waterDrop = document.createElement('div');
        waterDrop.className = 'water-drop';
        waterDrop.dataset.plantId = plant.dataset.id;
        waterDrop.style.left = plant.style.left;
        waterDrop.style.top = plant.style.top;
        
        // Water drop visual
        waterDrop.innerHTML = `💧`;
        
        document.getElementById('game-field').appendChild(waterDrop);
        this.waterDrops.push(waterDrop);
        
        // Auto-remove water drop after 3 seconds
        setTimeout(() => {
            if (this.waterDrops.includes(waterDrop)) {
                this.waterDrops = this.waterDrops.filter(drop => drop !== waterDrop);
                waterDrop.remove();
            }
        }, 3000);
    }

    // Handle field click
    handleFieldClick(e) {
        if (!this.isPlaying) return;
        
        // Check if clicked on a water drop
        if (e.target.classList.contains('water-drop') || e.target.parentElement.classList.contains('water-drop')) {
            const waterDrop = e.target.classList.contains('water-drop') ? e.target : e.target.parentElement;
            const plantId = waterDrop.dataset.plantId;
            
            // Find the plant
            const plant = this.plants.find(p => p.dataset.id === plantId);
            if (plant) {
                // Water the plant
                const health = parseInt(plant.dataset.health);
                plant.dataset.health = Math.min(health + 30, 100);
                plant.querySelector('.plant-health').style.width = `${plant.dataset.health}%`;
                
                // Update plant visual based on health
                this.updatePlantVisual(plant);
                
                // Increase score
                this.score += 10;
                document.getElementById('game-score').textContent = this.score;
                
                // Level up if needed
                if (this.score >= this.level * 50) {
                    this.levelUp();
                }
            }
            
            // Remove water drop
            this.waterDrops = this.waterDrops.filter(drop => drop !== waterDrop);
            waterDrop.remove();
        }
    }

    // Update plant visual based on health
    updatePlantVisual(plant) {
        const health = parseInt(plant.dataset.health);
        plant.classList.remove('healthy', 'warning', 'danger');
        
        if (health > 70) {
            plant.classList.add('healthy');
            plant.querySelector('.plant-visual').textContent = '🌿';
        } else if (health > 30) {
            plant.classList.add('warning');
            plant.querySelector('.plant-visual').textContent = '🌱';
        } else {
            plant.classList.add('danger');
            plant.querySelector('.plant-visual').textContent = '🥀';
        }
    }

    // Level up
    levelUp() {
        this.level++;
        document.getElementById('game-level').textContent = this.level;
        
        // Increase difficulty
        this.difficultyInterval = Math.max(500, this.difficultyInterval - 300);
    }

    // Game loop
    gameLoop() {
        // Decrease plant health
        for (const plant of this.plants) {
            const health = parseInt(plant.dataset.health);
            plant.dataset.health = Math.max(0, health - 0.2);
            plant.querySelector('.plant-health').style.width = `${plant.dataset.health}%`;
            
            // Update plant visual
            this.updatePlantVisual(plant);
            
            // Check if plant is dead
            if (parseInt(plant.dataset.health) === 0) {
                this.plants = this.plants.filter(p => p !== plant);
                plant.remove();
                
                // End game if all plants are dead
                if (this.plants.length === 0) {
                    this.endGame();
                    return;
                }
            }
        }
        
        // Create water drop randomly
        if (Math.random() < 0.01 && Date.now() % this.difficultyInterval < 100) {
            this.createWaterDrop();
        }
    }

    // End game
    endGame() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        clearInterval(this.gameInterval);
        
        // Clear game field
        const gameField = document.getElementById('game-field');
        gameField.innerHTML = '';
        
        // Show rewards
        document.getElementById('game-rewards').style.display = 'block';
        
        // Reset button
        const startButton = document.getElementById('start-game-btn');
        startButton.textContent = 'Start Game';
        startButton.removeEventListener('click', () => this.endGame());
        startButton.addEventListener('click', () => this.startGame());
        
        // Update user XP and carbon credits if possible
        try {
            // This would connect to your actual user system
            const xpEarned = this.score / 2;
            const ccEarned = Math.floor(this.score / 10);
            
            // For demo purposes, just update the display
            const xpElement = document.getElementById('xp');
            const ccElement = document.getElementById('cc');
            
            if (xpElement && ccElement) {
                const currentXP = parseInt(xpElement.textContent);
                const currentCC = parseInt(ccElement.textContent);
                
                xpElement.textContent = currentXP + xpEarned;
                ccElement.textContent = currentCC + ccEarned;
                
                // Update XP bar
                const xpBar = document.getElementById('xp-bar');
                if (xpBar) {
                    const newWidth = Math.min(100, (currentXP + xpEarned) / 20);
                    xpBar.style.width = `${newWidth}%`;
                }
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }
}

// Export the game
window.FarmingMiniGame = new FarmingMiniGame();
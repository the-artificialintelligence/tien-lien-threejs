import * as THREE from 'three';
import { RenderSystem } from '../systems/RenderSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { GameStateManager } from '../systems/GameStateManager.js';
import { CardRulesEngine } from '../systems/CardRulesEngine.js';
import { TurnManager } from '../systems/TurnManager.js';
import { AISystem } from '../systems/AISystem.js';

/**
 * GameEngine: Orchestrates all modular systems.
 * Philosophy: Assembles reusable systems like Lego blocks.
 * Each system is self-contained and communicates through clean interfaces.
 */
export class GameEngine {
  constructor(config) {
    this.config = config;
    this.systems = {};
    this.initialized = false;

    // Initialize systems in dependency order
    this.systems.renderer = new RenderSystem(config);
    this.systems.input = new InputSystem();
    this.systems.gameState = new GameStateManager();
    this.systems.rules = new CardRulesEngine();
    this.systems.turns = new TurnManager();
    this.systems.ai = new AISystem(this.systems.rules);

    // Bind systems together
    this._wireUpSystems();
  }

  /**
   * Wire systems to communicate with each other
   * without creating tight coupling.
   */
  _wireUpSystems() {
    // Input → Game State
    this.systems.input.on('cardSelected', (cardData) => {
      this.systems.gameState.selectCard(cardData);
    });

    this.systems.input.on('playCardClick', () => {
      const selectedCards = this.systems.gameState.getSelectedCards();
      const currentPlayer = this.systems.gameState.getCurrentPlayer();
      this._attemptCardPlay(currentPlayer, selectedCards);
    });

    // Game State → Renderer
    this.systems.gameState.on('stateChanged', (state) => {
      this.systems.renderer.updateGameState(state);
    });

    // Rules → Turn Manager
    this.systems.turns.on('turnStart', (player) => {
      if (player.isAI) {
        this.systems.ai.calculateMove(player, this.systems.gameState.getGameState());
      }
    });
  }

  /**
   * Attempt to play cards: validate via rules engine.
   */
  _attemptCardPlay(player, selectedCards) {
    const table = this.systems.gameState.getTableCards();
    
    // Validate move using rules engine
    const validation = this.systems.rules.validatePlay(selectedCards, table, player.hand);

    if (validation.isValid) {
      // Update game state
      this.systems.gameState.playCards(selectedCards);
      this.systems.turns.nextTurn();
      
      // Re-render
      this.systems.renderer.updateGameState(this.systems.gameState.getGameState());
    } else {
      console.warn('Invalid play:', validation.reason);
      this.systems.renderer.showMessage(validation.reason);
    }
  }

  start() {
    this.systems.gameState.initializeGame(4); // 4 players
    this.systems.renderer.render(this.systems.gameState.getGameState());
    this._gameLoop();
  }

  _gameLoop() {
    this.systems.renderer.animate();
    requestAnimationFrame(() => this._gameLoop());
  }

  resize(width, height) {
    this.systems.renderer.resize(width, height);
  }
}

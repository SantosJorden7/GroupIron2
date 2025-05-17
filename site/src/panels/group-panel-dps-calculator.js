/**
 * DPS Calculator Panel
 * Custom element for calculating combat DPS for group members
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";
import dpsUtils from "../data/dps-utils.js";

class DPSCalculatorPanel extends BaseElement {
  constructor() {
    super();
    this.selectedPlayer = null;
    this.selectedMonster = null;
    this.settings = {
      slayerTask: false,
      potions: {
        melee: false,
        ranged: false,
        magic: false
      },
      prayers: {
        piety: false,
        rigour: false,
        augury: false,
        chivalry: false,
        ultimateStrength: false,
        eagleEye: false,
        hawkEye: false,
        mysticMight: false,
        mysticWill: false
      },
      gearSource: "self" // Options: self, shared, everyone
    };
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.dataSource = "plugin"; // Default data source
    this.groupData = null;
    this.playerStats = null;
    this.monsterData = null;
    this.resultData = null;
    this.availableGear = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content dps-calculator-panel">
        <div class="panel-header">⚔️ DPS Calculator</div>
        <div class="panel-inner">
          <div class="calculator-header">
            <h3>DPS Calculator</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="calculator-section">
            <div class="section-title">Player</div>
            <div class="player-selector">
              <select class="player-select">
                <option value="">Select a player</option>
                <!-- Player options will be populated dynamically -->
              </select>
            </div>
          </div>
          
          <div class="calculator-section">
            <div class="section-title">Monster</div>
            <div class="monster-selector">
              <select class="monster-select">
                <option value="">Select a monster</option>
                <!-- Monster options will be populated dynamically -->
              </select>
            </div>
          </div>
          
          <div class="calculator-section">
            <div class="section-title">Settings</div>
            <div class="calculator-settings">
              <div class="settings-group">
                <div class="setting-item">
                  <label class="setting-label">
                    <input type="checkbox" class="setting-checkbox" data-setting="slayerTask"> Slayer Task
                  </label>
                </div>
              </div>
              
              <div class="settings-group">
                <div class="settings-title">Potions</div>
                <div class="setting-item">
                  <label class="setting-label">
                    <input type="checkbox" class="setting-checkbox" data-setting="potions.melee"> Super Combat
                  </label>
                </div>
                <div class="setting-item">
                  <label class="setting-label">
                    <input type="checkbox" class="setting-checkbox" data-setting="potions.ranged"> Ranging
                  </label>
                </div>
                <div class="setting-item">
                  <label class="setting-label">
                    <input type="checkbox" class="setting-checkbox" data-setting="potions.magic"> Magic
                  </label>
                </div>
              </div>
              
              <div class="settings-group">
                <div class="settings-title">Prayers</div>
                <div class="setting-item">
                  <label class="setting-label">
                    <input type="checkbox" class="setting-checkbox" data-setting="prayers.piety"> Piety
                  </label>
                </div>
                <div class="setting-item">
                  <label class="setting-label">
                    <input type="checkbox" class="setting-checkbox" data-setting="prayers.rigour"> Rigour
                  </label>
                </div>
                <div class="setting-item">
                  <label class="setting-label">
                    <input type="checkbox" class="setting-checkbox" data-setting="prayers.augury"> Augury
                  </label>
                </div>
              </div>
              
              <div class="settings-group">
                <div class="settings-title">Gear Source</div>
                <div class="gear-source-options">
                  <label class="radio-label">
                    <input type="radio" name="gearSource" value="self" checked class="setting-radio" data-setting="gearSource"> Self
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="gearSource" value="shared" class="setting-radio" data-setting="gearSource"> Shared
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="gearSource" value="everyone" class="setting-radio" data-setting="gearSource"> Everyone
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div class="loading-container">
            <div class="loading-text">Loading DPS calculator...</div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
          
          <div class="dps-result" style="display: none;">
            <div class="result-header">
              <h4>Calculated DPS</h4>
            </div>
            <div class="result-content">
              <!-- DPS results will be displayed here -->
            </div>
          </div>
          
          <div class="calculator-actions">
            <button class="calculate-button">Calculate DPS</button>
          </div>
        </div>
      </div>
    `;

    // Apply styles
    this.applyStyles();
    
    // Subscribe to group data events
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadCalculatorData();
    });
    
    // Add event listeners
    this.addEventListener("click", this.handleClick.bind(this));
    this.addEventListener("change", this.handleChange.bind(this));
    
    // Initial data load
    this.loadCalculatorData();
  }

  disconnectedCallback() {
    // Cleanup subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Remove event listeners
    this.removeEventListener("click", this.handleClick);
    this.removeEventListener("change", this.handleChange);
  }

  applyStyles() {
    // Add CSS for the panel
    const style = document.createElement('style');
    style.textContent = `
      .dps-calculator-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      .panel-inner {
        padding: 12px;
      }
      
      /* Panel header styles */
      .dps-calculator-panel .calculator-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .dps-calculator-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      /* Data source indicators */
      .dps-calculator-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .dps-calculator-panel .data-source {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-right: 4px;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        font-size: 12px;
      }
      
      .dps-calculator-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .dps-calculator-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .dps-calculator-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .dps-calculator-panel .last-updated {
        margin-left: 5px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      /* Section styles */
      .dps-calculator-panel .calculator-section {
        margin-bottom: 15px;
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        padding: 10px;
      }
      
      .dps-calculator-panel .section-title {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
        margin-bottom: 8px;
      }
      
      /* Selectors */
      .dps-calculator-panel select {
        width: 100%;
        padding: 6px 8px;
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
        border-radius: 2px;
      }
      
      /* Settings */
      .dps-calculator-panel .calculator-settings {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .dps-calculator-panel .settings-group {
        background-color: rgba(0, 0, 0, 0.1);
        padding: 8px;
        border-radius: 2px;
      }
      
      .dps-calculator-panel .settings-title {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        font-size: 14px;
        margin-bottom: 6px;
      }
      
      .dps-calculator-panel .setting-item {
        margin-bottom: 4px;
      }
      
      .dps-calculator-panel .setting-label {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .dps-calculator-panel .setting-checkbox {
        margin-right: 6px;
      }
      
      .dps-calculator-panel .gear-source-options {
        display: flex;
        gap: 12px;
      }
      
      .dps-calculator-panel .radio-label {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .dps-calculator-panel .setting-radio {
        margin-right: 4px;
      }
      
      /* Loading state */
      .dps-calculator-panel .loading-container {
        padding: 15px;
        text-align: center;
      }
      
      .dps-calculator-panel .loading-text {
        position: relative;
        padding-left: 24px;
      }
      
      .dps-calculator-panel .loading-text::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        margin-top: -8px;
        width: 16px;
        height: 16px;
        border: 2px solid var(--orange);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      /* Error state */
      .dps-calculator-panel .error-container {
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid rgba(168, 58, 58, 0.3);
        padding: 12px;
        margin: 10px 0;
        text-align: center;
        border-radius: 3px;
      }
      
      .dps-calculator-panel .error-text {
        color: #a83a3a;
        margin-bottom: 8px;
      }
      
      .dps-calculator-panel .retry-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      /* Result section */
      .dps-calculator-panel .dps-result {
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        margin-top: 15px;
        margin-bottom: 15px;
      }
      
      .dps-calculator-panel .result-header {
        background-color: var(--header-bg);
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .dps-calculator-panel .result-header h4 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--header-text);
      }
      
      .dps-calculator-panel .result-content {
        padding: 12px;
      }
      
      /* Actions */
      .dps-calculator-panel .calculator-actions {
        display: flex;
        justify-content: center;
        margin-top: 15px;
      }
      
      .dps-calculator-panel .calculate-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 6px 15px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
        border-radius: 2px;
      }
      
      .dps-calculator-panel .calculate-button:hover {
        background-color: var(--button-hover-bg);
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    const target = event.target;
    
    // Handle calculate button
    if (target.classList.contains("calculate-button")) {
      this.calculateDPS();
    }
    
    // Handle retry button
    if (target.classList.contains("retry-button")) {
      this.loadCalculatorData();
    }
  }

  handleChange(event) {
    const target = event.target;
    
    // Handle player selection change
    if (target.classList.contains("player-select")) {
      this.selectedPlayer = target.value;
    }
    
    // Handle monster selection change
    if (target.classList.contains("monster-select")) {
      this.selectedMonster = target.value;
    }
    
    // Handle settings changes
    if (target.classList.contains("setting-checkbox")) {
      const setting = target.dataset.setting;
      if (setting.includes('.')) {
        // Nested setting (e.g., potions.melee)
        const [group, name] = setting.split('.');
        this.settings[group][name] = target.checked;
      } else {
        // Top-level setting
        this.settings[setting] = target.checked;
      }
    }
    
    // Handle gear source changes
    if (target.classList.contains("setting-radio") && target.dataset.setting === "gearSource") {
      this.settings.gearSource = target.value;
    }
  }

  loadCalculatorData() {
    this.loading = true;
    this.updateDisplay();
    
    // Try to get data from plugin first (P)
    if (window.plugin && window.plugin.groupData) {
      try {
        // Retrieve group data from plugin
        this.groupData = window.plugin.groupData.getGroupData();
        
        // Load players
        this.loadPlayers(this.groupData);
        
        // Load monsters
        this.loadMonsters();
        
        this.dataSource = "plugin";
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
        this.updateDisplay();
        return;
      } catch (err) {
        console.warn("Failed to load data from plugin:", err);
        // Continue to fallback
      }
    }
    
    // Fallback to Wise Old Man API (W)
    this.tryWiseOldManData();
  }

  calculateDPS() {
    if (!this.selectedPlayer || !this.selectedMonster) {
      alert("Please select a player and a monster");
      return;
    }
    
    // Show loading state
    this.loading = true;
    this.updateDisplay();
    
    // Load player stats
    this.loadPlayerStats(this.selectedPlayer);
    
    // Load monster stats (async)
    this.loadMonsterStats(this.selectedMonster)
      .then(() => {
        // Load available gear based on settings
        this.loadAvailableGear();
        
        // Calculate best setup
        const player = {
          stats: this.playerStats,
          availableGear: this.availableGear
        };
        
        const settings = {
          slayerTask: this.settings.slayerTask,
          potions: this.settings.potions,
          prayers: this.settings.prayers
        };
        
        // Find best DPS setup
        this.resultData = dpsUtils.findBestDPSSetup(player, this.monsterData, settings);
        
        // Show results
        this.displayResults();
        
        // Update loading state
        this.loading = false;
        this.updateDisplay();
      })
      .catch(error => {
        this.error = `Failed to calculate DPS: ${error.message}`;
        this.loading = false;
        this.updateDisplay();
      });
  }
  
  loadPlayers(groupData) {
    const playerSelect = this.querySelector('.player-select');
    if (!playerSelect || !groupData || !groupData.players) {
      return;
    }
    
    let playerOptions = '<option value="">Select a player</option>';
    
    groupData.players.forEach(player => {
      playerOptions += `<option value="${player.id}">${player.name}</option>`;
    });
    
    playerSelect.innerHTML = playerOptions;
  }
  
  loadMonsters() {
    const monsterSelect = this.querySelector('.monster-select');
    if (!monsterSelect) {
      return;
    }
    
    // If we have a wiki service, try to load real monster data
    if (window.wikiService && window.wikiService.getMonsters) {
      window.wikiService.getMonsters()
        .then(monsters => {
          let monsterOptions = '<option value="">Select a monster</option>';
          
          monsters.forEach(monster => {
            monsterOptions += `<option value="${monster.id}">${monster.name}</option>`;
          });
          
          monsterSelect.innerHTML = monsterOptions;
        })
        .catch(() => {
          // If wiki service fails, use common monsters
          this.loadCommonMonsters(monsterSelect);
        });
    } else {
      // No wiki service, use common monsters
      this.loadCommonMonsters(monsterSelect);
    }
  }
  
  loadCommonMonsters(monsterSelect) {
    const commonMonsters = [
      { id: 'goblin', name: 'Goblin' },
      { id: 'hill_giant', name: 'Hill Giant' },
      { id: 'fire_giant', name: 'Fire Giant' },
      { id: 'abyssal_demon', name: 'Abyssal Demon' },
      { id: 'general_graardor', name: 'General Graardor' },
      { id: 'zulrah', name: 'Zulrah' },
      { id: 'vorkath', name: 'Vorkath' },
      { id: 'kalphite_queen', name: 'Kalphite Queen' },
      { id: 'corporeal_beast', name: 'Corporeal Beast' },
      { id: 'kril_tsutsaroth', name: 'K\'ril Tsutsaroth' }
    ];
    
    let monsterOptions = '<option value="">Select a monster</option>';
    
    commonMonsters.forEach(monster => {
      monsterOptions += `<option value="${monster.id}">${monster.name}</option>`;
    });
    
    monsterSelect.innerHTML = monsterOptions;
  }
  
  loadPlayerStats(playerId) {
    if (!this.groupData || !this.groupData.players) {
      this.playerStats = this.getDefaultPlayerStats();
      return;
    }
    
    const player = this.groupData.players.find(p => p.id === playerId);
    if (!player) {
      this.playerStats = this.getDefaultPlayerStats();
      return;
    }
    
    this.playerStats = player.stats || this.getDefaultPlayerStats();
  }
  
  getDefaultPlayerStats() {
    return {
      attack: 70,
      strength: 70,
      defense: 70,
      ranged: 70,
      magic: 70,
      prayer: 43,
      hitpoints: 70
    };
  }
  
  async loadMonsterStats(monsterId) {
    try {
      // Try to use wiki service if available
      if (window.wikiService && window.wikiService.getMonster) {
        this.monsterData = await window.wikiService.getMonster(monsterId);
      } else {
        // Fallback to dpsUtils
        this.monsterData = await dpsUtils.loadMonsterData(monsterId);
      }
    } catch (error) {
      console.error("Failed to load monster data:", error);
      this.monsterData = {
        id: monsterId,
        name: monsterId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        stats: {
          hitpoints: 100,
          attack: 70,
          strength: 70,
          defense: 70,
          magic: 70,
          ranged: 70
        },
        bonuses: {
          slashDefense: 20,
          stabDefense: 40,
          crushDefense: 30,
          magicDefense: 0,
          rangedDefense: 40
        },
        attributes: {
          size: "medium",
          isUndead: false,
          isDemon: false,
          isDragon: false
        }
      };
    }
  }
  
  loadAvailableGear() {
    if (!this.groupData) {
      this.availableGear = { equipment: [], inventory: [], bank: [] };
      return;
    }
    
    this.availableGear = dpsUtils.loadAvailableGear(
      this.selectedPlayer,
      this.settings.gearSource,
      this.groupData
    );
  }
  
  displayResults() {
    if (!this.resultData) {
      return;
    }
    
    const resultElement = this.querySelector('.dps-result');
    if (!resultElement) {
      return;
    }
    
    resultElement.style.display = 'block';
    
    const resultContent = this.querySelector('.result-content');
    if (!resultContent) {
      return;
    }
    
    let gearList = '';
    if (this.resultData.gear && this.resultData.gear.length > 0) {
      gearList = '<div class="gear-list">';
      this.resultData.gear.forEach(item => {
        gearList += `<div class="gear-item">${item.name || 'Unknown Item'}</div>`;
      });
      gearList += '</div>';
    }
    
    const playerName = this.getPlayerName(this.selectedPlayer);
    const monsterName = this.getMonsterName(this.selectedMonster);
    
    // Format percentage with 1 decimal place
    const formattedAccuracy = (this.resultData.accuracy * 100).toFixed(1) + '%';
    
    resultContent.innerHTML = `
      <div class="result-row">
        <div class="result-label">Player:</div>
        <div class="result-value">${playerName}</div>
      </div>
      <div class="result-row">
        <div class="result-label">Monster:</div>
        <div class="result-value">${monsterName}</div>
      </div>
      <div class="result-row">
        <div class="result-label">Attack Style:</div>
        <div class="result-value">${this.resultData.attackStyle || 'Unknown'}</div>
      </div>
      <div class="result-row">
        <div class="result-label">Weapon:</div>
        <div class="result-value">${this.resultData.weapon?.name || 'Unknown'}</div>
      </div>
      <div class="result-row">
        <div class="result-label">Maximum Hit:</div>
        <div class="result-value">${this.resultData.maxHit || 0}</div>
      </div>
      <div class="result-row">
        <div class="result-label">Accuracy:</div>
        <div class="result-value">${formattedAccuracy}</div>
      </div>
      <div class="result-row">
        <div class="result-label">DPS:</div>
        <div class="result-value">${this.resultData.dps || 0}</div>
      </div>
      <div class="result-section">
        <div class="result-section-title">Best Gear Setup:</div>
        ${gearList || '<div class="empty-gear">No gear data available</div>'}
      </div>
    `;
  }
  
  getPlayerName(playerId) {
    if (!this.groupData || !this.groupData.players) {
      return playerId;
    }
    
    const player = this.groupData.players.find(p => p.id === playerId);
    return player ? player.name : playerId;
  }
  
  getMonsterName(monsterId) {
    return monsterId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  tryWiseOldManData() {
    // Check if WOM service is available
    if (window.wiseOldManService) {
      try {
        window.wiseOldManService.getGroupData()
          .then(womData => {
            if (womData) {
              this.groupData = womData;
              this.dataSource = "wiseOldMan";
              
              // Load players
              this.loadPlayers(this.groupData);
              
              // Load monsters
              this.loadMonsters();
              
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateDisplay();
            } else {
              // Try the OSRS Wiki as last resort (K)
              this.tryWikiData();
            }
          })
          .catch(err => {
            console.warn("Failed to load data from Wise Old Man:", err);
            this.tryWikiData();
          });
      } catch (err) {
        this.tryWikiData();
      }
    } else {
      // No WOM service, try Wiki
      this.tryWikiData();
    }
  }
  
  tryWikiData() {
    // Check if Wiki service is available
    if (window.wikiService) {
      try {
        window.wikiService.getGroupData()
          .then(wikiData => {
            if (wikiData) {
              this.groupData = wikiData;
              this.dataSource = "wiki";
              
              // Load players
              this.loadPlayers(this.groupData);
              
              // Load monsters
              this.loadMonsters();
              
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateDisplay();
            } else {
              // No data from any source, use mock data
              this.useMockData();
            }
          })
          .catch(err => {
            console.warn("Failed to load data from Wiki:", err);
            this.useMockData();
          });
      } catch (err) {
        this.useMockData();
      }
    } else {
      // No Wiki service, use mock data
      this.useMockData();
    }
  }
  
  useMockData() {
    // Create mock group data
    this.groupData = {
      players: [
        {
          id: "player1",
          name: "Player 1",
          stats: {
            attack: 85,
            strength: 90,
            defense: 80,
            ranged: 75,
            magic: 70,
            prayer: 60,
            hitpoints: 85
          }
        },
        {
          id: "player2",
          name: "Player 2",
          stats: {
            attack: 70,
            strength: 75,
            defense: 70,
            ranged: 85,
            magic: 80,
            prayer: 60,
            hitpoints: 80
          }
        },
        {
          id: "player3",
          name: "Player 3",
          stats: {
            attack: 75,
            strength: 75,
            defense: 75,
            ranged: 80,
            magic: 90,
            prayer: 70,
            hitpoints: 80
          }
        }
      ],
      sharedBank: []
    };
    
    // Load players
    this.loadPlayers(this.groupData);
    
    // Load monsters
    this.loadMonsters();
    
    this.dataSource = "wiki"; // Show as Wiki source since it's our fallback
    this.loading = false;
    this.error = null;
    this.lastUpdated = new Date();
    this.updateDisplay();
  }

  updateDisplay() {
    // Update data source badges
    const pluginBadge = this.querySelector(".data-source.plugin");
    const womBadge = this.querySelector(".data-source.wom");
    const wikiBadge = this.querySelector(".data-source.wiki");
    
    if (pluginBadge) {
      pluginBadge.style.opacity = this.dataSource === "plugin" ? "1" : "0.3";
    }
    
    if (womBadge) {
      womBadge.style.opacity = this.dataSource === "wiseOldMan" ? "1" : "0.3";
    }
    
    if (wikiBadge) {
      wikiBadge.style.opacity = this.dataSource === "wiki" ? "1" : "0.3";
    }
    
    // Update last updated text
    const lastUpdatedElem = this.querySelector(".last-updated");
    if (lastUpdatedElem) {
      lastUpdatedElem.textContent = this.lastUpdated 
        ? `Last updated: ${this.lastUpdated.toLocaleTimeString()}`
        : "Not yet updated";
    }
    
    // Show/hide loading
    const loadingElem = this.querySelector(".loading-container");
    if (loadingElem) {
      loadingElem.style.display = this.loading ? "block" : "none";
    }
    
    // Show error if any
    const errorElem = this.querySelector(".error-container");
    if (errorElem) {
      if (this.error) {
        errorElem.style.display = "block";
        const errorTextElem = errorElem.querySelector(".error-text");
        if (errorTextElem) {
          errorTextElem.textContent = this.error;
        }
      } else {
        errorElem.style.display = "none";
      }
    }
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-dps-calculator', DPSCalculatorPanel);

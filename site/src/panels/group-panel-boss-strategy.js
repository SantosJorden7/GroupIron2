/**
 * Boss Strategy Panel
 * Custom element for tracking boss strategies and group readiness for bosses
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";
import dpsUtils from "../data/dps-utils.js";

class BossStrategyPanel extends BaseElement {
  constructor() {
    super();
    this.strategies = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.selectedBoss = null;
    this.dataSource = "plugin"; // Default data source
    this.groupMembers = [];
    this.groupGear = null;
    this.groupReadiness = {};
    this.wikiData = {};
    this.killCounts = {};
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content boss-strategy-panel">
        <div class="panel-header">👑 Boss Strategies</div>
        <div class="panel-inner">
          <div class="strategies-header">
            <h3>Boss Strategies</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="boss-selector">
            <select class="boss-select">
              <option value="">Select a boss</option>
            </select>
          </div>
          
          <div class="loading-container">
            <div class="loading-text">Loading boss strategies...</div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
          
          <div class="boss-content" style="display: none;">
            <div class="boss-header">
              <div class="boss-name-container">
                <div class="boss-icon"></div>
                <div class="boss-name-info">
                  <h4 class="boss-name"></h4>
                  <div class="boss-kc">KC: <span class="kc-value">0</span></div>
                </div>
              </div>
            </div>

            <div class="group-readiness-section">
              <div class="section-title">Group Readiness</div>
              <div class="group-readiness-content">
                <!-- Group readiness will be rendered here -->
              </div>
            </div>
            
            <div class="strategy-section">
              <div class="section-title">Strategy</div>
              <div class="strategy-content">
                <!-- Strategy content will be rendered here -->
              </div>
            </div>
            
            <div class="gear-suggestions-section">
              <div class="section-title">Gear Suggestions</div>
              <div class="gear-suggestions-content">
                <!-- Gear suggestions will be rendered here -->
              </div>
            </div>
            
            <div class="kill-tracker-section">
              <div class="section-title">Kill Tracker</div>
              <div class="kill-tracker-content">
                <!-- Kill tracker will be rendered here -->
              </div>
            </div>
          </div>
          
          <div class="strategy-actions" style="display: none;">
            <button class="edit-strategy-button">Edit Strategy</button>
            <button class="add-kill-button">Log Kill</button>
          </div>
        </div>
      </div>
    `;

    // Apply styles
    this.applyStyles();
    
    // Subscribe to group data events
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadStrategies();
    });
    
    // Add event listeners
    this.addEventListener("click", this.handleClick.bind(this));
    this.addEventListener("change", this.handleChange.bind(this));
    
    // Initial data load
    this.loadStrategies();
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
      .boss-strategy-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      .panel-inner {
        padding: 12px;
      }
      
      /* Panel header styles */
      .boss-strategy-panel .strategies-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .boss-strategy-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      /* Data source indicators */
      .boss-strategy-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .boss-strategy-panel .data-source {
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
      
      .boss-strategy-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .boss-strategy-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .boss-strategy-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .boss-strategy-panel .last-updated {
        margin-left: 5px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      /* Boss content layout */
      .boss-strategy-panel .boss-content {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 15px;
      }
      
      .boss-strategy-panel .boss-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 3px;
        border: 1px solid var(--border-color);
      }
      
      .boss-strategy-panel .boss-name-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .boss-strategy-panel .boss-icon {
        width: 40px;
        height: 40px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }
      
      .boss-strategy-panel .boss-name {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        margin: 0;
        color: var(--orange);
      }
      
      .boss-strategy-panel .boss-kc {
        font-size: 12px;
        opacity: 0.8;
      }
      
      /* Group readiness section */
      .boss-strategy-panel .group-readiness-section,
      .boss-strategy-panel .strategy-section,
      .boss-strategy-panel .gear-suggestions-section,
      .boss-strategy-panel .kill-tracker-section {
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .boss-strategy-panel .section-title {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 8px 12px;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        border-bottom: 1px solid var(--border-color);
      }
      
      .boss-strategy-panel .group-readiness-content,
      .boss-strategy-panel .strategy-content,
      .boss-strategy-panel .gear-suggestions-content,
      .boss-strategy-panel .kill-tracker-content {
        padding: 12px;
      }
      
      /* Group readiness bars */
      .boss-strategy-panel .member-readiness {
        margin-bottom: 8px;
      }
      
      .boss-strategy-panel .member-name {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      
      .boss-strategy-panel .member-name-label {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
      }
      
      .boss-strategy-panel .member-stats {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .boss-strategy-panel .readiness-bar-container {
        height: 8px;
        background-color: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
      }
      
      .boss-strategy-panel .readiness-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      
      .boss-strategy-panel .readiness-high {
        background-color: #4a934a;
      }
      
      .boss-strategy-panel .readiness-medium {
        background-color: #a87d3a;
      }
      
      .boss-strategy-panel .readiness-low {
        background-color: #a83a3a;
      }
      
      /* Gear suggestions */
      .boss-strategy-panel .gear-category {
        margin-bottom: 10px;
      }
      
      .boss-strategy-panel .gear-category-title {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        margin-bottom: 5px;
      }
      
      .boss-strategy-panel .gear-items {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .boss-strategy-panel .gear-item {
        display: flex;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 12px;
      }
      
      .boss-strategy-panel .gear-item img {
        width: 16px;
        height: 16px;
        margin-right: 5px;
      }
      
      /* Kill tracker */
      .boss-strategy-panel .kill-tracker-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .boss-strategy-panel .kill-tracker-table th,
      .boss-strategy-panel .kill-tracker-table td {
        text-align: left;
        padding: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .boss-strategy-panel .kill-tracker-table th {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        font-weight: normal;
      }
      
      /* Boss selector */
      .boss-strategy-panel .boss-selector {
        margin-bottom: 15px;
      }
      
      .boss-strategy-panel .boss-select {
        width: 100%;
        padding: 6px 8px;
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
        border-radius: 2px;
      }
      
      /* Loading state */
      .boss-strategy-panel .loading-container {
        padding: 15px;
        text-align: center;
      }
      
      .boss-strategy-panel .loading-text {
        position: relative;
        padding-left: 24px;
      }
      
      .boss-strategy-panel .loading-text::before {
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
      .boss-strategy-panel .error-container {
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid rgba(168, 58, 58, 0.3);
        padding: 12px;
        margin: 10px 0;
        text-align: center;
        border-radius: 3px;
      }
      
      .boss-strategy-panel .error-text {
        color: #a83a3a;
        margin-bottom: 8px;
      }
      
      .boss-strategy-panel .retry-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      /* Strategy content */
      .boss-strategy-panel .strategy-content {
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        overflow: hidden;
        padding: 0;
        min-height: 200px;
      }
      
      .boss-strategy-panel .strategy-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--header-bg);
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .boss-strategy-panel .boss-name {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--header-text);
        display: flex;
        align-items: center;
      }
      
      .boss-strategy-panel .boss-icon {
        width: 24px;
        height: 24px;
        margin-right: 6px;
      }
      
      .boss-strategy-panel .boss-kc {
        font-size: 12px;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 2px 8px;
        border-radius: 10px;
      }
      
      .boss-strategy-panel .strategy-body {
        padding: 12px;
      }
      
      .boss-strategy-panel .strategy-section {
        margin-bottom: 12px;
      }
      
      .boss-strategy-panel .section-title {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
        margin-bottom: 4px;
        font-size: 14px;
      }
      
      .boss-strategy-panel .section-content {
        font-size: 13px;
        line-height: 1.4;
      }
      
      .boss-strategy-panel .gear-setup {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        margin-top: 8px;
      }
      
      .boss-strategy-panel .gear-item {
        background-color: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        padding: 4px;
        text-align: center;
        border-radius: 2px;
      }
      
      .boss-strategy-panel .gear-item img {
        max-width: 32px;
        max-height: 32px;
      }
      
      .boss-strategy-panel .gear-item-name {
        font-size: 10px;
        margin-top: 2px;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* Actions */
      .boss-strategy-panel .strategy-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        gap: 10px;
      }
      
      .boss-strategy-panel button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 6px 12px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 2px;
        flex: 1;
      }
      
      .boss-strategy-panel button:hover {
        background-color: var(--button-hover-bg);
      }
      
      .boss-strategy-panel .edit-strategy-button {
        background-color: #305830;
        border-color: #254025;
        color: white;
      }
      
      /* Empty state */
      .boss-strategy-panel .empty-state {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text);
      }
      
      /* Player notes */
      .boss-strategy-panel .player-notes {
        margin-top: 15px;
      }
      
      .boss-strategy-panel .note-item {
        background-color: rgba(0, 0, 0, 0.1);
        border-left: 3px solid var(--orange);
        padding: 8px 10px;
        margin-bottom: 8px;
        font-size: 12px;
      }
      
      .boss-strategy-panel .note-author {
        color: var(--orange);
        font-weight: bold;
        margin-right: 5px;
      }
      
      .boss-strategy-panel .note-date {
        font-size: 10px;
        opacity: 0.7;
      }
      
      .boss-strategy-panel .note-content {
        margin-top: 4px;
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    const target = event.target;
    
    // Handle retry button
    if (target.classList.contains("retry-button")) {
      this.loadStrategies();
    }
    
    // Handle edit strategy button
    if (target.classList.contains("edit-strategy-button")) {
      alert("Edit strategy functionality would be implemented here");
    }
    
    // Handle add kill button
    if (target.classList.contains("add-kill-button")) {
      alert("Log kill functionality would be implemented here");
    }
  }

  async handleChange(event) {
    const target = event.target;
    
    // Handle boss selection change
    if (target.classList.contains("boss-select")) {
      const bossName = target.value;
      this.selectedBoss = bossName;
      
      if (bossName) {
        // Calculate group readiness for this boss
        await this.calculateGroupReadiness(bossName);
        this.displayBossStrategy(bossName);
      } else {
        this.clearStrategyDisplay();
      }
    }
  }

  async loadStrategies() {
    this.loading = true;
    this.updateDisplay();
    
    try {
      // First, try to load group members and gear data
      await this.loadGroupData();
      
      // Then, try to load boss strategies
      await this.loadBossStrategies();
      
      // Also load kill counts
      await this.loadKillCounts();
      
      // If we have a selected boss, calculate group readiness for it
      if (this.selectedBoss) {
        await this.calculateGroupReadiness(this.selectedBoss);
      }
      
      this.loading = false;
      this.error = null;
      this.lastUpdated = new Date();
      this.updateDisplay();
    } catch (error) {
      console.error('Error loading boss strategies:', error);
      this.error = `Failed to load strategies: ${error.message}`;
      this.loading = false;
      this.updateDisplay();
    }
  }
  
  async loadGroupData() {
    // Try to get data from plugin first (P)
    if (window.plugin && window.plugin.groupData) {
      try {
        const groupData = await window.plugin.groupData.getGroupData();
        if (groupData && groupData.members) {
          this.groupMembers = groupData.members;
          this.groupGear = {
            equipment: groupData.equipment || [],
            inventory: groupData.inventory || [],
            bank: groupData.bank || [],
            sharedBank: groupData.sharedBank || []
          };
          return;
        }
      } catch (err) {
        console.warn("Failed to load group data from plugin:", err);
      }
    }
    
    // Fallback to WOM
    if (window.wiseOldManService && window.wiseOldManService.getGroupData) {
      try {
        const womData = await window.wiseOldManService.getGroupData();
        if (womData && womData.members) {
          this.groupMembers = womData.members;
          this.groupGear = {
            equipment: womData.equipment || [],
            inventory: womData.inventory || [],
            bank: womData.bank || [],
            sharedBank: womData.sharedBank || []
          };
          return;
        }
      } catch (err) {
        console.warn("Failed to load group data from WOM:", err);
      }
    }
    
    // Fallback to mock data
    this.groupMembers = [
      {
        id: 'player1',
        name: 'Player 1',
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
        id: 'player2',
        name: 'Player 2',
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
        id: 'player3',
        name: 'Player 3',
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
    ];
    
    this.groupGear = {
      equipment: [],
      inventory: [],
      bank: [],
      sharedBank: []
    };
  }
  
  async loadBossStrategies() {
    // Try to get data from plugin first (P)
    if (window.plugin && window.plugin.bossStrategies) {
      try {
        const pluginStrategies = await window.plugin.bossStrategies.getStrategies();
        if (pluginStrategies && Object.keys(pluginStrategies).length > 0) {
          this.strategies = pluginStrategies;
          this.dataSource = "plugin";
          return;
        }
      } catch (err) {
        console.warn("Failed to load strategies from plugin:", err);
      }
    }
    
    // Fallback to Wise Old Man API (W)
    await this.tryWiseOldManStrategies();
  }
  
  async loadKillCounts() {
    // Try to get KC from plugin first
    if (window.plugin && window.plugin.bossKillcounts) {
      try {
        const pluginKCs = await window.plugin.bossKillcounts.getKillcounts();
        if (pluginKCs) {
          this.killCounts = pluginKCs;
          return;
        }
      } catch (err) {
        console.warn("Failed to load kill counts from plugin:", err);
      }
    }
    
    // Fallback to WOM
    if (window.wiseOldManService && window.wiseOldManService.getBossKillcounts) {
      try {
        const womKCs = await window.wiseOldManService.getBossKillcounts();
        if (womKCs) {
          this.killCounts = womKCs;
          return;
        }
      } catch (err) {
        console.warn("Failed to load kill counts from WOM:", err);
      }
    }
    
    // Use mock data as a last resort
    this.killCounts = {
      'General Graardor': 42,
      'Zulrah': 78,
      'King Black Dragon': 120,
      'Corporeal Beast': 15
    };
  }

  async tryWiseOldManStrategies() {
    // Check if WOM service is available
    if (window.wiseOldManService && window.wiseOldManService.getBossStrategies) {
      try {
        const womStrategies = await window.wiseOldManService.getBossStrategies();
        if (womStrategies && Object.keys(womStrategies).length > 0) {
          this.strategies = womStrategies;
          this.dataSource = "wiseOldMan";
          return;
        }
      } catch (err) {
        console.warn("Failed to load strategies from Wise Old Man:", err);
      }
    }
    
    // No successful WOM data, try Wiki
    await this.tryWikiStrategies();
  }

  async tryWikiStrategies() {
    // Check if Wiki service is available
    if (window.wikiService && window.wikiService.getBossStrategies) {
      try {
        const wikiStrategies = await window.wikiService.getBossStrategies();
        if (wikiStrategies && Object.keys(wikiStrategies).length > 0) {
          this.strategies = wikiStrategies;
          this.dataSource = "wiki";
          await this.calculateGroupReadiness(this.selectedBoss);
          return;
        }
      } catch (err) {
        console.warn("Failed to load strategies from Wiki:", err);
      }
    }
    
    // No Wiki data, use mock data
    this.useMockData();
  }

  useMockData() {
    // Simulate loading data from the server
    setTimeout(() => {
      try {
        // Mock data - in a real implementation this would use the API
        this.strategies = {
          "General Graardor": {
            id: "graardor",
            name: "General Graardor",
            location: "God Wars Dungeon",
            killcount: 87,
            icon: "./img/bosses/graardor.png",
            strategy: "Tank and spank strategy. One player tanks with high defense gear while others focus on dealing maximum DPS with ranged or magic attacks from a distance.",
            gear: [
              { name: "Bandos Chestplate", slot: "body", image: "./img/items/bandos_chestplate.png" },
              { name: "Bandos Tassets", slot: "legs", image: "./img/items/bandos_tassets.png" },
              { name: "Abyssal Whip", slot: "weapon", image: "./img/items/abyssal_whip.png" },
              { name: "Dragon Defender", slot: "shield", image: "./img/items/dragon_defender.png" }
            ],
            setup: {
              tank: "Player1",
              dps: ["Player2", "Player3"]
            },
            inventory: "3 Super combat potions, 1 Stamina potion, 2 Prayer potions, Rest sharks or better food",
            notes: [
              {
                author: "Player1",
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
                content: "We should bring more prayer potions next time."
              },
              {
                author: "Player2",
                date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                content: "I found that standing in the southwest corner works best for ranging."
              }
            ]
          },
          "Zulrah": {
            id: "zulrah",
            name: "Zulrah",
            location: "Zul-Andra",
            killcount: 143,
            icon: "./img/bosses/zulrah.png",
            strategy: "Memorize rotation patterns. Switch gear and prayer based on Zulrah's current form. Move to safe spots during toxic cloud phase.",
            gear: [
              { name: "Void Mage Helm", slot: "head", image: "./img/items/void_mage_helm.png" },
              { name: "Void Ranger Helm", slot: "head", image: "./img/items/void_ranger_helm.png" },
              { name: "Trident of the Swamp", slot: "weapon", image: "./img/items/trident_of_the_swamp.png" },
              { name: "Toxic Blowpipe", slot: "weapon", image: "./img/items/toxic_blowpipe.png" }
            ],
            setup: {
              recommended: "Solo"
            },
            inventory: "1 Anti-venom+, 1 Ranging potion, 1 Magic potion, 2 Prayer potions, Ring of dueling, Rest high healing food",
            notes: [
              {
                author: "Player3",
                date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
                content: "Remember to stand one tile east during the second rotation to avoid damage."
              }
            ]
          },
          "Corporeal Beast": {
            id: "corp",
            name: "Corporeal Beast",
            location: "Corporeal Beast Cave",
            killcount: 52,
            icon: "./img/bosses/corporeal_beast.png",
            strategy: "Spec down with Dragon Warhammer and Bandos Godsword to reduce defense, then attack with spears only. Avoid the dark energy core by moving away.",
            gear: [
              { name: "Zamorakian Spear", slot: "weapon", image: "./img/items/zamorakian_spear.png" },
              { name: "Dragon Warhammer", slot: "spec", image: "./img/items/dragon_warhammer.png" },
              { name: "Bandos Godsword", slot: "spec", image: "./img/items/bandos_godsword.png" },
              { name: "Karil's Top", slot: "body", image: "./img/items/karils_top.png" }
            ],
            setup: {
              specDps: ["Player1", "Player2"],
              healer: "Player3"
            },
            inventory: "2 Super combat potions, 4-6 Prayer potions, Games necklace, Rest high healing food",
            notes: [
              {
                author: "Player1",
                date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
                content: "Need at least 3 DWH specs to make kills efficient."
              }
            ]
          }
        };
        
        this.dataSource = "wiki"; // Show as Wiki source since it's our fallback
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
      } catch (error) {
        this.loading = false;
        this.error = error.message || "Failed to load boss strategies";
      }
      
      this.updateDisplay();
    }, 1000);
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
    
    // Populate boss dropdown
    const bossSelect = this.querySelector(".boss-select");
    if (bossSelect && !this.loading && !this.error) {
      // Clear existing options except the default one
      while (bossSelect.options.length > 1) {
        bossSelect.remove(1);
      }
      
      // Add options for each boss
      const bossNames = Object.keys(this.strategies);
      bossNames.sort(); // Sort alphabetically
      
      bossNames.forEach(bossName => {
        const option = document.createElement("option");
        option.value = bossName;
        option.textContent = bossName;
        bossSelect.appendChild(option);
      });
      
      // Restore selected boss if there was one
      if (this.selectedBoss && bossNames.includes(this.selectedBoss)) {
        bossSelect.value = this.selectedBoss;
        this.displayBossStrategy(this.selectedBoss);
      } else {
        this.clearStrategyDisplay();
      }
    }
    
    // Show/hide boss content and actions
    const bossContentElem = this.querySelector(".boss-content");
    if (bossContentElem) {
      bossContentElem.style.display = (!this.loading && !this.error && this.selectedBoss) ? "block" : "none";
    }
    
    const actionsElem = this.querySelector(".strategy-actions");
    if (actionsElem) {
      actionsElem.style.display = this.selectedBoss ? "flex" : "none";
    }
  }

  displayBossStrategy(bossName) {
    const strategy = this.strategies[bossName];
    if (!strategy) return;
    
    // Update boss header information
    const bossNameElem = this.querySelector('.boss-name');
    if (bossNameElem) {
      bossNameElem.textContent = bossName;
    }
    
    const bossIcon = this.querySelector('.boss-icon');
    if (bossIcon && strategy.icon) {
      bossIcon.style.backgroundImage = `url(${strategy.icon})`;
    }
    
    // Update kill count
    const kcValue = this.querySelector('.kc-value');
    if (kcValue) {
      const killCount = this.killCounts[bossName] || 0;
      kcValue.textContent = killCount;
    }
    
    // Display group readiness section
    const readinessContent = this.querySelector('.group-readiness-content');
    if (readinessContent) {
      if (Object.keys(this.groupReadiness).length === 0) {
        readinessContent.innerHTML = '<div>No group readiness data available</div>';
      } else {
        let readinessHtml = '';
        
        // Sort members by readiness (highest first)
        const sortedMembers = Object.values(this.groupReadiness)
          .sort((a, b) => b.overallReadiness - a.overallReadiness);
        
        // Create a readiness bar for each member
        sortedMembers.forEach(member => {
          // Determine color class based on readiness level
          let colorClass = 'readiness-low';
          if (member.overallReadiness >= 75) {
            colorClass = 'readiness-high';
          } else if (member.overallReadiness >= 50) {
            colorClass = 'readiness-medium';
          }
          
          readinessHtml += `
            <div class="member-readiness">
              <div class="member-name">
                <div class="member-name-label">${member.memberName}</div>
                <div class="member-stats">
                  Combat: ${member.combatLevel} | 
                  DPS: ${member.bestDps ? member.bestDps.toFixed(2) : 'N/A'} | 
                  Style: ${member.bestAttackStyle || 'Unknown'}
                </div>
              </div>
              <div class="readiness-bar-container">
                <div class="readiness-bar ${colorClass}" style="width: ${member.overallReadiness}%"></div>
              </div>
            </div>
          `;
        });
        
        readinessContent.innerHTML = readinessHtml;
      }
    }
    
    // Display strategy section
    const strategyContent = this.querySelector('.strategy-content');
    if (strategyContent) {
      strategyContent.innerHTML = strategy.strategy || 'No strategy recorded yet.';
    }
    
    // Display gear suggestions
    const gearContent = this.querySelector('.gear-suggestions-content');
    if (gearContent) {
      // Get recommended gear from the strategy or boss data
      const recommendedGear = strategy.gear || [];
      
      if (recommendedGear.length === 0) {
        gearContent.innerHTML = 'No gear suggestions available';
      } else {
        // Organize gear by type
        const gearByType = {
          'Melee': recommendedGear.filter(item => item.type === 'melee'),
          'Ranged': recommendedGear.filter(item => item.type === 'ranged'),
          'Magic': recommendedGear.filter(item => item.type === 'magic'),
          'General': recommendedGear.filter(item => !item.type || item.type === 'general')
        };
        
        let gearHtml = '';
        
        // Add each gear category
        Object.entries(gearByType).forEach(([category, items]) => {
          if (items.length === 0) return;
          
          gearHtml += `
            <div class="gear-category">
              <div class="gear-category-title">${category}</div>
              <div class="gear-items">
                ${items.map(item => `
                  <div class="gear-item">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
                    ${item.name}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        });
        
        // If we have player-specific recommendations, show those too
        const playerRecommendations = Object.values(this.groupReadiness)
          .flatMap(member => member.recommendedItems || []);
        
        if (playerRecommendations.length > 0) {
          gearHtml += `
            <div class="gear-category">
              <div class="gear-category-title">Missing Items</div>
              <div class="gear-items">
                ${playerRecommendations.map(item => `
                  <div class="gear-item" title="${item.reason || ''}">
                    ${item.name}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
        
        gearContent.innerHTML = gearHtml || 'No gear suggestions available';
      }
    }
    
    // Display kill tracker
    const killTrackerContent = this.querySelector('.kill-tracker-content');
    if (killTrackerContent) {
      // If we have individual kill counts, show them
      if (strategy.playerKills && Object.keys(strategy.playerKills).length > 0) {
        let tableHtml = `
          <table class="kill-tracker-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Kill Count</th>
                <th>Last Kill</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        Object.entries(strategy.playerKills).forEach(([player, kills]) => {
          tableHtml += `
            <tr>
              <td>${player}</td>
              <td>${kills.count || 0}</td>
              <td>${kills.lastKill ? new Date(kills.lastKill).toLocaleDateString() : 'Never'}</td>
            </tr>
          `;
        });
        
        tableHtml += `
            </tbody>
          </table>
        `;
        
        killTrackerContent.innerHTML = tableHtml;
      } else {
        killTrackerContent.innerHTML = `
          <div>Total Group KC: ${this.killCounts[bossName] || 0}</div>
          <div class="empty-state">No individual kill data available</div>
        `;
      }
    }
    
    // Show the boss content
    const bossContent = this.querySelector('.boss-content');
    if (bossContent) {
      bossContent.style.display = 'block';
    }
  }

  clearStrategyDisplay() {
    // Hide the boss content section
    const bossContent = this.querySelector('.boss-content');
    if (bossContent) {
      bossContent.style.display = 'none';
    }
    
    // Reset boss name and icon
    const bossNameElem = this.querySelector('.boss-name');
    if (bossNameElem) {
      bossNameElem.textContent = 'Select a boss';
    }
    
    const bossIcon = this.querySelector('.boss-icon');
    if (bossIcon) {
      bossIcon.style.backgroundImage = '';
    }
    
    // Reset kill count
    const kcValue = this.querySelector('.kc-value');
    if (kcValue) {
      kcValue.textContent = '0';
    }
    
    // Clear group readiness section
    const readinessContent = this.querySelector('.group-readiness-content');
    if (readinessContent) {
      readinessContent.innerHTML = '<div class="empty-state">Select a boss to view group readiness</div>';
    }
    
    // Clear strategy content
    const strategyContent = this.querySelector('.strategy-content');
    if (strategyContent) {
      strategyContent.innerHTML = '<div class="empty-state">Select a boss to view strategy</div>';
    }
    
    // Clear gear suggestions
    const gearContent = this.querySelector('.gear-suggestions-content');
    if (gearContent) {
      gearContent.innerHTML = '<div class="empty-state">Select a boss to view gear suggestions</div>';
    }
    
    // Clear kill tracker
    const killTrackerContent = this.querySelector('.kill-tracker-content');
    if (killTrackerContent) {
      killTrackerContent.innerHTML = '<div class="empty-state">Select a boss to view kill stats</div>';
    }
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-boss-strategy', BossStrategyPanel);

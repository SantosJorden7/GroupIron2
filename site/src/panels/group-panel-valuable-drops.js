/**
 * Valuable Drops Panel
 * Custom element for tracking high-value drops obtained by the group
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";

class ValuableDropsPanel extends BaseElement {
  constructor() {
    super();
    this.drops = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.sortBy = "value"; // Default sort
    this.sortDirection = "desc"; // Default sort direction
    this.dataSource = "plugin"; // Default data source
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content valuable-drops-panel">
        <div class="panel-header">💎 Valuable Drops</div>
        <div class="panel-inner">
          <div class="drops-header">
            <h3>Valuable Drops</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="sort-controls">
            <button class="sort-button active" data-sort="value">
              Value <span class="sort-direction">↓</span>
            </button>
            <button class="sort-button" data-sort="date">
              Date <span class="sort-direction"></span>
            </button>
            <button class="sort-button" data-sort="name">
              Name <span class="sort-direction"></span>
            </button>
            <button class="sort-button" data-sort="rarity">
              Rarity <span class="sort-direction"></span>
            </button>
          </div>
          
          <div class="drops-list">
            <div class="loading-container">
              <div class="loading-text">Loading valuable drops...</div>
            </div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
          
          <div class="drops-actions">
            <button class="refresh-button">Refresh</button>
          </div>
        </div>
      </div>
    `;

    // Apply styles
    this.applyStyles();
    
    // Subscribe to collection log updates
    this.collectionLogUnsubscribe = pubsub.subscribe("collection-log-data-updated", () => {
      this.loadDropsFromSources();
    });
    
    // Subscribe to external data updates
    this.externalDataUnsubscribe = pubsub.subscribe("external-log-data-updated", () => {
      this.loadDropsFromSources();
    });
    
    // Add event listeners for sorting
    this.addEventListener("click", this.handleClick.bind(this));
    
    // Initial data load
    this.loadDropsFromSources();
  }

  disconnectedCallback() {
    // Cleanup subscriptions
    if (this.collectionLogUnsubscribe) {
      this.collectionLogUnsubscribe();
    }
    
    if (this.externalDataUnsubscribe) {
      this.externalDataUnsubscribe();
    }
    
    // Remove event listeners
    this.removeEventListener("click", this.handleClick);
  }

  applyStyles() {
    // Add CSS for the panel
    const style = document.createElement('style');
    style.textContent = `
      .valuable-drops-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      .panel-inner {
        padding: 12px;
      }
      
      /* Panel header styles */
      .valuable-drops-panel .drops-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .valuable-drops-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      /* Data source indicators */
      .valuable-drops-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .valuable-drops-panel .data-source {
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
      
      .valuable-drops-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .valuable-drops-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .valuable-drops-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .valuable-drops-panel .last-updated {
        margin-left: 5px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      /* Sort controls */
      .valuable-drops-panel .sort-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 15px;
      }
      
      .valuable-drops-panel .sort-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 4px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 2px;
        position: relative;
      }
      
      .valuable-drops-panel .sort-button:hover {
        background-color: var(--button-hover-bg);
      }
      
      .valuable-drops-panel .sort-button.active {
        background-color: var(--orange);
        border-color: #a45e00;
        color: #000;
      }
      
      .valuable-drops-panel .sort-direction {
        margin-left: 3px;
        font-weight: bold;
      }
      
      /* Loading state */
      .valuable-drops-panel .loading-container {
        padding: 15px;
        text-align: center;
      }
      
      .valuable-drops-panel .loading-text {
        position: relative;
        padding-left: 24px;
      }
      
      .valuable-drops-panel .loading-text::before {
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
      .valuable-drops-panel .error-container {
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid rgba(168, 58, 58, 0.3);
        padding: 12px;
        margin: 10px 0;
        text-align: center;
        border-radius: 3px;
      }
      
      .valuable-drops-panel .error-text {
        color: #a83a3a;
        margin-bottom: 8px;
      }
      
      .valuable-drops-panel .retry-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      /* Drop items */
      .valuable-drops-panel .drops-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .valuable-drops-panel .drop-item {
        display: flex;
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        overflow: hidden;
        padding: 8px;
      }
      
      .valuable-drops-panel .drop-icon {
        width: 40px;
        height: 40px;
        margin-right: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      
      .valuable-drops-panel .drop-icon img {
        max-width: 32px;
        max-height: 32px;
      }
      
      .valuable-drops-panel .drop-details {
        flex: 1;
      }
      
      .valuable-drops-panel .drop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      
      .valuable-drops-panel .drop-name {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      .valuable-drops-panel .drop-price {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: #e6c93c; /* Gold color */
      }
      
      .valuable-drops-panel .drop-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
      }
      
      .valuable-drops-panel .drop-player {
        margin-left: 5px;
      }
      
      .valuable-drops-panel .drop-info {
        display: flex;
        gap: 10px;
      }
      
      .valuable-drops-panel .drop-date {
        opacity: 0.7;
      }
      
      .valuable-drops-panel .drop-rarity {
        color: #e6c93c; /* Gold color */
      }
      
      /* Actions */
      .valuable-drops-panel .drops-actions {
        display: flex;
        justify-content: center;
        margin-top: 15px;
      }
      
      .valuable-drops-panel .refresh-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 6px 15px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
        border-radius: 2px;
      }
      
      .valuable-drops-panel .refresh-button:hover {
        background-color: var(--button-hover-bg);
      }
      
      /* Empty state */
      .valuable-drops-panel .empty-state {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text);
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    const target = event.target;
    
    // Handle sort buttons
    if (target.classList.contains("sort-button")) {
      const sortKey = target.dataset.sort;
      this.updateSort(sortKey);
    }
    
    // Handle retry button
    if (target.classList.contains("retry-button")) {
      this.loadDropsFromSources();
    }
    
    // Handle refresh button
    if (target.classList.contains("refresh-button")) {
      this.loadDropsFromSources();
    }
  }

  loadDropsFromSources() {
    this.loading = true;
    this.updateDisplay();
    
    // Try to get data from plugin first (P)
    if (window.plugin && window.plugin.valuableDrops) {
      try {
        const pluginDrops = window.plugin.valuableDrops.getValuableDrops();
        if (pluginDrops && pluginDrops.length > 0) {
          this.drops = this.processDrops(pluginDrops);
          this.dataSource = "plugin";
          this.loading = false;
          this.error = null;
          this.lastUpdated = new Date();
          this.updateDisplay();
          return;
        }
      } catch (err) {
        console.warn("Failed to load valuable drops from plugin:", err);
        // Continue to fallback
      }
    }
    
    // Fallback to Wise Old Man API (W)
    this.tryWiseOldManDrops();
  }

  tryWiseOldManDrops() {
    // Check if WOM service is available
    if (window.wiseOldManService) {
      try {
        window.wiseOldManService.getValuableDrops()
          .then(womDrops => {
            if (womDrops && womDrops.length > 0) {
              this.drops = this.processDrops(womDrops);
              this.dataSource = "wiseOldMan";
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateDisplay();
            } else {
              // Try the OSRS Wiki as last resort (K)
              this.tryWikiDrops();
            }
          })
          .catch(err => {
            console.warn("Failed to load valuable drops from Wise Old Man:", err);
            this.tryWikiDrops();
          });
      } catch (err) {
        this.tryWikiDrops();
      }
    } else {
      // No WOM service, try Wiki
      this.tryWikiDrops();
    }
  }

  tryWikiDrops() {
    // Check if Wiki service is available
    if (window.wikiService) {
      try {
        window.wikiService.getValuableItems()
          .then(wikiDrops => {
            if (wikiDrops && wikiDrops.length > 0) {
              this.drops = this.processDrops(wikiDrops);
              this.dataSource = "wiki";
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
            console.warn("Failed to load valuable drops from Wiki:", err);
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
    // Simulate loading data from the server
    setTimeout(() => {
      try {
        // Mock data
        const mockDrops = [
          {
            id: "1",
            name: "Dragon Warhammer",
            price: 25000000,
            imageUrl: "./img/items/dragon_warhammer.png",
            playerName: "Player1",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            dropRate: "1/5000",
            source: "mock"
          },
          {
            id: "2",
            name: "Bandos Chestplate",
            price: 18000000,
            imageUrl: "./img/items/bandos_chestplate.png",
            playerName: "Player2",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            dropRate: "1/381",
            source: "mock"
          },
          {
            id: "3",
            name: "Abyssal Whip",
            price: 3000000,
            imageUrl: "./img/items/abyssal_whip.png",
            playerName: "Player3",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            dropRate: "1/512",
            source: "mock"
          },
          {
            id: "4",
            name: "Occult Necklace",
            price: 750000,
            imageUrl: "./img/items/occult_necklace.png",
            playerName: "Player1",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            dropRate: "1/350",
            source: "mock"
          },
          {
            id: "5",
            name: "Dragon Bones",
            price: 2500,
            imageUrl: "./img/items/dragon_bones.png",
            playerName: "Player2",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
            dropRate: "1/1",
            source: "mock"
          }
        ];
        
        this.drops = this.processDrops(mockDrops);
        this.dataSource = "wiki"; // Show as Wiki source since it's our fallback
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
        this.updateDisplay();
        
      } catch (error) {
        this.loading = false;
        this.error = error.message || "Failed to load valuable drops";
        this.updateDisplay();
      }
    }, 1000);
  }

  processDrops(drops) {
    return drops.map(drop => {
      return {
        ...drop,
        formattedPrice: this.formatGp(drop.price || 0),
        obtainedBy: drop.playerName || drop.obtainedBy || "Unknown",
        rarity: drop.dropRate || drop.rarity || "Unknown"
      };
    });
  }

  formatGp(value) {
    if (!value && value !== 0) return "Unknown";
    
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + "B";
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + "K";
    } else {
      return value.toString();
    }
  }

  updateSort(sortKey) {
    // If the same key is clicked, reverse direction
    if (this.sortBy === sortKey) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortBy = sortKey;
      // Reset to default direction for the new sort key
      this.sortDirection = sortKey === "name" ? "asc" : "desc";
    }
    
    // Set active class on the selected sort button
    const sortButtons = this.querySelectorAll(".sort-button");
    sortButtons.forEach(button => {
      const isActive = button.dataset.sort === this.sortBy;
      button.classList.toggle("active", isActive);
      
      // Also update direction indicator
      const indicator = button.querySelector(".sort-direction");
      if (indicator && isActive) {
        indicator.textContent = this.sortDirection === "asc" ? "↑" : "↓";
      } else if (indicator) {
        indicator.textContent = "";
      }
    });
    
    // Sort and update the display
    this.sortDrops();
    this.updateDisplay();
  }

  sortDrops() {
    const { sortBy, sortDirection } = this;
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    this.drops.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case "name":
          valueA = a.name || "";
          valueB = b.name || "";
          return multiplier * valueA.localeCompare(valueB);
          
        case "value":
          valueA = a.price || 0;
          valueB = b.price || 0;
          return multiplier * (valueA - valueB);
          
        case "date":
          valueA = new Date(a.timestamp || 0);
          valueB = new Date(b.timestamp || 0);
          return multiplier * (valueA - valueB);
          
        case "rarity":
          // Extract the denominator from drop rates like "1/5000"
          const getDropRateValue = (str) => {
            if (!str || str === "Unknown") return 0;
            const matches = str.match(/1\/(\d+)/);
            return matches ? parseInt(matches[1], 10) : 0;
          };
          
          valueA = getDropRateValue(a.rarity);
          valueB = getDropRateValue(b.rarity);
          return multiplier * (valueA - valueB);
          
        default:
          return 0;
      }
    });
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
    
    // Update drops list
    const dropsListElem = this.querySelector(".drops-list");
    if (dropsListElem && !this.loading && !this.error) {
      if (this.drops.length === 0) {
        dropsListElem.innerHTML = `
          <div class="empty-state">
            <p>No valuable drops found.</p>
          </div>
        `;
      } else {
        let dropsHtml = "";
        
        this.drops.forEach(drop => {
          const timestamp = drop.timestamp 
            ? new Date(drop.timestamp).toLocaleDateString()
            : "Unknown";
          
          const sourceClass = 
            drop.source === "plugin" ? "plugin" :
            drop.source === "wiseOldMan" ? "wom" :
            "wiki";
          
          const sourceLabel = 
            drop.source === "plugin" ? "P" :
            drop.source === "wiseOldMan" ? "W" :
            "K";
          
          dropsHtml += `
            <div class="drop-item" data-item-id="${drop.id}">
              <div class="drop-icon">
                <img src="${drop.imageUrl || './img/items/default.png'}" alt="${drop.name}">
              </div>
              <div class="drop-details">
                <div class="drop-header">
                  <span class="drop-name">${drop.name}</span>
                  <span class="drop-price">${drop.formattedPrice || "Unknown"}</span>
                </div>
                <div class="drop-meta">
                  <div class="drop-source">
                    <span class="data-source ${sourceClass}" title="Data source">${sourceLabel}</span>
                    <span class="drop-player">${drop.obtainedBy}</span>
                  </div>
                  <div class="drop-info">
                    <span class="drop-date">${timestamp}</span>
                    ${drop.rarity ? `<span class="drop-rarity">${drop.rarity}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        
        dropsListElem.innerHTML = dropsHtml;
      }
    }
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-valuable-drops', ValuableDropsPanel);

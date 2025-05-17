/**
 * Valuable Drops Panel
 * Custom element for tracking high-value drops obtained by the group
 * Extends BaseElement and follows the original codebase patterns
 */

import { BaseElement } from "../base-element/base-element";
import { pubsub } from "../data/pubsub";
import collectionLogService from "../features/collection-log/collection-log-service";

export class ValuableDropsPanel extends BaseElement {
  constructor() {
    super();
    this.drops = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.sortBy = "value"; // Default sort
    this.sortDirection = "desc"; // Default sort direction
  }

  html() {
    return `{{valuable-drops-panel.html}}`;
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Subscribe to collection log updates
    this.collectionLogUnsubscribe = pubsub.subscribe("collection-log-data-updated", () => {
      this.loadDropsFromCollectionLog();
    });
    
    // Subscribe to external data updates
    this.externalDataUnsubscribe = pubsub.subscribe("external-log-data-updated", () => {
      this.loadDropsFromCollectionLog();
    });
    
    // Subscribe to collection log enrichment
    this.enrichmentUnsubscribe = pubsub.subscribe("collection-log-enriched", () => {
      this.loadDropsFromCollectionLog();
    });
    
    // Add event listeners for sorting
    this.addEventListener("click", this.handleClick);
    
    // Initial data load
    this.loadDropsFromCollectionLog();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Cleanup subscriptions
    if (this.collectionLogUnsubscribe) {
      this.collectionLogUnsubscribe();
    }
    
    if (this.externalDataUnsubscribe) {
      this.externalDataUnsubscribe();
    }
    
    if (this.enrichmentUnsubscribe) {
      this.enrichmentUnsubscribe();
    }
    
    // Remove event listeners
    this.removeEventListener("click", this.handleClick);
  }

  handleClick = (event) => {
    const target = event.target;
    
    // Handle sort buttons
    if (target.classList.contains("sort-button")) {
      const sortKey = target.dataset.sort;
      this.updateSort(sortKey);
    }
    
    // Handle retry button
    if (target.classList.contains("retry-button")) {
      this.loadDropsFromCollectionLog();
    }
    
    // Handle refresh button
    if (target.classList.contains("refresh-button")) {
      this.loadDropsFromCollectionLog();
    }
  }

  async loadDropsFromCollectionLog() {
    this.loading = true;
    this.updateDisplay();
    
    try {
      // Get data from collection log service
      const logData = await collectionLogService.getMergedData();
      
      if (!logData || !logData.items) {
        throw new Error("No collection log data available");
      }
      
      // Filter for valuable items (based on wiki price or rarity)
      const valuableDrops = this.filterValuableItems(logData.items);
      
      // Update state
      this.drops = valuableDrops;
      this.loading = false;
      this.error = null;
      this.lastUpdated = new Date();
      
      // Update UI
      this.updateDisplay();
      
    } catch (error) {
      console.error("Error loading valuable drops:", error);
      this.loading = false;
      this.error = error.message || "Failed to load valuable drops";
      this.updateDisplay();
    }
  }

  filterValuableItems(items = []) {
    // Get items that are considered valuable
    // This is a simplified implementation - in reality you'd have more complex logic
    return items
      .filter(item => {
        // Include if:
        // 1. Item has wikiData with a valuable price (over 100k)
        const price = item.wikiData?.price || 0;
        
        // 2. Item is rare based on drop rate data
        const isRare = item.communityData?.dropRate?.includes("1/5000") ||
                      item.communityData?.dropRate?.includes("1/1000") ||
                      item.communityData?.dropRate?.includes("1/512");
        
        // 3. Item is unlocked (obtained) by someone in the group
        const isUnlocked = item.unlocked === true;
        
        return (price > 100000 || isRare) && isUnlocked;
      })
      .map(item => {
        // Add metadata for display
        return {
          ...item,
          formattedPrice: this.formatGp(item.wikiData?.price || 0),
          obtainedBy: item.playerName || "Unknown",
          timestamp: item.timestamp || new Date().toISOString(),
          source: item.source || "plugin",
          rarity: item.communityData?.dropRate || "Unknown"
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
          valueA = a.wikiData?.price || 0;
          valueB = b.wikiData?.price || 0;
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
    // Update data source and last updated
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

customElements.define("valuable-drops-panel", ValuableDropsPanel);

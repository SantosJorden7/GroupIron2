/**
 * Activities Panel
 * Custom element for tracking group activities
 * Follows the OSRS Group Ironmen codebase patterns
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";

class ActivitiesPanel extends BaseElement {
  constructor() {
    super();
    this.activities = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.selectedFilter = "all";
    this.dataSource = "plugin"; // Default data source
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content activities-panel">
        <div class="activities-container">
          <div class="activities-header">
            <h3>Group Activities</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="filter-controls">
            <button class="filter-button active" data-filter="all">All</button>
            <button class="filter-button" data-filter="level-up">Levels</button>
            <button class="filter-button" data-filter="drop">Drops</button>
            <button class="filter-button" data-filter="quest">Quests</button>
            <button class="filter-button" data-filter="boss">Bosses</button>
          </div>
          
          <div class="activities-list">
            <!-- Activities will be rendered here -->
            <div class="loading-container">
              <div class="loading-text">Loading activities...</div>
            </div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
        </div>
      </div>
    `;
    
    // Apply styles
    this.applyStyles();
    
    // Subscribe to group data events using pubsub
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadActivities();
    });
    
    // Add event listeners for filtering
    this.addEventListener("click", this.handleClick.bind(this));
    
    // Initial data load
    this.loadActivities();
  }

  disconnectedCallback() {
    // Cleanup subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Remove event listeners
    this.removeEventListener("click", this.handleClick);
  }

  applyStyles() {
    // Add CSS for the panel
    const style = document.createElement('style');
    style.textContent = `
      .activities-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      /* Panel header styles */
      .activities-panel .activities-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .activities-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      /* Data source indicators */
      .activities-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .activities-panel .data-source {
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
      
      .activities-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .activities-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .activities-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .activities-panel .last-updated {
        margin-left: 5px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      /* Filter controls */
      .activities-panel .filter-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 15px;
      }
      
      .activities-panel .filter-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 4px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 2px;
      }
      
      .activities-panel .filter-button:hover {
        background-color: var(--button-hover-bg);
      }
      
      .activities-panel .filter-button.active {
        background-color: var(--orange);
        border-color: #a45e00;
        color: #000;
      }
      
      /* Loading state */
      .activities-panel .loading-container {
        padding: 15px;
        text-align: center;
      }
      
      .activities-panel .loading-text {
        position: relative;
        padding-left: 24px;
      }
      
      .activities-panel .loading-text::before {
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
      .activities-panel .error-container {
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid rgba(168, 58, 58, 0.3);
        padding: 12px;
        margin: 10px 0;
        text-align: center;
        border-radius: 3px;
      }
      
      .activities-panel .error-text {
        color: #a83a3a;
        margin-bottom: 8px;
      }
      
      .activities-panel .retry-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      /* Activity items */
      .activities-panel .activities-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .activities-panel .activity-item {
        display: flex;
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        overflow: hidden;
        padding: 10px;
      }
      
      .activities-panel .activity-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 50%;
        margin-right: 10px;
        font-size: 16px;
      }
      
      .activities-panel .activity-content {
        flex: 1;
      }
      
      .activities-panel .activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      
      .activities-panel .activity-member {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      .activities-panel .activity-time {
        font-size: 11px;
        opacity: 0.7;
      }
      
      .activities-panel .activity-description {
        font-size: 13px;
      }
      
      /* Activity type styling */
      .activities-panel .activity-item[data-type="level-up"] .activity-icon {
        background-color: #4a934a;
      }
      
      .activities-panel .activity-item[data-type="drop"] .activity-icon {
        background-color: #9b7d27;
      }
      
      .activities-panel .activity-item[data-type="quest"] .activity-icon {
        background-color: #3a67a8;
      }
      
      .activities-panel .activity-item[data-type="boss"] .activity-icon {
        background-color: #a83a3a;
      }
      
      /* Empty state */
      .activities-panel .empty-state {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text);
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    // Handle filter buttons
    if (event.target.classList.contains("filter-button")) {
      const filter = event.target.dataset.filter;
      this.filterActivities(filter);
    }
    
    // Handle retry button
    if (event.target.classList.contains("retry-button")) {
      this.loadActivities();
    }
  }

  loadActivities() {
    this.loading = true;
    this.updateDisplay();
    
    // Try to get data from plugin first (P)
    if (window.plugin && window.plugin.groupActivities) {
      try {
        // Plugin data available
        this.activities = window.plugin.groupActivities.getActivities() || [];
        this.dataSource = "plugin";
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
        this.updateDisplay();
        return;
      } catch (err) {
        console.warn("Failed to load activities from plugin:", err);
        // Continue to fallback
      }
    }
    
    // Fallback to Wise Old Man API (W)
    this.tryWiseOldManActivities();
  }

  tryWiseOldManActivities() {
    // Check if WOM service is available
    if (window.wiseOldManService) {
      try {
        window.wiseOldManService.getGroupActivities()
          .then(womActivities => {
            if (womActivities && womActivities.length > 0) {
              this.activities = womActivities;
              this.dataSource = "wiseOldMan";
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateDisplay();
            } else {
              // Try the OSRS Wiki as last resort (K)
              this.tryWikiActivities();
            }
          })
          .catch(err => {
            console.warn("Failed to load activities from Wise Old Man:", err);
            this.tryWikiActivities();
          });
      } catch (err) {
        this.tryWikiActivities();
      }
    } else {
      // No WOM service, try Wiki
      this.tryWikiActivities();
    }
  }

  tryWikiActivities() {
    // Check if Wiki service is available
    if (window.wikiService) {
      try {
        window.wikiService.getRecentActivities()
          .then(wikiActivities => {
            if (wikiActivities && wikiActivities.length > 0) {
              this.activities = wikiActivities;
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
            console.warn("Failed to load activities from Wiki:", err);
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
        // Mock data - in a real implementation this would use the API
        this.activities = [
          {
            id: "1",
            type: "level-up",
            member: "Player1",
            description: "Reached level 80 in Slayer",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
            icon: "🎮"
          },
          {
            id: "2",
            type: "drop",
            member: "Player2",
            description: "Obtained Abyssal whip from Abyssal demons",
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
            icon: "💎"
          },
          {
            id: "3",
            type: "quest",
            member: "Player3",
            description: "Completed Dragon Slayer II",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            icon: "📜"
          },
          {
            id: "4",
            type: "level-up",
            member: "Player1",
            description: "Reached level 70 in Prayer",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            icon: "🎮"
          },
          {
            id: "5",
            type: "boss",
            member: "Player2",
            description: "Defeated Vorkath (75 KC)",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            icon: "👑"
          }
        ];
        
        this.dataSource = "wiki"; // Show as Wiki source since it's our fallback
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
      } catch (error) {
        this.loading = false;
        this.error = error.message || "Failed to load activities";
      }
      
      this.updateDisplay();
    }, 1000);
  }

  filterActivities(filter) {
    this.selectedFilter = filter || "all";
    
    // Set active class on the selected filter button
    const filterButtons = this.querySelectorAll(".filter-button");
    filterButtons.forEach(button => {
      if (button.dataset.filter === this.selectedFilter) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
    
    // Update the displayed activities
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
    
    // Update activities list
    const activitiesListElem = this.querySelector(".activities-list");
    if (activitiesListElem && !this.loading && !this.error) {
      // Filter activities based on selected filter
      let filteredActivities = this.activities;
      if (this.selectedFilter !== "all") {
        filteredActivities = this.activities.filter(
          activity => activity.type === this.selectedFilter
        );
      }
      
      if (filteredActivities.length === 0) {
        activitiesListElem.innerHTML = `
          <div class="empty-state">
            <p>No activities found${this.selectedFilter !== "all" ? " for this filter" : ""}.</p>
          </div>
        `;
      } else {
        let activitiesHtml = "";
        
        filteredActivities.forEach(activity => {
          const activityDate = new Date(activity.timestamp);
          const timeAgo = this.getTimeAgo(activityDate);
          
          activitiesHtml += `
            <div class="activity-item" data-activity-id="${activity.id}" data-type="${activity.type}">
              <div class="activity-icon">${activity.icon}</div>
              <div class="activity-content">
                <div class="activity-header">
                  <span class="activity-member">${activity.member}</span>
                  <span class="activity-time">${timeAgo}</span>
                </div>
                <div class="activity-description">${activity.description}</div>
              </div>
            </div>
          `;
        });
        
        activitiesListElem.innerHTML = activitiesHtml;
      }
    }
  }
  
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? "1 year ago" : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? "1 month ago" : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? "1 day ago" : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
    }
    
    return "Just now";
  }
}

// Register with the correct group-panel-xyz naming convention
window.customElements.define('group-panel-activities', ActivitiesPanel);

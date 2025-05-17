/**
 * Activities Panel
 * Custom element for tracking group activities
 * Follows the OSRS Group Ironmen codebase patterns
 */

import { BaseElement } from "../../base-element/base-element";
import { pubsub } from "../../data/pubsub";
import { api } from "../../data/api";
import "./activities-panel.css";

export class ActivitiesPanel extends BaseElement {
  constructor() {
    super();
    this.activities = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.selectedFilter = "all";
    this.dataSource = "plugin"; // Default data source
  }

  html() {
    return `
      <div class="panel-content activities-panel">
        <div class="activities-container">
          <div class="activities-header">
            <h3>Group Activities</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
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
  }

  connectedCallback() {
    super.connectedCallback();
    
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
    super.disconnectedCallback();
    
    // Cleanup subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Remove event listeners
    this.removeEventListener("click", this.handleClick);
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
    
    // Try to get data from plugin first
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
    
    // Fallback to Wise Old Man API
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
              // No data from WOM either, use mock data
              this.useMockData();
            }
          })
          .catch(err => {
            console.warn("Failed to load activities from Wise Old Man:", err);
            this.useMockData();
          });
      } catch (err) {
        this.useMockData();
      }
    } else {
      // No WOM service, use mock data
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
        
        this.dataSource = "mockData";
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
    
    if (pluginBadge) {
      pluginBadge.style.opacity = this.dataSource === "plugin" ? "1" : "0.3";
    }
    
    if (womBadge) {
      womBadge.style.opacity = this.dataSource === "wiseOldMan" ? "1" : "0.3";
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
customElements.define("group-panel-activities", ActivitiesPanel);

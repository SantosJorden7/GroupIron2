/**
 * Activities Panel
 * Custom element for tracking group activities
 * Follows the OSRS Group Ironmen codebase patterns
 */

import { BasePanel } from "../base-element/base-panel.js";
import { pubsub } from "../data/pubsub.js";
import { apiService } from "../data/api-service.js";
import { dataSourceManager, DataSources } from "../data/data-source-manager.js";
import { cacheManager } from "../data/cache-manager.js";
import * as ui from "../utils/ui-helpers.js";

class ActivitiesPanel extends BasePanel {
  constructor() {
    super();
    this.activities = [];
    this.selectedFilter = "all";
    
    // Initialize data source manager with available sources for this panel
    this.dataSourceManager.initialize([
      DataSources.PLUGIN, 
      DataSources.WOM, 
      DataSources.WIKI,
      DataSources.MOCK
    ]);
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content activities-panel">
        <div class="panel-header">🔔 Group Activities</div>
        <div class="panel-inner">
          <div class="panel-header-content">
            <h3>Group Activities</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="${DataSources.PLUGIN.title}">P</span>
              <span class="data-source wom" title="${DataSources.WOM.title}">W</span>
              <span class="data-source wiki" title="${DataSources.WIKI.title}">K</span>
              <span class="data-source mock" title="${DataSources.MOCK.title}">M</span>
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
            ${ui.createLoadingContainer("Loading activities...")}
          </div>
          
          ${ui.createErrorContainer()}
        </div>
      </div>
    `;
    
    // Apply base panel styles and custom styles
    this.applyBasePanelStyles();
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
    // Clean up event listeners and subscriptions
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
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
      
      .activities-panel .data-source.mock {
        background-color: #8c8c8c;
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
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .activities-panel .filter-button {
        font-size: 12px;
        padding: 6px 12px;
        background-color: var(--item-bg);
        border: 1px solid var(--border);
        color: var(--primary-text);
        border-radius: 4px;
        cursor: pointer;
      }
      
      .activities-panel .filter-button.active {
        background-color: var(--orange);
        color: black;
        font-weight: bold;
      }
      
      /* Activity list */
      .activities-panel .activities-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .activities-panel .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 8px;
        background-color: var(--item-bg);
        border: 1px solid var(--border);
        border-radius: 4px;
      }
      
      .activities-panel .activity-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        background-color: var(--item-highlight);
        border-radius: 4px;
        font-size: 16px;
      }
      
      .activities-panel .activity-content {
        flex: 1;
      }
      
      .activities-panel .activity-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      
      .activities-panel .activity-member {
        font-weight: bold;
        color: var(--orange);
      }
      
      .activities-panel .activity-time {
        font-size: 12px;
        color: var(--secondary-text);
      }
      
      .activities-panel .activity-description {
        font-size: 14px;
        color: var(--primary-text);
      }
      
      /* Empty state */
      .activities-panel .empty-state {
        padding: 16px;
        text-align: center;
        color: var(--secondary-text);
        background-color: var(--item-bg);
        border-radius: 4px;
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    // Handle filter button clicks
    if (event.target.closest('.filter-button')) {
      const filterButton = event.target.closest('.filter-button');
      const filter = filterButton.dataset.filter;
      
      this.filterActivities(filter);
    }
  }

  async loadActivities() {
    this.showLoading();
    
    try {
      // Try to load from plugin first (highest priority)
      const fromPlugin = await this.tryPluginActivities();
      if (fromPlugin) return;
      
      // Try Wise Old Man API next
      const fromWom = await this.tryWiseOldManActivities();
      if (fromWom) return;
      
      // Try Wiki data next
      const fromWiki = await this.tryWikiActivities();
      if (fromWiki) return;
      
      // Final fallback - use mock data
      const mockSuccess = await this.useMockData();
      if (!mockSuccess) {
        this.showError("Failed to load activities from any source");
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      this.showError('Failed to load activities: ' + error.message);
    }
  }
  
  async tryPluginActivities() {
    try {
      // Show loading state while fetching data
      this.showLoading("Loading activities from plugin data...");
      
      // Check if we can get data directly from the plugin via apiService
      if (!apiService || !apiService.getGroupData) return false;
      
      // Fetch the latest group data
      const groupName = pubsub.getState('currentGroup');
      if (!groupName) return false;
      
      console.log(`Fetching group data for ${groupName} from plugin...`);
      
      // Fetch both skill data and collection log in parallel
      const [skillData, collectionLog] = await Promise.all([
        apiService.getSkillData(groupName),
        apiService.getCollectionLog(groupName)
      ]);
      
      if (!skillData && !collectionLog) {
        console.warn("No data available from plugin");
        return false;
      }
      
      // Process activities from skill data
      const activities = [];
      
      // Process skill data (level ups, milestones, etc)
      if (skillData) {
        Object.entries(skillData).forEach(([memberName, memberSkills]) => {
          // Check for significant level milestones (multiples of 10 or 99)
          Object.entries(memberSkills).forEach(([skillName, skillInfo]) => {
            if (skillInfo.level && (skillInfo.level % 10 === 0 || skillInfo.level === 99)) {
              activities.push({
                id: `skill_${memberName}_${skillName}_${skillInfo.level}_${Date.now()}`,
                type: "level-up",
                member: memberName,
                timestamp: skillInfo.timestamp || new Date().toISOString(),
                description: `Reached level ${skillInfo.level} in ${skillName.charAt(0).toUpperCase() + skillName.slice(1)}`,
                icon: this.getSkillIcon(skillName),
                skillName: skillName,
                level: skillInfo.level
              });
            }
          });
        });
      }
      
      // Process collection log data (boss kills, valuable drops)
      if (collectionLog) {
        // Extract valuable drops (similar to valuable-drops panel)
        const valuableThreshold = 500000; // 500k gp minimum for activity feed
        
        Object.entries(collectionLog).forEach(([memberName, memberLogs]) => {
          memberLogs.forEach(logEntry => {
            // Add boss kills as activities
            if (logEntry.category && logEntry.category.toLowerCase().includes('boss')) {
              activities.push({
                id: `boss_${memberName}_${logEntry.category}_${Date.now()}`,
                type: "boss",
                member: memberName,
                timestamp: logEntry.timestamp || new Date().toISOString(),
                description: `Defeated ${logEntry.category}`,
                icon: "👹"
              });
            }
            
            // Add valuable drops as activities
            if (logEntry.items && Array.isArray(logEntry.items)) {
              logEntry.items.forEach(item => {
                if (item.value && item.value >= valuableThreshold) {
                  activities.push({
                    id: `drop_${memberName}_${item.id}_${Date.now()}`,
                    type: "drop",
                    member: memberName,
                    timestamp: item.timestamp || new Date().toISOString(),
                    description: `Received ${item.name} drop worth ${this.formatNumber(item.value)} gp`,
                    icon: "💰",
                    itemId: item.id,
                    value: item.value
                  });
                }
              });
            }
          });
        });
      }
      
      // Sort all activities by timestamp (newest first)
      this.activities = activities.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      this.setDataSource(DataSources.PLUGIN.id);
      this.hideLoading();
      this.updateDisplay();
      return true;
    } catch (error) {
      console.warn("Failed to load activities from plugin:", error);
      return false;
    }
  }

  async tryWiseOldManActivities() {
    try {
      this.showLoading("Loading activities from Wise Old Man...");
      
      const groupName = pubsub.getState('currentGroup');
      if (!groupName) return false;
      
      const groupId = await this.getWomGroupId(groupName);
      if (!groupId) return false;
      
      // Use the cached data if available
      const cachedActivities = cacheManager.getCachedData(`wom-activities-${groupId}`);
      if (cachedActivities) {
        console.log("Using cached WOM activities");
        this.activities = cachedActivities;
        this.setDataSource(DataSources.WOM.id);
        this.hideLoading();
        this.updateDisplay();
        return true;
      }
      
      // Fetch data from Wise Old Man API
      const endpoint = `https://api.wiseoldman.net/v2/groups/${groupId}/activities`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.warn(`Failed to fetch activities from WOM API: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        console.warn("Invalid data format from WOM API");
        return false;
      }
      
      // Process WOM activities into our format
      const activities = data.map(activity => {
        // Extract player name
        const memberName = activity.player.displayName;
        // Set activity type based on WOM activity type
        let type = "level-up"; // Default type
        
        if (activity.type.includes("boss")) {
          type = "boss";
        } else if (activity.type.includes("item")) {
          type = "drop";
        } else if (activity.type.includes("quest")) {
          type = "quest";
        }
        
        // Create activity object
        return {
          id: `wom_${activity.id}`,
          type: type,
          member: memberName,
          timestamp: activity.createdAt,
          description: activity.message,
          icon: this.getActivityIcon(activity.type)
        };
      });
      
      // Cache the results
      cacheManager.cacheData(`wom-activities-${groupId}`, activities, 15 * 60 * 1000); // 15 minutes
      
      // Update panel data
      this.activities = activities;
      this.setDataSource(DataSources.WOM.id);
      this.hideLoading();
      this.updateDisplay();
      
      return true;
    } catch (error) {
      console.warn("Failed to load activities from WOM:", error);
      return false;
    }
  }
  
  async getWomGroupId(groupName) {
    try {
      // Check cache first
      const cachedId = cacheManager.getCachedData(`wom-group-id-${groupName}`);
      if (cachedId) return cachedId;
      
      // Search for the group
      const response = await fetch(`https://api.wiseoldman.net/v2/groups?name=${encodeURIComponent(groupName)}`);
      if (!response.ok) return null;
      
      const groups = await response.json();
      
      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        console.warn(`No WOM group found with name: ${groupName}`);
        return null;
      }
      
      // Find exact match (case insensitive)
      const match = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
      if (!match) return null;
      
      // Cache the group id
      cacheManager.cacheData(`wom-group-id-${groupName}`, match.id, 24 * 60 * 60 * 1000); // 24 hours
      
      return match.id;
    } catch (error) {
      console.warn("Error getting WOM group ID:", error);
      return null;
    }
  }
  
  getActivityIcon(activityType) {
    // Map WOM activity types to icons
    if (activityType.includes("boss")) return "👹";
    if (activityType.includes("item")) return "💰";
    if (activityType.includes("quest")) return "📜";
    if (activityType.includes("level")) return "🎮";
    
    // Default icon
    return "🔔";
  }

  async tryWikiActivities() {
    try {
      this.showLoading("Looking up OSRS Wiki data...");
      
      // In a real implementation, this would fetch data from the OSRS Wiki API
      // For this example, we'll use cached data or return false
      
      const cachedActivities = cacheManager.getCachedData('wiki-activities');
      if (cachedActivities) {
        console.log("Using cached wiki activities");
        this.activities = cachedActivities;
        this.setDataSource(DataSources.WIKI.id);
        this.hideLoading();
        this.updateDisplay();
        return true;
      }
      
      // If we got here, we don't have cached data and can't get it from the wiki
      return false;
    } catch (error) {
      console.warn("Failed to load activities from Wiki:", error);
      return false;
    }
  }

  async useMockData() {
    try {
      this.showLoading("Loading sample activities...");
      
      // Get cached mock data or create new mock data
      const mockActivities = cacheManager.getCachedData('mock-activities') || (() => {
        const now = new Date();
        
        // Sample mock activities for demonstration purposes
        return [
          {
            id: "activity1",
            type: "level-up",
            member: "Player1",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            description: "Reached level 90 in Cooking",
            icon: "🍳"
          },
          {
            id: "activity2",
            type: "boss",
            member: "Player2",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            description: "Defeated Zulrah",
            icon: "👹"
          },
          {
            id: "activity3",
            type: "quest",
            member: "Player3",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            description: "Completed Dragon Slayer II",
            icon: "📜"
          },
          {
            id: "activity4",
            type: "drop",
            member: "Player1",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            description: "Received Abyssal whip drop from Abyssal demons",
            icon: "💰"
          },
          {
            id: "activity5",
            type: "level-up",
            member: "Player2",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
            description: "Reached level 80 in Construction",
            icon: "🏠"
          },
          {
            id: "activity6",
            type: "drop",
            member: "Player3",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
            description: "Received Twisted Bow drop from Chambers of Xeric",
            icon: "🏹"
          }
        ];
      })();
      
      // Cache the mock data
      cacheManager.cacheData('mock-activities', mockActivities, 24 * 60 * 60 * 1000); // 24 hours
      
      this.activities = mockActivities;
      this.setDataSource(DataSources.MOCK.id);
      this.hideLoading();
      this.updateDisplay();
      return true;
    } catch (error) {
      console.warn("Failed to create mock data:", error);
      this.showError("Failed to load activities. Please try again.");
      return false;
    }
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
    // Update data source indicators using base panel method
    this.updateDataSourceIndicators();
    
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
  
  // Helper to get appropriate icon for each skill
  getSkillIcon(skillName) {
    const skillIcons = {
      attack: "⚔️",
      strength: "💪",
      defense: "🛡️",
      hitpoints: "❤️",
      ranged: "🏹",
      prayer: "✝️",
      magic: "🧙",
      cooking: "🍳",
      woodcutting: "🪓",
      fletching: "🏹",
      fishing: "🎣",
      firemaking: "🔥",
      crafting: "✂️",
      smithing: "⚒️",
      mining: "⛏️",
      herblore: "🧪",
      agility: "🏃",
      thieving: "🦝",
      slayer: "👹",
      farming: "🌱",
      runecraft: "🧙‍♂️",
      hunter: "🏹",
      construction: "🏠"
    };
    
    return skillIcons[skillName.toLowerCase()] || "🎮";
  }
  
  // Helper to format numbers with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-activities', ActivitiesPanel);

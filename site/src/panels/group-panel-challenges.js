/**
 * Group Challenges Panel
 * Custom element for tracking group challenges and goals
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";

class ChallengesPanel extends BaseElement {
  constructor() {
    super();
    this.challenges = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.selectedFilter = "active";
    this.dataSource = "plugin"; // Default data source
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content challenges-panel">
        <div class="panel-header">🏆 Group Challenges</div>
        <div class="panel-inner">
          <div class="challenges-header">
            <h3>Group Challenges</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="filter-controls">
            <button class="filter-button active" data-filter="active">Active</button>
            <button class="filter-button" data-filter="completed">Completed</button>
            <button class="filter-button" data-filter="expired">Expired</button>
            <button class="filter-button" data-filter="all">All</button>
          </div>
          
          <div class="challenges-list">
            <div class="loading-container">
              <div class="loading-text">Loading challenges...</div>
            </div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
          
          <div class="challenges-actions">
            <button class="add-challenge-button">Add New Challenge</button>
          </div>
        </div>
      </div>
    `;

    // Apply styles
    this.applyStyles();
    
    // Subscribe to group data events
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadChallenges();
    });
    
    // Add event listeners
    this.addEventListener("click", this.handleClick.bind(this));
    
    // Initial data load
    this.loadChallenges();
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
      .challenges-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      .panel-inner {
        padding: 12px;
      }
      
      /* Panel header styles */
      .challenges-panel .challenges-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .challenges-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      /* Data source indicators */
      .challenges-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .challenges-panel .data-source {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-right: 4px;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        font-size: 12px;
        opacity: 0.5;
        transition: opacity 0.2s ease;
      }
      
      .challenges-panel .data-source.active {
        opacity: 1;
      }
      
      .challenges-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .challenges-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .challenges-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .challenges-panel .last-updated {
        margin-left: 8px;
        font-size: 10px;
        color: var(--primary-text);
        opacity: 0.7;
      }
      
      /* Filter controls */
      .challenges-panel .filter-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      
      .challenges-panel .filter-button {
        padding: 4px 12px;
        background-color: var(--background);
        border: 1px solid var(--border-color);
        color: var(--primary-text);
        font-family: rssmall, 'RuneScape Small', sans-serif;
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .challenges-panel .filter-button:hover {
        background-color: var(--background-light);
      }
      
      .challenges-panel .filter-button.active {
        background-color: var(--orange);
        color: white;
        border-color: var(--orange);
      }
      
      /* Challenges list */
      .challenges-panel .challenges-list {
        max-height: 500px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 2px;
        margin-bottom: 16px;
        background-color: var(--background-dark);
      }
      
      .challenges-panel .challenge-item {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s ease;
      }
      
      .challenges-panel .challenge-item:last-child {
        border-bottom: none;
      }
      
      .challenges-panel .challenge-item:hover {
        background-color: var(--background);
      }
      
      .challenges-panel .challenge-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .challenges-panel .challenge-title {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      .challenges-panel .challenge-status {
        padding: 2px 6px;
        border-radius: 2px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .challenges-panel .status-active {
        background-color: #4a934a;
        color: white;
      }
      
      .challenges-panel .status-completed {
        background-color: #3a67a8;
        color: white;
      }
      
      .challenges-panel .status-expired {
        background-color: #a83a3a;
        color: white;
      }
      
      .challenges-panel .challenge-content {
        margin-bottom: 8px;
      }
      
      .challenges-panel .challenge-description {
        margin-bottom: 8px;
      }
      
      .challenges-panel .challenge-meta {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--secondary-text);
        margin-bottom: 8px;
      }
      
      .challenges-panel .challenge-reward {
        font-style: italic;
        color: var(--secondary-text);
      }
      
      .challenges-panel .challenge-actions {
        margin-top: 8px;
      }
      
      .challenges-panel .complete-button {
        padding: 2px 8px;
        background-color: #4a934a;
        color: white;
        border: none;
        border-radius: 2px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .challenges-panel .complete-button:hover {
        background-color: #3b7a3b;
      }
      
      /* Loading state */
      .challenges-panel .loading-container {
        padding: 24px;
        text-align: center;
      }
      
      /* Error state */
      .challenges-panel .error-container {
        padding: 16px;
        text-align: center;
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        margin-bottom: 16px;
      }
      
      .challenges-panel .error-text {
        margin-bottom: 12px;
        color: #a83a3a;
      }
      
      .challenges-panel .retry-button {
        padding: 4px 12px;
        background-color: var(--background);
        border: 1px solid var(--border-color);
        color: var(--primary-text);
        font-family: rssmall, 'RuneScape Small', sans-serif;
        border-radius: 2px;
        cursor: pointer;
      }
      
      /* Actions */
      .challenges-panel .challenges-actions {
        display: flex;
        justify-content: flex-end;
      }
      
      .challenges-panel .add-challenge-button {
        padding: 6px 12px;
        background-color: var(--orange);
        color: white;
        border: none;
        border-radius: 2px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .challenges-panel .add-challenge-button:hover {
        background-color: var(--orange-hover);
      }
      
      /* Empty state */
      .challenges-panel .empty-state {
        padding: 24px;
        text-align: center;
        color: var(--secondary-text);
      }
    `;
    
    this.appendChild(style);
  }

  handleClick(event) {
    // Handle filter buttons
    if (event.target.classList.contains('filter-button')) {
      const filter = event.target.dataset.filter;
      this.filterChallenges(filter);
    }
    
    // Handle retry button
    if (event.target.classList.contains('retry-button')) {
      this.loadChallenges();
    }
    
    // Handle add challenge button
    if (event.target.classList.contains('add-challenge-button')) {
      this.showAddChallengeForm();
    }
    
    // Handle complete challenge button
    if (event.target.classList.contains('complete-button')) {
      const challengeId = event.target.dataset.challengeId;
      this.completeChallenge(challengeId);
    }
  }

  loadChallenges() {
    // Reset state
    this.loading = true;
    this.error = null;
    this.updateDisplay();
    
    // Check if plugin data is available
    if (window.groupData && window.groupData.challenges) {
      try {
        console.log("Loading challenges from plugin");
        this.challenges = window.groupData.challenges.map(challenge => ({
          ...challenge,
          status: this.getChallengeStatus(challenge)
        }));
        
        this.loading = false;
        this.error = null;
        this.dataSource = "plugin";
        this.lastUpdated = new Date();
        this.updateDisplay();
        this.updateDataSourceIndicators();
      } catch (err) {
        console.warn("Error processing plugin challenges:", err);
        // Try Wise Old Man API as fallback (W)
        this.tryWiseOldManChallenges();
      }
    } else {
      // No plugin data, try Wise Old Man API (W)
      console.log("No plugin data available, trying WOM");
      this.tryWiseOldManChallenges();
    }
  }

  tryWiseOldManChallenges() {
    // Attempt to fetch challenges from Wise Old Man API
    console.log("Attempting to fetch challenges from Wise Old Man API");
    
    // Check if WOM API is available
    if (window.wom && window.wom.api && typeof window.wom.api.getGroupChallenges === 'function') {
      try {
        // Get the group ID for WOM API
        const groupId = window.wom?.groupId || localStorage.getItem('womGroupId');
        
        if (!groupId) {
          console.log("No WOM group ID found, falling back to Wiki");
          this.dataSource = "wom-failed";
          this.tryWikiChallenges();
          return;
        }
        
        // Fetch challenges from WOM API
        window.wom.api.getGroupChallenges(groupId)
          .then(response => {
            if (response && response.data && Array.isArray(response.data)) {
              // Transform WOM data to our format
              this.challenges = response.data.map(womChallenge => ({
                id: womChallenge.id.toString(),
                title: womChallenge.name || womChallenge.title || 'Unnamed Challenge',
                description: womChallenge.description || '',
                createdBy: womChallenge.createdBy || 'Unknown',
                createdAt: womChallenge.createdAt || new Date().toISOString(),
                deadline: womChallenge.deadline || null,
                status: this.getChallengeStatus(womChallenge),
                completedBy: womChallenge.completedBy || null,
                completedAt: womChallenge.completedAt || null,
                reward: womChallenge.reward || null,
                metrics: womChallenge.metrics || null
              }));
              
              this.loading = false;
              this.error = null;
              this.dataSource = "wom";
              this.lastUpdated = new Date();
              this.updateDisplay();
              this.updateDataSourceIndicators();
            } else {
              throw new Error("Invalid response format from WOM API");
            }
          })
          .catch(error => {
            console.error("Error fetching challenges from WOM:", error);
            this.dataSource = "wom-failed";
            this.tryWikiChallenges();
          });
      } catch (error) {
        console.error("Error processing WOM challenges:", error);
        this.dataSource = "wom-failed";
        this.tryWikiChallenges();
      }
    } else {
      // WOM API not available, fall back to Wiki
      console.log("WOM API not available, falling back to Wiki");
      this.dataSource = "wom-failed";
      this.tryWikiChallenges();
    }
  }

  tryWikiChallenges() {
    // Check if Wiki service is available
    if (window.wikiService && typeof window.wikiService.getGroupChallenges === 'function') {
      try {
        console.log("Attempting to fetch challenges from Wiki service");
        window.wikiService.getGroupChallenges()
          .then(wikiChallenges => {
            if (wikiChallenges && Array.isArray(wikiChallenges) && wikiChallenges.length > 0) {
              // Transform Wiki data to our format if needed
              this.challenges = wikiChallenges.map(wikiChallenge => ({
                id: wikiChallenge.id || `wiki-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: wikiChallenge.title || wikiChallenge.name || 'Unnamed Challenge',
                description: wikiChallenge.description || '',
                createdBy: wikiChallenge.createdBy || 'Wiki',
                createdAt: wikiChallenge.createdAt || new Date().toISOString(),
                deadline: wikiChallenge.deadline || null,
                status: this.getChallengeStatus(wikiChallenge),
                completedBy: wikiChallenge.completedBy || null,
                completedAt: wikiChallenge.completedAt || null,
                reward: wikiChallenge.reward || null,
              }));
              
              this.dataSource = "wiki";
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateDisplay();
              this.updateDataSourceIndicators();
            } else {
              console.log("No valid challenge data from Wiki, using mock data");
              this.useMockData();
            }
          })
          .catch(err => {
            console.warn("Failed to load challenges from Wiki:", err);
            this.useMockData();
          });
      } catch (err) {
        console.warn("Error processing Wiki challenges:", err);
        this.useMockData();
      }
    } else {
      // No wiki service, use mock data
      console.log("Wiki service not available, using mock data");
      this.useMockData();
    }
  }

  useMockData() {
    // Simulate loading data from the server
    setTimeout(() => {
      try {
        // Mock data - in a real implementation this would use the API
        this.challenges = [
          {
            id: "1",
            title: "Fire Cape Race",
            description: "First group member to obtain a Fire Cape",
            createdBy: "Zezima",
            createdAt: "2025-04-01T12:00:00Z",
            deadline: "2025-06-01T12:00:00Z",
            status: "active",
            completedBy: null,
            completedAt: null,
            reward: "10M group fund contribution from each member"
          },
          {
            id: "2",
            title: "Barrows Gloves for All",
            description: "Every group member must complete Recipe for Disaster",
            createdBy: "Woox",
            createdAt: "2025-03-15T10:30:00Z",
            deadline: "2025-05-15T10:30:00Z",
            status: "active",
            completedBy: null,
            completedAt: null,
            reward: "New group logo"
          },
          {
            id: "3",
            title: "God Wars Dungeon Day",
            description: "Team up for a 6-hour GWD session, must get at least one signature drop",
            createdBy: "B0aty",
            createdAt: "2025-02-20T09:00:00Z",
            deadline: "2025-03-20T09:00:00Z",
            status: "completed",
            completedBy: "The Group",
            completedAt: "2025-03-18T14:23:00Z",
            reward: "Bandos chestplate to the tank"
          },
          {
            id: "4",
            title: "Wintertodt to 99 FM",
            description: "All members get 99 Firemaking through Wintertodt",
            createdBy: "Mod Ash",
            createdAt: "2025-01-05T08:00:00Z",
            deadline: "2025-02-05T08:00:00Z",
            status: "expired",
            completedBy: null,
            completedAt: null,
            reward: "No bank fees for a month"
          }
        ];
        
        this.loading = false;
        this.error = null;
        this.dataSource = "mock";
        this.lastUpdated = new Date();
        this.updateDisplay();
        this.updateDataSourceIndicators();
      } catch (err) {
        this.loading = false;
        this.error = "Failed to load mock data. Please try again.";
        this.updateDisplay();
      }
    }, 1000);
  }

  getChallengeStatus(challenge) {
    if (challenge.status) return challenge.status;
    
    if (challenge.completedAt) return "completed";
    
    if (challenge.deadline) {
      const deadlineDate = new Date(challenge.deadline);
      if (deadlineDate < new Date()) {
        return "expired";
      }
    }
    
    return "active";
  }

  filterChallenges(filter) {
    // Update selected filter
    this.selectedFilter = filter;
    
    // Update UI
    const filterButtons = this.querySelectorAll(".filter-button");
    filterButtons.forEach(button => {
      if (button.dataset.filter === filter) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
    
    // Update displayed challenges
    this.updateDisplay();
  }

  updateDisplay() {
    // Update loading state
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
    
    // Update challenges list
    const challengesListElem = this.querySelector(".challenges-list");
    if (challengesListElem && !this.loading && !this.error) {
      // Filter challenges based on selected filter
      let filteredChallenges = this.challenges;
      if (this.selectedFilter !== "all") {
        filteredChallenges = this.challenges.filter(
          challenge => challenge.status === this.selectedFilter
        );
      }
      
      if (filteredChallenges.length === 0) {
        challengesListElem.innerHTML = `
          <div class="empty-state">
            <p>No challenges found${this.selectedFilter !== "all" ? " for this filter" : ""}.</p>
          </div>
        `;
      } else {
        let challengesHtml = "";
        
        filteredChallenges.forEach(challenge => {
          const deadlineDate = challenge.deadline ? new Date(challenge.deadline) : null;
          const createdDate = new Date(challenge.createdAt);
          const completedDate = challenge.completedAt ? new Date(challenge.completedAt) : null;
          
          const deadlineStr = deadlineDate 
            ? deadlineDate < new Date() 
              ? `Expired: ${deadlineDate.toLocaleDateString()}`
              : `Deadline: ${deadlineDate.toLocaleDateString()}`
            : "No deadline";
          
          const statusBadgeClass = 
            challenge.status === "active" ? "status-active" :
            challenge.status === "completed" ? "status-completed" :
            "status-expired";
          
          challengesHtml += `
            <div class="challenge-item" data-challenge-id="${challenge.id}" data-status="${challenge.status}">
              <div class="challenge-header">
                <span class="challenge-title">${challenge.title}</span>
                <span class="challenge-status ${statusBadgeClass}">${challenge.status}</span>
              </div>
              <div class="challenge-content">
                <div class="challenge-description">${challenge.description}</div>
                <div class="challenge-meta">
                  <div class="challenge-creator">Created by: ${challenge.createdBy}</div>
                  <div class="challenge-dates">
                    <div>Created: ${createdDate.toLocaleDateString()}</div>
                    <div>${deadlineStr}</div>
                    ${completedDate ? `<div>Completed: ${completedDate.toLocaleDateString()}</div>` : ''}
                  </div>
                </div>
                ${challenge.reward ? `<div class="challenge-reward">Reward: ${challenge.reward}</div>` : ''}
              </div>
              ${challenge.status === "active" ? `
                <div class="challenge-actions">
                  <button class="complete-button" data-challenge-id="${challenge.id}">Complete</button>
                </div>
              ` : ''}
            </div>
          `;
        });
        
        challengesListElem.innerHTML = challengesHtml;
      }
    }
  }

  updateDataSourceIndicators() {
    // Get all data source indicators
    const pluginIndicator = this.querySelector('.data-source.plugin');
    const womIndicator = this.querySelector('.data-source.wom');
    const wikiIndicator = this.querySelector('.data-source.wiki');
    
    if (pluginIndicator && womIndicator && wikiIndicator) {
      // Reset all indicators to inactive state
      pluginIndicator.classList.remove('active');
      womIndicator.classList.remove('active');
      wikiIndicator.classList.remove('active');
      
      // Mark the active data source
      switch (this.dataSource) {
        case 'plugin':
          pluginIndicator.classList.add('active');
          break;
        case 'wom':
          womIndicator.classList.add('active');
          break;
        case 'wiki':
          wikiIndicator.classList.add('active');
          break;
      }
    }
    
    // Update last updated text
    const lastUpdatedElem = this.querySelector('.last-updated');
    if (lastUpdatedElem && this.lastUpdated) {
      lastUpdatedElem.textContent = `Last updated: ${this.lastUpdated.toLocaleTimeString()}`;
    }
  }

  showAddChallengeForm() {
    alert("Add challenge functionality would be implemented here");
    // In a real implementation, this would show a modal form for adding a new challenge
  }

  completeChallenge(challengeId) {
    const challengeIndex = this.challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex !== -1) {
      this.challenges[challengeIndex].status = "completed";
      this.challenges[challengeIndex].completedBy = "Current player"; // Would use actual player name
      this.challenges[challengeIndex].completedAt = new Date().toISOString();
      this.updateDisplay();
      
      // In a real implementation, this would also sync the data back to the server
      console.log(`Challenge ${challengeId} marked as completed`);
    }
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-challenges', ChallengesPanel);

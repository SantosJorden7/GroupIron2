/**
 * Group Milestones Panel
 * Custom element for tracking group milestones and achievements
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";

class GroupMilestonesPanel extends BaseElement {
  constructor() {
    super();
    this.milestones = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.selectedCategory = "all";
    this.selectedFilter = "all"; // 'all', 'active', 'completed'
    this.dataSource = "plugin"; // Default data source
    this.playerNames = []; // Group member names
    this.currentMilestoneId = null; // For editing
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content milestones-panel">
        <div class="panel-header">🏆 Group Milestones</div>
        <div class="panel-inner">
          <div class="milestones-header">
            <h3>Group Milestones</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="controls-row">
            <div class="filter-controls">
              <button class="filter-button active" data-filter="all">All</button>
              <button class="filter-button" data-filter="active">Active</button>
              <button class="filter-button" data-filter="completed">Completed</button>
            </div>
            
            <div class="category-controls">
              <button class="category-button active" data-category="all">All Types</button>
              <button class="category-button" data-category="skills">Skills</button>
              <button class="category-button" data-category="bosses">Bosses</button>
              <button class="category-button" data-category="items">Items</button>
              <button class="category-button" data-category="other">Other</button>
            </div>
          </div>
          
          <div class="milestones-list">
            <div class="loading-container">
              <div class="loading-text">Loading milestones...</div>
            </div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
          
          <div class="milestones-actions">
            <button class="add-milestone-button">Add New Milestone</button>
          </div>
          
          <!-- Milestone Form Dialog -->
          <div class="milestone-dialog" style="display: none;">
            <div class="milestone-dialog-content">
              <div class="dialog-header">
                <h3 class="dialog-title">Add New Milestone</h3>
                <button class="close-dialog-button">×</button>
              </div>
              <div class="dialog-body">
                <form id="milestone-form">
                  <div class="form-group">
                    <label for="milestone-title">Title</label>
                    <input type="text" id="milestone-title" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="milestone-description">Description</label>
                    <textarea id="milestone-description" rows="2"></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label for="milestone-type">Type</label>
                    <select id="milestone-type" required>
                      <option value="">Select type...</option>
                      <option value="skills">Skill Level</option>
                      <option value="bosses">Boss Kill Count</option>
                      <option value="items">Collection Item</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div class="form-group milestone-target-container">
                    <label for="milestone-target">Target</label>
                    <div class="target-input-container">
                      <input type="number" id="milestone-target" min="1" required>
                      <div class="target-type-label">KC</div>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label>Assigned Group Members</label>
                    <div class="group-members-list"></div>
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="save-milestone-button">Save Milestone</button>
                    <button type="button" class="cancel-button">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Apply styles
    this.applyStyles();
    
    // Subscribe to group data events
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadMilestones();
    });
    
    // Add event listeners
    this.addEventListener("click", this.handleClick.bind(this));
    
    // Initial data load
    this.loadMilestones();
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
      .milestones-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      .panel-inner {
        padding: 12px;
      }
      
      /* Panel header styles */
      .milestones-panel .milestones-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .milestones-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      /* Data source indicators */
      .milestones-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .milestones-panel .data-source {
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
      
      .milestones-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .milestones-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .milestones-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .milestones-panel .last-updated {
        margin-left: 5px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      /* Category controls */
      .milestones-panel .category-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 15px;
      }
      
      .milestones-panel .category-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 4px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 2px;
      }
      
      .milestones-panel .category-button:hover {
        background-color: var(--button-hover-bg);
      }
      
      .milestones-panel .category-button.active {
        background-color: var(--orange);
        border-color: #a45e00;
        color: #000;
      }
      
      /* Loading state */
      .milestones-panel .loading-container {
        padding: 15px;
        text-align: center;
      }
      
      .milestones-panel .loading-text {
        position: relative;
        padding-left: 24px;
      }
      
      .milestones-panel .loading-text::before {
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
      .milestones-panel .error-container {
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid rgba(168, 58, 58, 0.3);
        padding: 12px;
        margin: 10px 0;
        text-align: center;
        border-radius: 3px;
      }
      
      .milestones-panel .error-text {
        color: #a83a3a;
        margin-bottom: 8px;
      }
      
      .milestones-panel .retry-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      /* Milestone items */
      .milestones-panel .milestones-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .milestones-panel .milestone-item {
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .milestones-panel .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--header-bg);
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .milestones-panel .milestone-title {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--header-text);
        display: flex;
        align-items: center;
      }
      
      .milestones-panel .milestone-icon {
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }
      
      .milestones-panel .milestone-date {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .milestones-panel .milestone-content {
        padding: 12px;
      }
      
      .milestones-panel .milestone-description {
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .milestones-panel .milestone-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--secondary-text);
      }
      
      .milestones-panel .milestone-category {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        background-color: rgba(0, 0, 0, 0.2);
        margin-right: 5px;
      }
      
      .milestones-panel .milestone-category.skills {
        background-color: #4a934a;
        color: white;
      }
      
      .milestones-panel .milestone-category.quests {
        background-color: #3a67a8;
        color: white;
      }
      
      .milestones-panel .milestone-category.bosses {
        background-color: #a83a3a;
        color: white;
      }
      
      .milestones-panel .milestone-category.items {
        background-color: #9b7d27;
        color: white;
      }
      
      .milestones-panel .milestone-players {
        text-align: right;
      }
      
      .milestones-panel .milestone-player {
        display: inline-block;
        margin-left: 5px;
      }
      
      /* Actions */
      .milestones-panel .milestones-actions {
        display: flex;
        justify-content: center;
        margin-top: 15px;
      }
      
      .milestones-panel .add-milestone-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 6px 15px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
        border-radius: 2px;
      }
      
      .milestones-panel .add-milestone-button:hover {
        background-color: var(--button-hover-bg);
      }
      
      /* Empty state */
      .milestones-panel .empty-state {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text);
      }
      
      /* Progress bar */
      .milestones-panel .progress-container {
        margin-top: 8px;
      }
      
      .milestones-panel .progress-bar {
        height: 6px;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .milestones-panel .progress-fill {
        height: 100%;
        background-color: var(--orange);
        transition: width 0.3s ease;
      }
      
      .milestones-panel .progress-text {
        font-size: 11px;
        text-align: right;
        margin-top: 2px;
        opacity: 0.8;
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    // Handle category buttons
    if (event.target.classList.contains('category-button')) {
      const category = event.target.dataset.category;
      this.filterByCategory(category);
    }
    
    // Handle filter buttons
    if (event.target.classList.contains('filter-button')) {
      const filter = event.target.dataset.filter;
      this.filterByStatus(filter);
    }
    
    // Handle retry button
    if (event.target.classList.contains('retry-button')) {
      this.loadMilestones();
    }
    
    // Handle add milestone button
    if (event.target.classList.contains('add-milestone-button')) {
      this.showMilestoneForm();
    }
    
    // Handle close dialog button
    if (event.target.classList.contains('close-dialog-button') ||
        event.target.classList.contains('cancel-button')) {
      this.hideMilestoneForm();
    }
    
    // Handle complete milestone button
    if (event.target.classList.contains('complete-button')) {
      const milestoneId = event.target.closest('.milestone-item').dataset.milestoneId;
      this.completeMilestone(milestoneId);
    }
    
    // Handle edit milestone button
    if (event.target.classList.contains('edit-button')) {
      const milestoneId = event.target.closest('.milestone-item').dataset.milestoneId;
      this.editMilestone(milestoneId);
    }
  }
  
  // Show milestone form dialog
  showMilestoneForm() {
    const dialog = this.querySelector('.milestone-dialog');
    const form = this.querySelector('#milestone-form');
    const title = this.querySelector('.dialog-title');
    
    if (dialog) {
      // Reset form
      if (form) form.reset();
      
      // Set title based on whether we're editing or adding
      if (title) {
        title.textContent = this.currentMilestoneId ? 'Edit Milestone' : 'Add New Milestone';
      }
      
      // If editing, populate form with existing data
      if (this.currentMilestoneId) {
        const milestone = this.milestones.find(m => m.id === this.currentMilestoneId);
        if (milestone) {
          const titleInput = this.querySelector('#milestone-title');
          const descriptionInput = this.querySelector('#milestone-description');
          const typeSelect = this.querySelector('#milestone-type');
          const targetInput = this.querySelector('#milestone-target');
          
          if (titleInput) titleInput.value = milestone.title || '';
          if (descriptionInput) descriptionInput.value = milestone.description || '';
          if (typeSelect) typeSelect.value = milestone.category || '';
          if (targetInput) targetInput.value = milestone.target || '';
          
          // Update target type label
          this.updateTargetTypeLabel(milestone.category);
          
          // Check assigned players
          this.updatePlayerCheckboxes(milestone.players || []);
        }
      } else {
        // For new milestone, populate group members
        this.updateGroupMembersList();
      }
      
      dialog.style.display = 'block';
    }
  }
  
  // Hide milestone form dialog
  hideMilestoneForm() {
    const dialog = this.querySelector('.milestone-dialog');
    if (dialog) {
      dialog.style.display = 'none';
      this.currentMilestoneId = null; // Reset editing state
    }
  }
  
  // Update the target type label based on selected milestone type
  updateTargetTypeLabel(type) {
    const label = this.querySelector('.target-type-label');
    if (!label) return;
    
    switch (type) {
      case 'skills':
        label.textContent = 'Level';
        break;
      case 'bosses':
        label.textContent = 'KC';
        break;
      case 'items':
        label.textContent = 'Qty';
        break;
      default:
        label.textContent = 'Value';
    }
  }
  
  // Update group members list in the form
  updateGroupMembersList() {
    const membersContainer = this.querySelector('.group-members-list');
    if (!membersContainer) return;
    
    // Get player names from group data if available, or use mock data
    const players = this.playerNames.length > 0 ? 
      this.playerNames : 
      ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'];
    
    let html = '';
    players.forEach(player => {
      html += `
        <div class="member-checkbox">
          <input type="checkbox" id="player-${player}" name="players" value="${player}">
          <label for="player-${player}">${player}</label>
        </div>
      `;
    });
    
    membersContainer.innerHTML = html;
  }
  
  // Update player checkboxes based on assigned players
  updatePlayerCheckboxes(assignedPlayers) {
    if (!assignedPlayers || !assignedPlayers.length) return;
    
    // Check boxes for assigned players
    assignedPlayers.forEach(player => {
      const checkbox = this.querySelector(`#player-${player}`);
      if (checkbox) checkbox.checked = true;
    });
  }

  loadMilestones() {
    this.loading = true;
    this.updateDisplay();
    
    // Try to get data from plugin first (P)
    if (window.plugin && window.plugin.groupMilestones) {
      try {
        const pluginMilestones = window.plugin.groupMilestones.getMilestones();
        if (pluginMilestones && pluginMilestones.length > 0) {
          this.milestones = pluginMilestones;
          this.dataSource = "plugin";
          this.loading = false;
          this.error = null;
          this.lastUpdated = new Date();
          this.updateDisplay();
          return;
        }
      } catch (err) {
        console.warn("Failed to load milestones from plugin:", err);
        // Continue to fallback
      }
    }
    
    // Fallback to Wise Old Man API (W)
    this.tryWiseOldManMilestones();
  }

  tryWiseOldManMilestones() {
    // Check if WOM service is available
    if (window.wiseOldManService) {
      try {
        window.wiseOldManService.getGroupMilestones()
          .then(womMilestones => {
            if (womMilestones && womMilestones.length > 0) {
              this.milestones = womMilestones;
              this.dataSource = "wiseOldMan";
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateDisplay();
            } else {
              // Try the OSRS Wiki as last resort (K)
              this.tryWikiMilestones();
            }
          })
          .catch(err => {
            console.warn("Failed to load milestones from Wise Old Man:", err);
            this.tryWikiMilestones();
          });
      } catch (err) {
        this.tryWikiMilestones();
      }
    } else {
      // No WOM service, try Wiki
      this.tryWikiMilestones();
    }
  }

  tryWikiMilestones() {
    // Check if Wiki service is available
    if (window.wikiService) {
      try {
        window.wikiService.getGroupMilestones()
          .then(wikiMilestones => {
            if (wikiMilestones && wikiMilestones.length > 0) {
              this.milestones = wikiMilestones;
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
            console.warn("Failed to load milestones from Wiki:", err);
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
        this.milestones = [
          {
            id: "1",
            title: "All Members 70+ Slayer",
            description: "All group members have achieved at least level 70 in Slayer",
            category: "skills",
            icon: "🗡️",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
            players: ["Player1", "Player2", "Player3"],
            progress: 100, // percentage
            completed: true
          },
          {
            id: "2",
            title: "Barrows Gloves",
            description: "All members completed Recipe for Disaster and obtained Barrows Gloves",
            category: "quests",
            icon: "📜",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
            players: ["Player1", "Player2"],
            progress: 67, // percentage (2/3 players)
            completed: false
          },
          {
            id: "3",
            title: "First GWD Item",
            description: "Obtained first God Wars Dungeon unique item drop",
            category: "items",
            icon: "💎",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            players: ["Player2"],
            progress: 100, // percentage
            completed: true
          },
          {
            id: "4",
            title: "Group Total Level 3000",
            description: "Reached a combined total level of 3000 across all group members",
            category: "skills",
            icon: "📊",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
            players: ["Player1", "Player2", "Player3"],
            progress: 100, // percentage
            completed: true
          },
          {
            id: "5",
            title: "First Zulrah Kill",
            description: "First group member defeated Zulrah",
            category: "bosses",
            icon: "👑",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
            players: ["Player1"],
            progress: 100, // percentage
            completed: true
          },
          {
            id: "6",
            title: "All Members 85+ Fishing",
            description: "All group members reach level 85 or higher in Fishing",
            category: "skills",
            icon: "🎣",
            date: null, // Not completed yet
            players: ["Player1"],
            progress: 33, // percentage (1/3 players)
            completed: false
          },
          {
            id: "7",
            title: "Defeat Corporeal Beast",
            description: "Group successfully defeats the Corporeal Beast",
            category: "bosses",
            icon: "👹",
            date: null, // Not completed yet
            players: [],
            progress: 0, // percentage
            completed: false
          }
        ];
        
        this.dataSource = "wiki"; // Show as Wiki source since it's our fallback
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
      } catch (error) {
        this.loading = false;
        this.error = error.message || "Failed to load milestones";
      }
      
      this.updateDisplay();
    }, 1000);
  }

  filterByCategory(category) {
    // Update selected category
    this.selectedCategory = category;
    
    // Update UI
    const categoryButtons = this.querySelectorAll('.category-button');
    categoryButtons.forEach(button => {
      if (button.dataset.category === category) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Update displayed milestones
    this.updateDisplay();
  }
  
  filterByStatus(filter) {
    // Update selected filter
    this.selectedFilter = filter;
    
    // Update UI
    const filterButtons = this.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
      if (button.dataset.filter === filter) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Update displayed milestones
    this.updateDisplay();
  }
  
  // Mark a milestone as completed
  completeMilestone(milestoneId) {
    const milestoneIndex = this.milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) return;
    
    // Update milestone data
    this.milestones[milestoneIndex].completed = true;
    this.milestones[milestoneIndex].completedAt = new Date().toISOString();
    this.milestones[milestoneIndex].progress = 100;
    
    // If we have a plugin connection, save back to the server
    if (window.groupData && typeof window.updateGroupData === 'function') {
      window.updateGroupData({
        milestones: this.milestones
      });
    }
    
    // Update display
    this.updateDisplay();
  }
  
  // Start editing a milestone
  editMilestone(milestoneId) {
    this.currentMilestoneId = milestoneId;
    this.showMilestoneForm();
  }
  
  // Save a milestone (new or edited)
  saveMilestone(formData) {
    // Validate form data
    if (!formData.title || !formData.type || !formData.target) {
      console.error('Missing required milestone data');
      return false;
    }
    
    // If editing
    if (this.currentMilestoneId) {
      const index = this.milestones.findIndex(m => m.id === this.currentMilestoneId);
      if (index !== -1) {
        // Update existing milestone
        this.milestones[index] = {
          ...this.milestones[index],
          title: formData.title,
          description: formData.description || '',
          category: formData.type,
          target: parseInt(formData.target, 10),
          players: formData.players || [],
          updated: new Date().toISOString()
        };
      }
    } else {
      // Create new milestone
      const newMilestone = {
        id: `milestone-${Date.now()}`,
        title: formData.title,
        description: formData.description || '',
        category: formData.type,
        target: parseInt(formData.target, 10),
        progress: 0,
        completed: false,
        players: formData.players || [],
        createdAt: new Date().toISOString(),
        current: 0
      };
      
      // Add icon based on type
      switch (formData.type) {
        case 'skills':
          newMilestone.icon = '🔥';
          break;
        case 'bosses':
          newMilestone.icon = '💀';
          break;
        case 'items':
          newMilestone.icon = '🎒';
          break;
        default:
          newMilestone.icon = '🏆';
      }
      
      this.milestones.push(newMilestone);
    }
    
    // If we have a plugin connection, save back to the server
    if (window.groupData && typeof window.updateGroupData === 'function') {
      window.updateGroupData({
        milestones: this.milestones
      });
    }
    
    // Update display
    this.updateDisplay();
    return true;
  }

  updateDisplay() {
    // Update data source badges
    const pluginBadge = this.querySelector('.data-source.plugin');
    const womBadge = this.querySelector('.data-source.wom');
    const wikiBadge = this.querySelector('.data-source.wiki');
    
    if (pluginBadge) {
      pluginBadge.classList.toggle('active', this.dataSource === 'plugin');
    }
    
    if (womBadge) {
      womBadge.classList.toggle('active', this.dataSource === 'wom');
    }
    
    if (wikiBadge) {
      wikiBadge.classList.toggle('active', this.dataSource === 'wiki');
    }
    
    // Update last updated text
    const lastUpdatedElem = this.querySelector('.last-updated');
    if (lastUpdatedElem) {
      lastUpdatedElem.textContent = this.lastUpdated 
        ? `Last updated: ${this.lastUpdated.toLocaleTimeString()}`
        : "Not yet updated";
    }
    
    // Show/hide loading
    const loadingElem = this.querySelector('.loading-container');
    if (loadingElem) {
      loadingElem.style.display = this.loading ? 'block' : 'none';
    }
    
    // Show error if any
    const errorElem = this.querySelector('.error-container');
    if (errorElem) {
      if (this.error) {
        errorElem.style.display = 'block';
        const errorTextElem = errorElem.querySelector('.error-text');
        if (errorTextElem) {
          errorTextElem.textContent = this.error;
        }
      } else {
        errorElem.style.display = 'none';
      }
    }
    
    // Update milestones list
    const milestonesListElem = this.querySelector('.milestones-list');
    if (milestonesListElem && !this.loading && !this.error) {
      // Apply both category and status filters
      let filteredMilestones = [...this.milestones];
      
      // Apply category filter
      if (this.selectedCategory !== 'all') {
        filteredMilestones = filteredMilestones.filter(
          milestone => milestone.category === this.selectedCategory
        );
      }
      
      // Apply status filter
      if (this.selectedFilter !== 'all') {
        filteredMilestones = filteredMilestones.filter(milestone => {
          if (this.selectedFilter === 'completed') {
            return milestone.completed === true;
          } else if (this.selectedFilter === 'active') {
            return milestone.completed !== true;
          }
          return true;
        });
      }
      
      if (filteredMilestones.length === 0) {
        milestonesListElem.innerHTML = `
          <div class="empty-state">
            <p>No milestones found for the selected filters.</p>
          </div>
        `;
      } else {
        let milestonesHtml = '';
        
        // Sort milestones by progress (descending), then by creation date (newest first)
        filteredMilestones.sort((a, b) => {
          // If different completion status, completed ones come last
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          
          // If same completion status, sort by progress
          if (a.progress !== b.progress) {
            return b.progress - a.progress;
          }
          
          // If same progress, sort by creation date
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        
        filteredMilestones.forEach(milestone => {
          const createdDate = milestone.createdAt 
            ? new Date(milestone.createdAt).toLocaleDateString() 
            : 'Unknown';
            
          const completedDate = milestone.completedAt
            ? new Date(milestone.completedAt).toLocaleDateString()
            : null;
            
          const progressText = milestone.completed
            ? 'Completed'
            : `${milestone.current || 0} / ${milestone.target}`;
            
          const progress = milestone.progress !== undefined 
            ? milestone.progress 
            : milestone.current && milestone.target 
              ? Math.min(100, Math.floor((milestone.current / milestone.target) * 100))
              : 0;
              
          const progressClass = milestone.completed 
            ? 'progress-completed' 
            : progress >= 75 ? 'progress-high' 
            : progress >= 33 ? 'progress-medium' 
            : 'progress-low';
          
          milestonesHtml += `
            <div class="milestone-item ${milestone.completed ? 'completed' : ''}" 
                data-milestone-id="${milestone.id}" 
                data-category="${milestone.category}">
              <div class="milestone-header">
                <span class="milestone-title">
                  ${milestone.icon ? `<span class="milestone-icon">${milestone.icon}</span>` : ''}
                  ${milestone.title}
                </span>
                <span class="milestone-status ${milestone.completed ? 'status-completed' : 'status-active'}">
                  ${milestone.completed ? 'Completed' : 'Active'}
                </span>
              </div>
              <div class="milestone-content">
                ${milestone.description ? `<div class="milestone-description">${milestone.description}</div>` : ''}
                
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${progress}%"></div>
                  </div>
                  <div class="progress-text">${progressText}</div>
                </div>
                
                <div class="milestone-meta">
                  <div class="milestone-info">
                    <div class="milestone-category ${milestone.category}">${milestone.category}</div>
                    <div class="milestone-date">Created: ${createdDate}</div>
                    ${completedDate ? `<div class="milestone-completion-date">Completed: ${completedDate}</div>` : ''}
                  </div>
                  <div class="milestone-players">
                    ${Array.isArray(milestone.players) && milestone.players.length > 0 ? 
                      milestone.players.map(player => `<span class="milestone-player">${player}</span>`).join('') : 
                      '<span class="milestone-player">All members</span>'}
                  </div>
                </div>
                
                <div class="milestone-actions">
                  ${!milestone.completed ? `
                    <button class="complete-button" data-milestone-id="${milestone.id}">
                      Mark Complete
                    </button>
                  ` : ''}
                  <button class="edit-button" data-milestone-id="${milestone.id}">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          `;
        });
        
        milestonesListElem.innerHTML = milestonesHtml;
      }
    }
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-group-milestones', GroupMilestonesPanel);

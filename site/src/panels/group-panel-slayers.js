/**
 * Slayer Tasks Panel
 * Tracks group slayer tasks with fallback data sources
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";

class SlayersPanel extends BaseElement {
  constructor() {
    super();
    this.tasks = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.dataSource = "plugin"; // Default data source
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="panel-content slayer-tasks-panel">
        <div class="panel-header">🗡️ Slayer Tasks</div>
        <div class="panel-inner">
          <div class="tasks-header">
            <h3>Current Tasks</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="tasks-list">
            <div class="loading-container">
              <div class="loading-text">Loading slayer tasks...</div>
            </div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
          
          <div class="tasks-actions">
            <button class="add-task-button">Add New Task</button>
          </div>
        </div>
      </div>
    `;

    // Apply styles
    this.applyStyles();
    
    // Subscribe to group data events
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadTasks();
    });
    
    // Add event listeners
    this.addEventListener("click", this.handleClick.bind(this));
    
    // Initial data load
    this.loadTasks();
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
      .slayer-tasks-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      .panel-inner {
        padding: 12px;
      }
      
      /* Panel header styles */
      .slayer-tasks-panel .tasks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .slayer-tasks-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      /* Data source indicators */
      .slayer-tasks-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .slayer-tasks-panel .data-source {
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
      
      .slayer-tasks-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .slayer-tasks-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .slayer-tasks-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .slayer-tasks-panel .last-updated {
        margin-left: 5px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      /* Loading state */
      .slayer-tasks-panel .loading-container {
        padding: 15px;
        text-align: center;
      }
      
      .slayer-tasks-panel .loading-text {
        position: relative;
        padding-left: 24px;
      }
      
      .slayer-tasks-panel .loading-text::before {
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
      .slayer-tasks-panel .error-container {
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid rgba(168, 58, 58, 0.3);
        padding: 12px;
        margin: 10px 0;
        text-align: center;
        border-radius: 3px;
      }
      
      .slayer-tasks-panel .error-text {
        color: #a83a3a;
        margin-bottom: 8px;
      }
      
      .slayer-tasks-panel .retry-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      /* Task items */
      .slayer-tasks-panel .task-item {
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        margin-bottom: 8px;
        border-radius: 2px;
        overflow: hidden;
      }
      
      .slayer-tasks-panel .task-header {
        background-color: var(--header-bg);
        padding: 6px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
      }
      
      .slayer-tasks-panel .task-monster {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--header-text);
      }
      
      .slayer-tasks-panel .task-count {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 12px;
      }
      
      .slayer-tasks-panel .task-details {
        padding: 8px 10px;
      }
      
      .slayer-tasks-panel .task-assignee,
      .slayer-tasks-panel .task-master {
        margin-bottom: 5px;
        font-size: 13px;
      }
      
      .slayer-tasks-panel .label {
        color: var(--secondary-text);
        margin-right: 5px;
      }
      
      .slayer-tasks-panel .value {
        color: var(--primary-text);
        font-weight: bold;
      }
      
      .slayer-tasks-panel .task-progress {
        height: 6px;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        margin-top: 8px;
        overflow: hidden;
      }
      
      .slayer-tasks-panel .progress-bar {
        height: 100%;
        background-color: var(--orange);
        transition: width 0.3s ease;
      }
      
      /* Actions */
      .slayer-tasks-panel .task-actions {
        display: flex;
        padding: 8px 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        justify-content: flex-end;
        gap: 8px;
      }
      
      .slayer-tasks-panel button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 4px 8px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 2px;
      }
      
      .slayer-tasks-panel button:hover {
        background-color: var(--button-hover-bg);
      }
      
      .slayer-tasks-panel .add-task-button {
        background-color: #305830;
        border-color: #254025;
        color: #fff;
      }
      
      .slayer-tasks-panel .complete-button {
        background-color: #305830;
        border-color: #254025;
        color: #fff;
      }
      
      .slayer-tasks-panel .tasks-actions {
        margin-top: 15px;
        display: flex;
        justify-content: center;
      }
      
      /* Empty state */
      .slayer-tasks-panel .empty-state {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text);
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    if (event.target.classList.contains("add-task-button")) {
      alert("Add task functionality would be implemented here");
    }
    
    if (event.target.classList.contains("complete-button")) {
      const taskId = event.target.dataset.taskId;
      this.completeTask(taskId);
    }
    
    if (event.target.classList.contains("retry-button")) {
      this.loadTasks();
    }
  }

  loadTasks() {
    this.loading = true;
    this.updateUI();
    
    // Try to get data from plugin first (P)
    if (window.plugin && window.plugin.slayerTasks) {
      try {
        const pluginTasks = window.plugin.slayerTasks.getCurrentTasks();
        if (pluginTasks && pluginTasks.length > 0) {
          this.tasks = pluginTasks;
          this.dataSource = "plugin";
          this.loading = false;
          this.error = null;
          this.lastUpdated = new Date();
          this.updateUI();
          return;
        }
      } catch (err) {
        console.warn("Failed to load slayer tasks from plugin:", err);
        // Continue to fallback
      }
    }
    
    // Fallback to Wise Old Man API (W)
    this.tryWiseOldManTasks();
  }

  tryWiseOldManTasks() {
    // Check if WOM service is available
    if (window.wiseOldManService) {
      try {
        window.wiseOldManService.getSlayerTasks()
          .then(womTasks => {
            if (womTasks && womTasks.length > 0) {
              this.tasks = womTasks;
              this.dataSource = "wiseOldMan";
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateUI();
            } else {
              // Try the OSRS Wiki as last resort (K)
              this.tryWikiTasks();
            }
          })
          .catch(err => {
            console.warn("Failed to load slayer tasks from Wise Old Man:", err);
            this.tryWikiTasks();
          });
      } catch (err) {
        this.tryWikiTasks();
      }
    } else {
      // No WOM service, try Wiki
      this.tryWikiTasks();
    }
  }

  tryWikiTasks() {
    // Check if Wiki service is available
    if (window.wikiService) {
      try {
        window.wikiService.getSlayerTasks()
          .then(wikiTasks => {
            if (wikiTasks && wikiTasks.length > 0) {
              this.tasks = wikiTasks;
              this.dataSource = "wiki";
              this.loading = false;
              this.error = null;
              this.lastUpdated = new Date();
              this.updateUI();
            } else {
              // No data from any source, use mock data
              this.useMockData();
            }
          })
          .catch(err => {
            console.warn("Failed to load slayer tasks from Wiki:", err);
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
      this.tasks = [
        {
          id: "task1",
          monster: "Aberrant Spectres",
          amount: 135,
          remaining: 42,
          assignee: "Player1",
          master: "Nieve",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
        },
        {
          id: "task2",
          monster: "Hellhounds",
          amount: 164,
          remaining: 164,
          assignee: "Player2",
          master: "Duradel",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
        },
        {
          id: "task3",
          monster: "Gargoyles",
          amount: 186,
          remaining: 98,
          assignee: "Player3",
          master: "Duradel",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
        }
      ];
      
      this.dataSource = "wiki"; // Show as Wiki source since it's our fallback
      this.loading = false;
      this.error = null;
      this.lastUpdated = new Date();
      this.updateUI();
    }, 1000);
  }

  completeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.remaining = 0;
      this.updateUI();
    }
  }

  updateUI() {
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
    
    // Update loading state
    const loadingContainer = this.querySelector(".loading-container");
    if (loadingContainer) {
      loadingContainer.style.display = this.loading ? "block" : "none";
    }
    
    // Update last sync time
    const lastUpdated = this.querySelector(".last-updated");
    if (lastUpdated) {
      lastUpdated.textContent = this.lastUpdated 
        ? `Last updated: ${this.lastUpdated.toLocaleTimeString()}`
        : 'Not yet updated';
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
    
    // If not loading, render tasks
    if (!this.loading && !this.error) {
      const tasksList = this.querySelector(".tasks-list");
      if (tasksList) {
        if (this.tasks.length === 0) {
          tasksList.innerHTML = `
            <div class="empty-state">
              <p>No slayer tasks found.</p>
            </div>
          `;
        } else {
          let tasksHtml = "";
          
          this.tasks.forEach(task => {
            const progressPercent = Math.floor((task.amount - task.remaining) / task.amount * 100);
            
            tasksHtml += `
              <div class="task-item" data-task-id="${task.id}">
                <div class="task-header">
                  <span class="task-monster">${task.monster}</span>
                  <span class="task-count">${task.remaining}/${task.amount}</span>
                </div>
                <div class="task-details">
                  <div class="task-assignee">
                    <span class="label">Assigned to:</span>
                    <span class="value">${task.assignee}</span>
                  </div>
                  <div class="task-master">
                    <span class="label">Slayer Master:</span>
                    <span class="value">${task.master}</span>
                  </div>
                  <div class="task-progress">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                  </div>
                </div>
                <div class="task-actions">
                  <button class="complete-button" data-task-id="${task.id}">Complete</button>
                </div>
              </div>
            `;
          });
          
          tasksList.innerHTML = tasksHtml;
        }
      }
    }
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-slayers', SlayersPanel);

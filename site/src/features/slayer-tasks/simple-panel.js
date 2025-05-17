/**
 * Simple Slayer Tasks Panel
 * 
 * This follows the exact pattern of the original codebase
 * to ensure compatibility and integration
 */

import { BaseElement } from "../../base-element/base-element";
import { pubsub } from "../../data/pubsub";
import "./slayer-tasks-panel.css";

export class SimplePanel extends BaseElement {
  constructor() {
    super();
    this.tasks = [];
    this.loading = true;
    this.syncTime = null;
  }

  html() {
    return `
      <div class="panel-content">
        <div class="panel-header">🗡️ Slayer Tasks</div>
        <div class="slayer-tasks-content">
          <div class="tasks-header">
            <h3>Current Tasks</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="last-updated">Loading...</span>
            </div>
          </div>
          <div class="tasks-list">
            <div class="loading-container">
              <div class="loading-text">Loading slayer tasks...</div>
            </div>
          </div>
          <div class="tasks-actions">
            <button class="add-task-button">Add New Task</button>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadTasks();
    
    // Listen for clicks
    this.addEventListener("click", this.handleClick.bind(this));
    
    // Subscribe to pubsub events
    pubsub.subscribe("data-sync-completed", (data) => {
      this.syncTime = new Date();
      this.loadTasks();
    });
  }

  handleClick(event) {
    if (event.target.classList.contains("add-task-button")) {
      alert("Add task functionality would be implemented here");
    }
    
    if (event.target.classList.contains("complete-button")) {
      const taskId = event.target.dataset.taskId;
      this.completeTask(taskId);
    }
  }

  loadTasks() {
    this.loading = true;
    this.updateUI();
    
    // Simulate loading data from the server
    setTimeout(() => {
      this.tasks = [
        {
          id: "task1",
          monster: "Aberrant Spectres",
          amount: 135,
          remaining: 42,
          assignee: "Player1",
          master: "Nieve"
        },
        {
          id: "task2",
          monster: "Hellhounds",
          amount: 164,
          remaining: 164,
          assignee: "Player2",
          master: "Duradel"
        },
        {
          id: "task3",
          monster: "Gargoyles",
          amount: 186,
          remaining: 98,
          assignee: "Player3",
          master: "Duradel"
        }
      ];
      
      this.loading = false;
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
    // Update loading state
    const loadingContainer = this.querySelector(".loading-container");
    if (loadingContainer) {
      loadingContainer.style.display = this.loading ? "block" : "none";
    }
    
    // Update last sync time
    const lastUpdated = this.querySelector(".last-updated");
    if (lastUpdated) {
      lastUpdated.textContent = this.syncTime 
        ? `Last updated: ${this.syncTime.toLocaleTimeString()}`
        : 'Not yet synced';
    }
    
    // If not loading, render tasks
    if (!this.loading && this.tasks.length > 0) {
      const tasksList = this.querySelector(".tasks-list");
      if (tasksList) {
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
    } else if (!this.loading && this.tasks.length === 0) {
      const tasksList = this.querySelector(".tasks-list");
      if (tasksList) {
        tasksList.innerHTML = `
          <div class="empty-state">
            <p>No slayer tasks found.</p>
          </div>
        `;
      }
    }
  }
}

// Register the custom element
customElements.define("simple-panel", SimplePanel);

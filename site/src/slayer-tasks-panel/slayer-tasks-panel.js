/**
 * Slayer Tasks Panel
 * Custom panel for tracking group slayer tasks
 * Extends BaseElement and follows the original codebase patterns
 */

import { BaseElement } from "../base-element/base-element";
import { pubsub } from "../data/pubsub";
import { api } from "../data/api";

export class SlayerTasksPanel extends BaseElement {
  constructor() {
    super();
    this.tasks = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
  }

  html() {
    return `{{slayer-tasks-panel.html}}`;
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Subscribe to data sync events
    this.syncUnsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadTasks();
    });
    
    // Add event listeners
    this.addEventListeners();
    
    // Initial load
    this.loadTasks();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Cleanup
    if (this.syncUnsubscribe) {
      this.syncUnsubscribe();
    }
    
    // Remove event listeners
    this.removeEventListeners();
  }

  addEventListeners() {
    this.addEventListener("click", this.handleClick);
  }

  removeEventListeners() {
    this.removeEventListener("click", this.handleClick);
  }

  handleClick = (event) => {
    const target = event.target;
    
    if (target.matches(".add-task-button")) {
      this.showAddTaskForm();
    } else if (target.matches(".complete-button")) {
      const taskId = target.dataset.taskId;
      this.completeTask(taskId);
    } else if (target.matches(".retry-button")) {
      this.loadTasks();
    }
  }

  loadTasks() {
    this.loading = true;
    this.updateDisplay();
    
    // Check if logged in
    if (!api.groupName || !api.groupToken) {
      this.loading = false;
      this.error = "Please log in to view slayer tasks";
      this.updateDisplay();
      return;
    }
    
    // Simulate loading data from the server
    setTimeout(() => {
      try {
        // In a real implementation, this would fetch from the server
        // For now, simulate with mock data
        this.tasks = [
          {
            id: "1",
            monster: "Aberrant Spectres",
            amount: 135,
            remaining: 42,
            assignee: "Player1",
            master: "Nieve",
            createdAt: new Date().toISOString()
          },
          {
            id: "2",
            monster: "Hellhounds",
            amount: 164,
            remaining: 164,
            assignee: "Player2",
            master: "Duradel",
            createdAt: new Date().toISOString()
          },
          {
            id: "3",
            monster: "Gargoyles",
            amount: 186,
            remaining: 98,
            assignee: "Player3",
            master: "Duradel",
            createdAt: new Date().toISOString()
          }
        ];
        
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
      } catch (error) {
        this.loading = false;
        this.error = error.message || "Failed to load tasks";
      }
      
      this.updateDisplay();
    }, 1000);
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
    
    // Update tasks list
    const tasksListElem = this.querySelector(".tasks-list");
    if (tasksListElem && !this.loading && !this.error) {
      if (this.tasks.length === 0) {
        tasksListElem.innerHTML = `
          <div class="empty-state">
            <p>No slayer tasks found.</p>
          </div>
        `;
      } else {
        let tasksHtml = "";
        
        this.tasks.forEach(task => {
          const progressPercent = Math.floor(((task.amount - task.remaining) / task.amount) * 100);
          
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
        
        tasksListElem.innerHTML = tasksHtml;
      }
    }
  }

  showAddTaskForm() {
    alert("Add task functionality would be implemented here");
  }

  completeTask(taskId) {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex].remaining = 0;
      this.updateDisplay();
    }
  }
}

customElements.define("slayer-tasks-panel", SlayerTasksPanel);

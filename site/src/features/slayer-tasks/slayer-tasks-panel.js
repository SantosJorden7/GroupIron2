/**
 * Slayer Tasks Panel
 * 
 * Custom panel for tracking group slayer tasks
 * Uses the base element pattern from the original codebase
 */

import { BaseElement } from "../../base-element/base-element";
import { pubsub } from "../../data/pubsub";
import { dataSyncService } from "../data-sync/data-sync-service";

export class SlayerTasksPanel extends BaseElement {
  constructor() {
    super();
    this.tasks = [];
    this.loading = true;
    this.error = null;
    this.syncSubscription = null;
  }

  html() {
    return `{{slayer-tasks-panel.html}}`;
  }

  updatePanel() {
    // Update loading state
    const loadingContainer = this.querySelector('.loading-container');
    if (loadingContainer) {
      if (this.loading) {
        loadingContainer.style.display = 'block';
      } else {
        loadingContainer.style.display = 'none';
      }
    }
    
    // Update last updated time
    const lastUpdatedSpan = this.querySelector('.last-updated');
    if (lastUpdatedSpan) {
      lastUpdatedSpan.textContent = `Last updated: ${this.getLastUpdatedTime()}`;
    }
    
    // Render tasks if available
    if (!this.loading && !this.error && this.tasks.length > 0) {
      this.renderTasks();
    } else if (!this.loading && !this.error && this.tasks.length === 0) {
      this.renderEmptyState();
    } else if (!this.loading && this.error) {
      this.renderError();
    }
  }
  
  renderTasks() {
    const tasksList = this.querySelector('.tasks-list');
    if (!tasksList) return;
    
    // Clear previous content
    tasksList.innerHTML = '';
    
    // Create task elements
    this.tasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'task-item';
      taskElement.dataset.taskId = task.id;
      
      taskElement.innerHTML = `
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
            <div class="progress-bar" style="width: ${(task.amount - task.remaining) / task.amount * 100}%"></div>
          </div>
        </div>
        <div class="task-actions">
          <button class="update-button" data-task-id="${task.id}">Update</button>
          <button class="complete-button" data-task-id="${task.id}">Complete</button>
        </div>
      `;
      
      tasksList.appendChild(taskElement);
    });
  }
  
  renderEmptyState() {
    const tasksList = this.querySelector('.tasks-list');
    if (!tasksList) return;
    
    tasksList.innerHTML = `
      <div class="empty-state">
        <p>No slayer tasks found.</p>
        <button class="add-task-button">Add Task</button>
      </div>
    `;
  }
  
  renderError() {
    const tasksList = this.querySelector('.tasks-list');
    if (!tasksList) return;
    
    tasksList.innerHTML = `
      <div class="error-container">
        <div class="error-text">Error: ${this.error}</div>
        <button class="retry-button">Retry</button>
      </div>
    `;
  }

  getLastUpdatedTime() {
    if (!dataSyncService.lastSyncTime) {
      return 'Never';
    }

    const lastSync = new Date(dataSyncService.lastSyncTime);
    return lastSync.toLocaleTimeString();
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Subscribe to data sync events
    this.syncSubscription = pubsub.subscribe('data-synced', () => {
      this.loadTasks();
    });
    
    // Add event listeners
    this.addEventListeners();
    
    // Initial load
    this.loadTasks();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Unsubscribe from events
    if (this.syncSubscription) {
      this.syncSubscription();
    }
    
    // Remove event listeners
    this.removeEventListeners();
  }

  addEventListeners() {
    this.addEventListener('click', this.handleClick.bind(this));
  }

  removeEventListeners() {
    this.removeEventListener('click', this.handleClick.bind(this));
  }

  handleClick(event) {
    const target = event.target;
    
    if (target.classList.contains('retry-button')) {
      this.loadTasks();
    }
    
    if (target.classList.contains('add-task-button')) {
      this.showAddTaskForm();
    }
    
    if (target.classList.contains('update-button')) {
      const taskId = target.dataset.taskId;
      this.showUpdateTaskForm(taskId);
    }
    
    if (target.classList.contains('complete-button')) {
      const taskId = target.dataset.taskId;
      this.completeTask(taskId);
    }
  }

  loadTasks() {
    this.loading = true;
    this.updatePanel();
    
    // Simulate fetching data from the service
    setTimeout(() => {
      try {
        // In a real implementation, this would use dataSyncService to get actual data
        // For now, we'll use sample data
        this.tasks = [
          {
            id: '1',
            monster: 'Aberrant Spectres',
            amount: 135,
            remaining: 42,
            assignee: 'Player1',
            master: 'Nieve'
          },
          {
            id: '2',
            monster: 'Hellhounds',
            amount: 164,
            remaining: 164,
            assignee: 'Player2',
            master: 'Duradel'
          },
          {
            id: '3',
            monster: 'Gargoyles',
            amount: 186,
            remaining: 98,
            assignee: 'Player3',
            master: 'Duradel'
          }
        ];
        
        this.loading = false;
        this.error = null;
      } catch (err) {
        this.loading = false;
        this.error = err.message || 'Failed to load tasks';
      }
      
      this.updatePanel();
    }, 500);
  }

  showAddTaskForm() {
    alert('Add task form would be shown here in the full implementation');
    // In a full implementation, this would show a form to add a new task
  }

  showUpdateTaskForm(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    alert(`Update form for task: ${task.monster} would be shown here`);
    // In a full implementation, this would show a form to update the task
  }

  completeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Mark task as complete
    task.remaining = 0;
    
    alert(`Task ${task.monster} marked as complete!`);
    this.render();
    
    // In a full implementation, this would update the task in the service
  }
}

// Register the custom element
customElements.define('slayer-tasks-panel', SlayerTasksPanel);

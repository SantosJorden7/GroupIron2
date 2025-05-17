/**
 * Group Challenges Panel
 * A custom element for tracking group challenges and goals
 * Extends BaseElement to match the original codebase's pattern
 */

import { BaseElement } from "../base-element/base-element";
import { pubsub } from "../data/pubsub";
import { api } from "../data/api";

export class GroupChallengesPanel extends BaseElement {
  constructor() {
    super();
    this.challenges = [];
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.selectedFilter = "active";
  }

  html() {
    return `{{group-challenges-panel.html}}`;
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Subscribe to group data events
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadChallenges();
    });
    
    // Add event listeners
    this.addEventListener("click", this.handleClick);
    
    // Initial data load
    this.loadChallenges();
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

  handleClick = (event) => {
    const target = event.target;
    
    // Handle filter buttons
    if (target.classList.contains("filter-button")) {
      const filter = target.dataset.filter;
      this.filterChallenges(filter);
    }
    
    // Handle retry button
    if (target.classList.contains("retry-button")) {
      this.loadChallenges();
    }
    
    // Handle add challenge button
    if (target.classList.contains("add-challenge-button")) {
      this.showAddChallengeForm();
    }
    
    // Handle complete challenge button
    if (target.classList.contains("complete-button")) {
      const challengeId = target.closest(".challenge-item").dataset.challengeId;
      this.completeChallenge(challengeId);
    }
  }

  loadChallenges() {
    this.loading = true;
    this.updateDisplay();
    
    // Check if logged in
    if (!api.groupName || !api.groupToken) {
      this.loading = false;
      this.error = "Please log in to view group challenges";
      this.updateDisplay();
      return;
    }
    
    // Simulate loading data from the server
    setTimeout(() => {
      try {
        // Mock data - in a real implementation this would use the API
        this.challenges = [
          {
            id: "1",
            title: "Fire Cape Race",
            description: "First group member to obtain a Fire Cape",
            createdBy: "Player1",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
            status: "active",
            completedBy: null,
            completedAt: null,
            reward: "10M GP from group fund"
          },
          {
            id: "2",
            title: "Level 80 Slayer",
            description: "All group members reach level 80 in Slayer",
            createdBy: "Player2",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
            deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
            status: "active",
            completedBy: null,
            completedAt: null,
            reward: "Shared Abyssal whip"
          },
          {
            id: "3",
            title: "GWD Equipment",
            description: "Obtain one complete set of godwars dungeon armor",
            createdBy: "Player3",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
            deadline: null, // No deadline
            status: "active",
            completedBy: null,
            completedAt: null,
            reward: null
          },
          {
            id: "4",
            title: "Barrows Gloves",
            description: "All group members obtain Barrows gloves",
            createdBy: "Player1",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
            deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago (expired)
            status: "expired",
            completedBy: null,
            completedAt: null,
            reward: "Group cooking supplies"
          },
          {
            id: "5",
            title: "Group Bossing Day",
            description: "All members participate in a 3-hour GWD bossing session",
            createdBy: "Player2",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
            deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
            status: "completed",
            completedBy: "Group",
            completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
            reward: "Drop splits"
          }
        ];
        
        this.loading = false;
        this.error = null;
        this.lastUpdated = new Date();
      } catch (error) {
        this.loading = false;
        this.error = error.message || "Failed to load challenges";
      }
      
      this.updateDisplay();
    }, 1000);
  }

  filterChallenges(filter) {
    this.selectedFilter = filter || "active";
    
    // Set active class on the selected filter button
    const filterButtons = this.querySelectorAll(".filter-button");
    filterButtons.forEach(button => {
      if (button.dataset.filter === this.selectedFilter) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
    
    // Update the displayed challenges
    this.updateDisplay();
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
              <div class="challenge-actions">
                ${challenge.status === "active" ? `<button class="complete-button" data-challenge-id="${challenge.id}">Complete</button>` : ''}
              </div>
            </div>
          `;
        });
        
        challengesListElem.innerHTML = challengesHtml;
      }
    }
  }

  showAddChallengeForm() {
    alert("Add challenge functionality would be implemented here");
  }

  completeChallenge(challengeId) {
    const challengeIndex = this.challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex !== -1) {
      this.challenges[challengeIndex].status = "completed";
      this.challenges[challengeIndex].completedBy = "Current player"; // Would use actual player name
      this.challenges[challengeIndex].completedAt = new Date().toISOString();
      this.updateDisplay();
    }
  }
}

customElements.define("group-challenges-panel", GroupChallengesPanel);

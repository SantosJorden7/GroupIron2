/**
 * Shared Calendar Panel
 * Custom element for the group's shared calendar
 */

import { BaseElement } from "../base-element/base-element.js";
import { pubsub } from "../data/pubsub.js";
import calendarUtils from "../data/calendar-utils.js";

class SharedCalendarPanel extends BaseElement {
  constructor() {
    super();
    this.events = [];
    this.filteredEvents = [];
    this.groupedEvents = {};
    this.loading = true;
    this.error = null;
    this.lastUpdated = null;
    this.dataSource = "plugin"; // Default data source
    this.selectedEventId = null;
    this.filterType = "all";
    this.filterStatus = "upcoming";
    this.isAddingEvent = false;
    this.isEditingEvent = false;
    this.groupMembers = [];
  }

  async connectedCallback() {
    this.innerHTML = `
      <div class="panel-content calendar-panel">
        <div class="panel-header">📅 Group Calendar</div>
        <div class="panel-inner">
          <div class="calendar-header">
            <h3>Group Events</h3>
            <div class="data-source-indicator">
              <span class="data-source plugin" title="Data from RuneLite Plugin">P</span>
              <span class="data-source wom" title="Data from Wise Old Man API">W</span>
              <span class="data-source wiki" title="Data from OSRS Wiki">K</span>
              <span class="last-updated"></span>
            </div>
          </div>
          
          <div class="calendar-controls">
            <div class="filters">
              <div class="filter-group">
                <label class="filter-label">Type:</label>
                <select class="filter-type">
                  <option value="all">All types</option>
                  <option value="boss">Boss</option>
                  <option value="skilling">Skilling</option>
                  <option value="minigame">Minigame</option>
                  <option value="clue">Clue Hunt</option>
                  <option value="raid">Raid</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Show:</label>
                <select class="filter-status">
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="all">All events</option>
                </select>
              </div>
            </div>
            <button class="add-event-button">Add New Event</button>
          </div>
          
          <div class="loading-container">
            <div class="loading-text">Loading calendar...</div>
          </div>
          
          <div class="error-container" style="display: none;">
            <div class="error-text"></div>
            <button class="retry-button">Retry</button>
          </div>
          
          <div class="events-list" style="display: none;">
            <!-- Events will be populated here -->
            <!-- Mock/example event -->
            <div class="month-group">
              <h4 class="month-header">May 2025</h4>
              <div class="event-card" data-event-id="mock_event_1">
                <div class="event-header">
                  <div class="event-type" style="background-color: #a83a3a;">👑 Boss</div>
                  <div class="event-date">May 20, 2025 at 8:00 PM</div>
                </div>
                <div class="event-title">Group Bandos Trip</div>
                <div class="event-content">
                  <div class="event-description">Let's get some tassets! Meet at the GE first.</div>
                  <div class="event-footer">
                    <div class="event-attendees">
                      <span class="attendee">Player1</span>
                      <span class="attendee">Player2</span>
                      <span class="attendee">Player3</span>
                    </div>
                    <div class="event-status">in 3 days</div>
                  </div>
                </div>
                <div class="event-actions">
                  <button class="event-edit">Edit</button>
                  <button class="event-delete">Delete</button>
                </div>
              </div>
              
              <div class="event-card" data-event-id="mock_event_2">
                <div class="event-header">
                  <div class="event-type" style="background-color: #4a934a;">🛠️ Skilling</div>
                  <div class="event-date">May 22, 2025 at 6:00 PM</div>
                </div>
                <div class="event-title">Group Fishing Session</div>
                <div class="event-content">
                  <div class="event-description">Fishing karambwans together for team cooking.</div>
                  <div class="event-footer">
                    <div class="event-attendees">
                      <span class="attendee">Player2</span>
                      <span class="attendee">Player3</span>
                    </div>
                    <div class="event-status">in 5 days</div>
                  </div>
                </div>
                <div class="event-actions">
                  <button class="event-edit">Edit</button>
                  <button class="event-delete">Delete</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="event-form-container" style="display: none;">
            <h4 class="form-title">Add New Event</h4>
            <form class="event-form">
              <div class="form-group">
                <label for="event-title">Title:</label>
                <input type="text" id="event-title" class="event-title-input" placeholder="Event title" required>
              </div>
              
              <div class="form-group">
                <label for="event-description">Description:</label>
                <textarea id="event-description" class="event-description-input" placeholder="Event description" rows="3"></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="event-date">Date:</label>
                  <input type="date" id="event-date" class="event-date-input" required>
                </div>
                
                <div class="form-group">
                  <label for="event-time">Time:</label>
                  <input type="time" id="event-time" class="event-time-input" required>
                </div>
              </div>
              
              <div class="form-group">
                <label for="event-type">Type:</label>
                <select id="event-type" class="event-type-input" required>
                  <option value="boss">Boss</option>
                  <option value="skilling">Skilling</option>
                  <option value="minigame">Minigame</option>
                  <option value="clue">Clue Hunt</option>
                  <option value="raid">Raid</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Attendees:</label>
                <div class="attendees-list">
                  <div class="attendee-option">
                    <input type="checkbox" id="attendee-player1" class="attendee-checkbox" value="player1">
                    <label for="attendee-player1">Player 1</label>
                  </div>
                  <div class="attendee-option">
                    <input type="checkbox" id="attendee-player2" class="attendee-checkbox" value="player2">
                    <label for="attendee-player2">Player 2</label>
                  </div>
                  <div class="attendee-option">
                    <input type="checkbox" id="attendee-player3" class="attendee-checkbox" value="player3">
                    <label for="attendee-player3">Player 3</label>
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="cancel-button">Cancel</button>
                <button type="submit" class="save-button">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Apply styles
    this.applyStyles();
    
    // Add event listeners
    this.addEventListener("click", this.handleClick.bind(this));
    this.addEventListener("change", this.handleChange.bind(this));
    this.querySelector(".event-form")?.addEventListener("submit", this.handleSubmit.bind(this));
    
    // Subscribe to group data events if needed
    this.unsubscribe = pubsub.subscribe("group-data-updated", () => {
      this.loadCalendarData();
    });
    
    // Load calendar data
    this.loadCalendarData();
  }

  disconnectedCallback() {
    // Cleanup subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Remove event listeners
    this.removeEventListener("click", this.handleClick);
    this.removeEventListener("change", this.handleChange);
    this.querySelector(".event-form")?.removeEventListener("submit", this.handleSubmit);
  }

  applyStyles() {
    // Add CSS for the panel
    const style = document.createElement('style');
    style.textContent = `
      .calendar-panel {
        font-family: rssmall, 'RuneScape Small', sans-serif;
        color: var(--primary-text);
      }
      
      .panel-inner {
        padding: 12px;
      }
      
      /* Panel header styles */
      .calendar-panel .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .calendar-panel h3 {
        margin: 0;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        color: var(--orange);
      }
      
      .calendar-panel h4 {
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        margin: 0 0 8px 0;
      }
      
      /* Data source indicators */
      .calendar-panel .data-source-indicator {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      
      .calendar-panel .data-source {
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
      
      .calendar-panel .data-source.plugin {
        background-color: #4a934a;
        color: white;
      }
      
      .calendar-panel .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .calendar-panel .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
      
      .calendar-panel .last-updated {
        margin-left: 5px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      /* Controls */
      .calendar-panel .calendar-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .calendar-panel .filters {
        display: flex;
        gap: 12px;
      }
      
      .calendar-panel .filter-group {
        display: flex;
        align-items: center;
      }
      
      .calendar-panel .filter-label {
        margin-right: 5px;
      }
      
      .calendar-panel select {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 6px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      .calendar-panel .add-event-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 4px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      .calendar-panel .add-event-button:hover {
        background-color: var(--button-hover-bg);
      }
      
      /* Loading and error states */
      .calendar-panel .loading-container {
        padding: 15px;
        text-align: center;
      }
      
      .calendar-panel .loading-text {
        position: relative;
        padding-left: 24px;
      }
      
      .calendar-panel .loading-text::before {
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
      
      .calendar-panel .error-container {
        background-color: rgba(168, 58, 58, 0.1);
        border: 1px solid rgba(168, 58, 58, 0.3);
        padding: 12px;
        margin: 10px 0;
        text-align: center;
        border-radius: 3px;
      }
      
      .calendar-panel .error-text {
        color: #a83a3a;
        margin-bottom: 8px;
      }
      
      .calendar-panel .retry-button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 3px 10px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      /* Event list */
      .calendar-panel .events-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .calendar-panel .month-group {
        margin-bottom: 15px;
      }
      
      .calendar-panel .month-header {
        color: var(--orange);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 5px;
        margin-bottom: 10px;
      }
      
      .calendar-panel .event-card {
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        margin-bottom: 10px;
        overflow: hidden;
      }
      
      .calendar-panel .event-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background-color: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid var(--border-color);
      }
      
      .calendar-panel .event-type {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
        color: white;
      }
      
      .calendar-panel .event-date {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .calendar-panel .event-title {
        padding: 8px 10px;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
      }
      
      .calendar-panel .event-content {
        padding: 0 10px 10px;
      }
      
      .calendar-panel .event-description {
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .calendar-panel .event-footer {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        opacity: 0.8;
      }
      
      .calendar-panel .event-attendees {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      
      .calendar-panel .attendee {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 2px 6px;
        border-radius: 8px;
      }
      
      .calendar-panel .event-actions {
        display: flex;
        border-top: 1px solid var(--border-color);
      }
      
      .calendar-panel .event-actions button {
        flex: 1;
        background-color: transparent;
        border: none;
        border-right: 1px solid var(--border-color);
        padding: 5px;
        cursor: pointer;
        color: var(--primary-text);
        font-family: rssmall, 'RuneScape Small', sans-serif;
      }
      
      .calendar-panel .event-actions button:last-child {
        border-right: none;
      }
      
      .calendar-panel .event-actions button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      /* Event form */
      .calendar-panel .event-form-container {
        background-color: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        padding: 15px;
        margin-top: 15px;
      }
      
      .calendar-panel .form-title {
        margin-top: 0;
        margin-bottom: 15px;
        color: var(--orange);
      }
      
      .calendar-panel .event-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .calendar-panel .form-row {
        display: flex;
        gap: 12px;
      }
      
      .calendar-panel .form-group {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      
      .calendar-panel .form-group label {
        margin-bottom: 4px;
      }
      
      .calendar-panel .form-group input,
      .calendar-panel .form-group textarea,
      .calendar-panel .form-group select {
        background-color: var(--input-bg, rgba(0, 0, 0, 0.2));
        border: 1px solid var(--input-border, var(--border-color));
        color: var(--input-text, var(--primary-text));
        padding: 6px 8px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
      }
      
      .calendar-panel .attendees-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .calendar-panel .attendee-option {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .calendar-panel .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }
      
      .calendar-panel .form-actions button {
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--button-text);
        padding: 6px 15px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        cursor: pointer;
      }
      
      .calendar-panel .form-actions button:hover {
        background-color: var(--button-hover-bg);
      }
      
      .calendar-panel .save-button {
        background-color: var(--success-button-bg, #4a934a) !important;
        border-color: var(--success-button-border, #3a7a3a) !important;
      }
    `;
    this.appendChild(style);
  }

  handleClick(event) {
    const target = event.target;
    
    // Handle add event button
    if (target.classList.contains("add-event-button")) {
      this.showAddEventForm();
    }
    
    // Handle retry button
    if (target.classList.contains("retry-button")) {
      this.loadCalendarData();
    }
    
    // Handle edit event button
    if (target.classList.contains("event-edit")) {
      const eventCard = target.closest(".event-card");
      if (eventCard) {
        const eventId = eventCard.dataset.eventId;
        this.showEditEventForm(eventId);
      }
    }
    
    // Handle delete event button
    if (target.classList.contains("event-delete")) {
      const eventCard = target.closest(".event-card");
      if (eventCard) {
        const eventId = eventCard.dataset.eventId;
        this.deleteEvent(eventId);
      }
    }
    
    // Handle cancel button
    if (target.classList.contains("cancel-button")) {
      this.hideEventForm();
    }
  }

  handleChange(event) {
    const target = event.target;
    
    // Handle filter type change
    if (target.classList.contains("filter-type")) {
      this.filterType = target.value;
      this.filterEvents();
    }
    
    // Handle filter status change
    if (target.classList.contains("filter-status")) {
      this.filterStatus = target.value;
      this.filterEvents();
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const form = event.target;
    const title = form.querySelector('#event-title').value;
    const description = form.querySelector('#event-description').value;
    const dateValue = form.querySelector('#event-date').value;
    const timeValue = form.querySelector('#event-time').value;
    const type = form.querySelector('#event-type').value;
    
    // Get attendees
    const attendeeCheckboxes = form.querySelectorAll('.attendee-checkbox:checked');
    const attendees = Array.from(attendeeCheckboxes).map(checkbox => checkbox.value);
    
    // Combine date and time
    const dateTime = new Date(`${dateValue}T${timeValue}:00`);
    
    // Create event object
    const eventData = {
      title,
      description,
      date: dateTime.toISOString(),
      type,
      attendees
    };
    
    this.loading = true;
    this.updateDisplay();
    
    try {
      if (this.isEditingEvent && this.selectedEventId) {
        // Update existing event
        eventData.id = this.selectedEventId;
        await calendarUtils.updateEvent(eventData);
        console.log(`Event updated: ${eventData.id}`);
      } else {
        // Add new event
        const newEvent = await calendarUtils.addEvent(eventData);
        console.log(`New event created: ${newEvent.id}`);
      }
      
      // Reload calendar data
      await this.loadCalendarData();
      
      // Hide the form
      this.hideEventForm();
    } catch (error) {
      console.error('Error saving event:', error);
      this.error = `Failed to save event: ${error.message}`;
      this.loading = false;
      this.updateDisplay();
    }
  }

  async loadCalendarData() {
    this.loading = true;
    this.updateDisplay();
    
    try {
      // Try to load group members first (for attendee list)
      await this.loadGroupMembers();
      
      // Load calendar events
      const { events, dataSource } = await calendarUtils.loadEvents();
      
      // Store the events and data source
      this.events = events;
      this.dataSource = dataSource;
      
      // Apply filters
      this.filterEvents();
      
      // Update loading state
      this.loading = false;
      this.error = null;
      this.lastUpdated = new Date();
      this.updateDisplay();
    } catch (error) {
      console.error('Error loading calendar data:', error);
      this.error = `Failed to load calendar data: ${error.message}`;
      this.loading = false;
      this.updateDisplay();
    }
  }
  
  async loadGroupMembers() {
    try {
      // Try to get group members from plugin
      if (window.plugin && window.plugin.groupData) {
        const groupData = await window.plugin.groupData.getGroupData();
        if (groupData && groupData.members) {
          this.groupMembers = groupData.members;
          return;
        }
      }
      
      // Fallback to mock data
      this.groupMembers = [
        { id: 'player1', name: 'Player 1' },
        { id: 'player2', name: 'Player 2' },
        { id: 'player3', name: 'Player 3' }
      ];
    } catch (error) {
      console.warn('Error loading group members:', error);
      // Fallback to mock data
      this.groupMembers = [
        { id: 'player1', name: 'Player 1' },
        { id: 'player2', name: 'Player 2' },
        { id: 'player3', name: 'Player 3' }
      ];
    }
  }

  showAddEventForm() {
    this.isAddingEvent = true;
    this.isEditingEvent = false;
    this.selectedEventId = null;
    
    // Reset form fields
    const form = this.querySelector(".event-form");
    if (form) {
      form.reset();
      
      // Set default date to today
      const dateInput = form.querySelector("#event-date");
      if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        dateInput.value = `${year}-${month}-${day}`;
      }
      
      // Set default time to current hour
      const timeInput = form.querySelector("#event-time");
      if (timeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(Math.ceil(now.getMinutes() / 15) * 15 % 60).padStart(2, "0");
        timeInput.value = `${hours}:${minutes}`;
      }
      
      // Update attendees list
      this.updateAttendeesList();
    }
    
    // Update form title
    const formTitle = this.querySelector(".form-title");
    if (formTitle) {
      formTitle.textContent = "Add New Event";
    }
    
    // Show form
    const formContainer = this.querySelector(".event-form-container");
    if (formContainer) {
      formContainer.style.display = "block";
    }
    
    // Scroll to form
    formContainer?.scrollIntoView({ behavior: "smooth" });
  }

  showEditEventForm(eventId) {
    this.isAddingEvent = false;
    this.isEditingEvent = true;
    this.selectedEventId = eventId;
    
    // Find the event data
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      console.error(`Event with ID ${eventId} not found`);
      return;
    }
    
    // Get the form
    const form = this.querySelector(".event-form");
    if (!form) return;
    
    // Fill in the form data
    form.querySelector('#event-title').value = event.title || '';
    form.querySelector('#event-description').value = event.description || '';
    
    const eventDate = new Date(event.date);
    
    // Format the date (YYYY-MM-DD)
    const dateInput = form.querySelector('#event-date');
    if (dateInput) {
      dateInput.value = calendarUtils.formatDateForInput(eventDate);
    }
    
    // Format the time (HH:MM)
    const timeInput = form.querySelector('#event-time');
    if (timeInput) {
      timeInput.value = calendarUtils.formatTimeForInput(eventDate);
    }
    
    // Set the type
    const typeSelect = form.querySelector('#event-type');
    if (typeSelect) {
      typeSelect.value = event.type || 'other';
    }
    
    // Update attendees list and check the appropriate boxes
    this.updateAttendeesList(event.attendees);
    
    // Update form title
    const formTitle = this.querySelector(".form-title");
    if (formTitle) {
      formTitle.textContent = "Edit Event";
    }
    
    // Show form
    const formContainer = this.querySelector(".event-form-container");
    if (formContainer) {
      formContainer.style.display = "block";
    }
    
    // Scroll to form
    formContainer?.scrollIntoView({ behavior: "smooth" });
  }

  hideEventForm() {
    this.isAddingEvent = false;
    this.isEditingEvent = false;
    this.selectedEventId = null;
    
    // Hide form
    const formContainer = this.querySelector(".event-form-container");
    if (formContainer) {
      formContainer.style.display = "none";
    }
  }

  async deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    this.loading = true;
    this.updateDisplay();
    
    try {
      // Delete the event
      const success = await calendarUtils.deleteEvent(eventId);
      
      if (success) {
        console.log(`Event deleted: ${eventId}`);
        // Reload calendar data
        await this.loadCalendarData();
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      this.error = `Failed to delete event: ${error.message}`;
      this.loading = false;
      this.updateDisplay();
    }
  }

  filterEvents() {
    if (!this.events || !this.events.length) {
      this.filteredEvents = [];
      this.groupedEvents = {};
      return;
    }
    
    // Filter by type
    let filtered = this.events;
    if (this.filterType !== 'all') {
      filtered = calendarUtils.filterEventsByType(filtered, this.filterType);
    }
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = calendarUtils.filterEventsByStatus(filtered, this.filterStatus);
    }
    
    // Store filtered events
    this.filteredEvents = filtered;
    
    // Group by month
    this.groupedEvents = calendarUtils.groupEventsByMonth(filtered);
  }
  
  updateAttendeesList(selectedAttendees = []) {
    const attendeesContainer = this.querySelector('.attendees-list');
    if (!attendeesContainer) return;
    
    // Create checkboxes for each group member
    let attendeesHtml = '';
    
    this.groupMembers.forEach(member => {
      const isChecked = selectedAttendees.includes(member.id) ? 'checked' : '';
      attendeesHtml += `
        <div class="attendee-option">
          <input type="checkbox" id="attendee-${member.id}" class="attendee-checkbox" value="${member.id}" ${isChecked}>
          <label for="attendee-${member.id}">${member.name}</label>
        </div>
      `;
    });
    
    attendeesContainer.innerHTML = attendeesHtml || '<div>No group members found</div>';
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
    
    // Update last updated text
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
    
    // Update events list
    const eventsListElem = this.querySelector(".events-list");
    if (eventsListElem) {
      if (!this.loading && !this.error) {
        // Render events
        this.renderEvents(eventsListElem);
        eventsListElem.style.display = "block";
      } else {
        eventsListElem.style.display = "none";
      }
    }
  }
  
  renderEvents(container) {
    if (!container) return;
    
    if (!this.filteredEvents || this.filteredEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No events found${this.filterType !== 'all' || this.filterStatus !== 'all' ? ' with the selected filters' : ''}.</p>
          <button class="add-event-button">Add an event</button>
        </div>
      `;
      return;
    }
    
    let eventsHtml = '';
    
    // For each month group
    Object.keys(this.groupedEvents).forEach(month => {
      const monthEvents = this.groupedEvents[month];
      
      eventsHtml += `
        <div class="month-group">
          <h4 class="month-header">${month}</h4>
      `;
      
      // Add each event in the month
      monthEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const formattedDate = calendarUtils.formatDate(eventDate, true);
        const relativeTime = calendarUtils.getRelativeTime(eventDate);
        const eventTypeDetails = calendarUtils.getEventTypeDetails(event.type);
        
        // Get attendee names
        const attendeeNames = event.attendees.map(attendeeId => {
          const member = this.groupMembers.find(m => m.id === attendeeId);
          return member ? member.name : attendeeId;
        });
        
        eventsHtml += `
          <div class="event-card" data-event-id="${event.id}">
            <div class="event-header">
              <div class="event-type" style="background-color: ${eventTypeDetails.color};">
                ${eventTypeDetails.icon} ${eventTypeDetails.name}
              </div>
              <div class="event-date">${formattedDate}</div>
            </div>
            <div class="event-title">${event.title}</div>
            <div class="event-content">
              <div class="event-description">${event.description || 'No description provided.'}</div>
              <div class="event-footer">
                <div class="event-attendees">
                  ${attendeeNames.map(name => `<span class="attendee">${name}</span>`).join('')}
                </div>
                <div class="event-status">${relativeTime}</div>
              </div>
            </div>
            <div class="event-actions">
              <button class="event-edit">Edit</button>
              <button class="event-delete">Delete</button>
            </div>
          </div>
        `;
      });
      
      eventsHtml += `</div>`;
    });
    
    container.innerHTML = eventsHtml;
  }
}

// Register with the correct naming convention
window.customElements.define('group-panel-shared-calendar', SharedCalendarPanel);

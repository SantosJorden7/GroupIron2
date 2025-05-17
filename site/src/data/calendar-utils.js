/**
 * Calendar Utilities
 * Helper functions for the shared calendar panel
 */

// Mock event storage for persistence
let mockEvents = [
  {
    id: 'event_1684210800000',
    title: 'Group Bandos Trip',
    description: 'Let\'s get some tassets! Meet at the GE first.',
    date: '2025-05-20T20:00:00.000Z',
    type: 'boss',
    attendees: ['player1', 'player2', 'player3']
  },
  {
    id: 'event_1684383600000',
    title: 'Group Fishing Session',
    description: 'Fishing karambwans together for team cooking.',
    date: '2025-05-22T18:00:00.000Z',
    type: 'skilling',
    attendees: ['player2', 'player3']
  },
  {
    id: 'event_1684556400000',
    title: 'Theater of Blood Run',
    description: 'Going for our first ToB completion as a group.',
    date: '2025-05-24T21:00:00.000Z',
    type: 'raid',
    attendees: ['player1', 'player2', 'player3']
  },
  {
    id: 'event_1683692400000',
    title: 'Hard Clue Hunting',
    description: 'Everyone bring their hard clues to work on together.',
    date: '2025-05-13T16:00:00.000Z',
    type: 'clue',
    attendees: ['player1', 'player3']
  }
];

export const calendarUtils = {
  /**
   * Format a date for display in the calendar
   * @param {Date|string} date - The date to format
   * @param {boolean} includeTime - Whether to include time in the format
   * @returns {string} - Formatted date string
   */
  formatDate(date, includeTime = false) {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    if (!includeTime) {
      return dateStr;
    }
    
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${dateStr} at ${timeStr}`;
  },
  
  /**
   * Format a date for input fields
   * @param {Date|string} date - The date to format
   * @returns {string} - Formatted date string (YYYY-MM-DD)
   */
  formatDateForInput(date) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toISOString().split('T')[0];
  },
  
  /**
   * Format a time for input fields
   * @param {Date|string} date - The date to format
   * @returns {string} - Formatted time string (HH:MM)
   */
  formatTimeForInput(date) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toTimeString().substring(0, 5);
  },
  
  /**
   * Get a relative time string (e.g., "in 2 days" or "3 hours ago")
   * @param {Date|string} date - The date to format
   * @returns {string} - Relative time string
   */
  getRelativeTime(date) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffHours < 0) {
      return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffMinutes < 0) {
      return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ago`;
    } else {
      return 'now';
    }
  },
  
  /**
   * Get event type details including icon and color
   * @param {string} eventType - The type of event
   * @returns {Object} - Event type details
   */
  getEventTypeDetails(eventType) {
    const types = {
      boss: {
        icon: '👑',
        color: '#a83a3a',
        name: 'Boss'
      },
      skilling: {
        icon: '🛠️',
        color: '#4a934a',
        name: 'Skilling'
      },
      minigame: {
        icon: '🎮',
        color: '#3a67a8',
        name: 'Minigame'
      },
      clue: {
        icon: '🗺️',
        color: '#a87d3a',
        name: 'Clue Hunt'
      },
      raid: {
        icon: '⚔️',
        color: '#7d3aa8',
        name: 'Raid'
      },
      social: {
        icon: '🎉',
        color: '#3aa87d',
        name: 'Social'
      },
      other: {
        icon: '📝',
        color: '#6b6b6b',
        name: 'Other'
      }
    };
    
    return types[eventType] || types.other;
  },
  
  /**
   * Sort events by date
   * @param {Array} events - The events to sort
   * @param {boolean} ascending - Whether to sort in ascending order
   * @returns {Array} - Sorted events
   */
  sortEvents(events, ascending = true) {
    if (!events || !Array.isArray(events)) return [];
    
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      return ascending
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
  },
  
  /**
   * Group events by month
   * @param {Array} events - The events to group
   * @returns {Object} - Events grouped by month
   */
  groupEventsByMonth(events) {
    if (!events || !Array.isArray(events)) return {};
    
    const grouped = {};
    
    events.forEach(event => {
      const date = new Date(event.date);
      const monthYear = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(event);
    });
    
    // Sort events within each month
    Object.keys(grouped).forEach(month => {
      grouped[month] = this.sortEvents(grouped[month], true);
    });
    
    return grouped;
  },
  
  /**
   * Filter events by type
   * @param {Array} events - The events to filter
   * @param {string} type - The type to filter by
   * @returns {Array} - Filtered events
   */
  filterEventsByType(events, type) {
    if (!events || !Array.isArray(events)) return [];
    if (!type || type === 'all') return events;
    
    return events.filter(event => event.type === type);
  },
  
  /**
   * Filter events by status (upcoming/past)
   * @param {Array} events - The events to filter
   * @param {string} status - The status to filter by (upcoming or past)
   * @returns {Array} - Filtered events
   */
  filterEventsByStatus(events, status) {
    if (!events || !Array.isArray(events)) return [];
    if (!status || status === 'all') return events;
    
    const now = new Date();
    
    if (status === 'upcoming') {
      return events.filter(event => new Date(event.date) >= now);
    } else if (status === 'past') {
      return events.filter(event => new Date(event.date) < now);
    }
    
    return events;
  },
  
  /**
   * Generate a unique ID for a new event
   * @returns {string} - Unique ID
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  },
  
  /**
   * Load calendar events with plugin, WOM, or wiki fallback
   * @param {string} source - Source priority (plugin, wiseOldMan, wiki)
   * @returns {Promise<Object>} - Events and data source
   */
  async loadEvents(source = 'plugin') {
    // Try to load from the plugin first
    if (source === 'plugin' && window.plugin && window.plugin.calendarEvents) {
      try {
        const events = await window.plugin.calendarEvents.getEvents();
        if (events && events.length > 0) {
          return {
            events,
            dataSource: 'plugin'
          };
        }
      } catch (err) {
        console.warn('Failed to load events from plugin:', err);
      }
    }
    
    // Try WOM next
    if ((source === 'plugin' || source === 'wiseOldMan') && 
        window.wiseOldManService && window.wiseOldManService.getGroupEvents) {
      try {
        const events = await window.wiseOldManService.getGroupEvents();
        if (events && events.length > 0) {
          return {
            events,
            dataSource: 'wiseOldMan'
          };
        }
      } catch (err) {
        console.warn('Failed to load events from Wise Old Man:', err);
      }
    }
    
    // Try wiki as last resort
    if (window.wikiService && window.wikiService.getGroupEvents) {
      try {
        const events = await window.wikiService.getGroupEvents();
        if (events && events.length > 0) {
          return {
            events,
            dataSource: 'wiki'
          };
        }
      } catch (err) {
        console.warn('Failed to load events from wiki:', err);
      }
    }
    
    // Fall back to mock data
    return {
      events: [...mockEvents],
      dataSource: 'wiki' // Mark as wiki source since it's our fallback
    };
  },
  
  /**
   * Add a new calendar event
   * @param {Object} event - The event to add
   * @returns {Promise<Object>} - The added event
   */
  async addEvent(event) {
    // Generate a unique ID if not provided
    if (!event.id) {
      event.id = this.generateEventId();
    }
    
    // Try to add via plugin
    if (window.plugin && window.plugin.calendarEvents && window.plugin.calendarEvents.addEvent) {
      try {
        const result = await window.plugin.calendarEvents.addEvent(event);
        return result;
      } catch (err) {
        console.warn('Failed to add event via plugin:', err);
      }
    }
    
    // For mock implementation, just add to our mock events
    mockEvents.push(event);
    
    // Return the added event
    return event;
  },
  
  /**
   * Update an existing calendar event
   * @param {Object} event - The event to update
   * @returns {Promise<Object>} - The updated event
   */
  async updateEvent(event) {
    if (!event || !event.id) {
      throw new Error('Event ID is required for update');
    }
    
    // Try to update via plugin
    if (window.plugin && window.plugin.calendarEvents && window.plugin.calendarEvents.updateEvent) {
      try {
        const result = await window.plugin.calendarEvents.updateEvent(event);
        return result;
      } catch (err) {
        console.warn('Failed to update event via plugin:', err);
      }
    }
    
    // For mock implementation, update in our mock events
    const index = mockEvents.findIndex(e => e.id === event.id);
    if (index !== -1) {
      mockEvents[index] = event;
    } else {
      throw new Error(`Event with ID ${event.id} not found`);
    }
    
    // Return the updated event
    return event;
  },
  
  /**
   * Delete a calendar event
   * @param {string} eventId - The ID of the event to delete
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  async deleteEvent(eventId) {
    if (!eventId) {
      throw new Error('Event ID is required for deletion');
    }
    
    // Try to delete via plugin
    if (window.plugin && window.plugin.calendarEvents && window.plugin.calendarEvents.deleteEvent) {
      try {
        const result = await window.plugin.calendarEvents.deleteEvent(eventId);
        return result;
      } catch (err) {
        console.warn('Failed to delete event via plugin:', err);
      }
    }
    
    // For mock implementation, remove from our mock events
    const index = mockEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
      mockEvents.splice(index, 1);
      return true;
    } else {
      return false;
    }
  },
  
  /**
   * Mark an event as completed
   * @param {string} eventId - The ID of the event to mark as completed
   * @returns {Promise<Object>} - The updated event
   */
  async markEventComplete(eventId) {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    
    // Try to mark as completed via plugin
    if (window.plugin && window.plugin.calendarEvents && window.plugin.calendarEvents.markEventComplete) {
      try {
        const result = await window.plugin.calendarEvents.markEventComplete(eventId);
        return result;
      } catch (err) {
        console.warn('Failed to mark event as completed via plugin:', err);
      }
    }
    
    // For mock implementation, update in our mock events
    const index = mockEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
      mockEvents[index].completed = true;
      return mockEvents[index];
    } else {
      throw new Error(`Event with ID ${eventId} not found`);
    }
  }
};

export default calendarUtils;

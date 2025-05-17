/**
 * API Adapter 
 * Extends the original API service to support custom features
 * This adapter maintains backward compatibility while adding new endpoints
 */

import { api } from '../../data/api';

/**
 * Extends the core API with additional endpoints for custom features
 * while preserving compatibility with the original codebase
 */
class ApiAdapter {
  constructor() {
    // Preserve reference to original API
    this.coreApi = api;
    this.baseUrl = '/api';
    this.customApiEnabled = true;
  }

  /**
   * Get a value from either the original API or a default
   * @param {string} property - The property name to get from core API
   * @param {*} defaultValue - Default value if property doesn't exist
   * @returns {*} The value
   */
  getFromCoreApi(property, defaultValue) {
    if (this.coreApi && typeof this.coreApi[property] !== 'undefined') {
      return this.coreApi[property];
    }
    return defaultValue;
  }

  /**
   * Get the group name from the core API
   */
  get groupName() {
    return this.getFromCoreApi('groupName', '');
  }

  /**
   * Get the group token from the core API
   */
  get groupToken() {
    return this.getFromCoreApi('groupToken', '');
  }

  /**
   * Create an authenticated fetch request with proper headers
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} The fetch promise
   */
  authenticatedFetch(url, options = {}) {
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.groupToken}`
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  /**
   * Check if logged in using core API
   * @returns {Promise} Promise resolving to login status
   */
  amILoggedIn() {
    return this.coreApi.amILoggedIn();
  }

  /**
   * Set credentials using core API
   * @param {string} groupName - Group name
   * @param {string} groupToken - Group token
   */
  setCredentials(groupName, groupToken) {
    this.coreApi.setCredentials(groupName, groupToken);
  }

  /**
   * Clear credentials using core API
   */
  clearCredentials() {
    this.coreApi.clearCredentials();
  }

  // Custom feature endpoints

  /**
   * Slayer task endpoints
   */
  get slayerTaskUrl() {
    return `${this.baseUrl}/custom/slayer-tasks`;
  }

  /**
   * Valuable drops endpoints
   */
  get valuableDropsUrl() {
    return `${this.baseUrl}/custom/valuable-drops`;
  }

  /**
   * Group challenges endpoints
   */
  get groupChallengesUrl() {
    return `${this.baseUrl}/custom/group-challenges`;
  }

  /**
   * Group milestones endpoints
   */
  get groupMilestonesUrl() {
    return `${this.baseUrl}/custom/group-milestones`;
  }

  /**
   * Activities endpoints
   */
  get activitiesUrl() {
    return `${this.baseUrl}/custom/activities`;
  }

  /**
   * Shared calendar endpoints
   */
  get sharedCalendarUrl() {
    return `${this.baseUrl}/custom/calendar`;
  }

  /**
   * Boss strategy endpoints
   */
  get bossStrategyUrl() {
    return `${this.baseUrl}/custom/boss-strategy`;
  }

  /**
   * DPS Calculator endpoints
   */
  get dpsCalculatorUrl() {
    return `${this.baseUrl}/custom/dps-calculator`;
  }

  /**
   * Get extended collection log data
   * Combines data from original plugin and custom sources
   */
  getExtendedCollectionLog() {
    return this.authenticatedFetch(this.coreApi.collectionLogDataUrl())
      .then(response => response.json())
      .catch(error => {
        console.error('Error fetching collection log data:', error);
        return null;
      });
  }
}

// Create singleton instance
const apiAdapter = new ApiAdapter();

// Export the adapter
export { apiAdapter };
export default apiAdapter;

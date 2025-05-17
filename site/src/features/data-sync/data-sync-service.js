/**
 * Data Synchronization Service
 * 
 * Polls and consolidates player data from multiple sources:
 * 1. RuneLite plugin (primary source)
 * 2. OSRS Wiki (supplementary information)
 */

import wikiService from '../wiki-integration/wiki-service';
import { API_BASE_URL } from '../../config';
import groupChallengesService from '../group-challenges/group-challenges-service';
import { processPluginDrop, isItemValuable } from '../valuable-drops/valuable-drops-service';
import { store } from '../../store/store.js';
import { addNotification } from '../../store/actions/notificationActions.js';
import wiseOldManService from './wise-old-man-service';

// Global debug flag
const DEBUG = true;
const log = DEBUG ? (...args) => console.log('[data-sync-service]', ...args) : () => {};

// These are the events that the data sync service relies on
const REQUIRED_EVENTS = [
  'group-data-updated',
  'login-success',
  'logout',
  'collection-log-update',
  'bank-update'
];

/**
 * Service for synchronizing and consolidating player data from multiple sources
 */
class DataSyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncData = new Map(); // Map of player name to last sync data
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.wikiCache = new Map(); // Cache for wiki data
    this.previousPlayerData = new Map(); // Previous player data for change detection
    this.valuableDropThreshold = 50000; // Minimum value to consider an item as valuable
    this.initialized = false;
    this.sources = {
      plugin: { enabled: true, data: null },
      wiseOldMan: { enabled: true, data: null },
      wiki: { enabled: true, data: null }
    };
    this.eventListeners = [];
    this.pubsubInstance = null;

    // Find pubsub in the global scope or data module
    this.findPubsub();

    // Try to initialize immediately
    this.initialize();
    
    // Also try again after a delay to handle async loading
    setTimeout(() => {
      if (!this.initialized) this.initialize();
    }, 500);
  }

  /**
   * Find pubsub instance from original codebase
   */
  findPubsub() {
    try {
      // Try different sources for pubsub
      if (window.pubsub && typeof window.pubsub.subscribe === 'function') {
        this.pubsubInstance = window.pubsub;
        log('Found pubsub in window scope');
        return;
      }

      // Try to import from original location
      import('../../data/pubsub.js').then(module => {
        if (module && module.pubsub && typeof module.pubsub.subscribe === 'function') {
          this.pubsubInstance = module.pubsub;
          log('Imported pubsub from data/pubsub.js');
          this.setupPubSub();
        }
      }).catch(err => {
        log('Could not import pubsub:', err);
      });

    } catch (err) {
      log('Error finding pubsub:', err);
    }
  }

  /**
   * Initialize the data sync service
   */
  initialize() {
    if (this.initialized) {
      log('Data sync service already initialized');
      return;
    }

    log('Initializing data sync service');
    
    // Try to set up event listeners
    this.setupPubSub();
    
    // Set up Wise Old Man integration
    wiseOldManService.initialize();
    
    // Try to access the original groupData
    this.importGroupData();
    
    this.initialized = true;
    log('Data sync service initialized successfully');
  }

  /**
   * Import group data from original codebase
   */
  importGroupData() {
    try {
      // Try different methods to get group data
      const findGroupData = () => {
        if (window.groupData) return window.groupData;
        if (window.groupIronApp && window.groupIronApp.groupData) return window.groupIronApp.groupData;
        
        // Try global object properties
        const possibleContainers = [window, window.app, window.groupIronApp];
        for (const container of possibleContainers) {
          if (!container) continue;
          for (const key of Object.keys(container)) {
            const obj = container[key];
            if (obj && obj.members && typeof obj.members === 'object') {
              return obj;
            }
          }
        }
        
        return null;
      };
      
      const groupDataInstance = findGroupData();
      if (groupDataInstance) {
        log('Found group data instance', groupDataInstance);
        this.sources.plugin.data = groupDataInstance;
        this.notifyDataUpdate();
      } else {
        // Try to import from original location
        import('../../data/group-data.js').then(module => {
          if (module && module.groupData) {
            log('Imported group data from module');
            this.sources.plugin.data = module.groupData;
            this.notifyDataUpdate();
          }
        }).catch(err => {
          log('Could not import group data module:', err);
        });
      }
    } catch (err) {
      log('Error importing group data:', err);
    }
  }

  /**
   * Set up event listeners for the data sync service
   */
  setupPubSub() {
    // Check if pubsub is available
    if (!this.pubsubInstance) {
      // Try to find it again
      this.findPubsub();
      
      if (!this.pubsubInstance) {
        log('Failed to set up pubsub, will retry');
        setTimeout(() => this.setupPubSub(), 1000);
        return;
      }
    }

    const pubsub = this.pubsubInstance;

    // Subscribe to group data updates
    this.unsubscribeGroupData = pubsub.subscribe('group-data-updated', (data) => {
      log('Group data updated:', data ? Object.keys(data) : 'null');
      this.sources.plugin.data = data;
      this.notifyDataUpdate();
    });

    // Subscribe to login success
    this.unsubscribeLogin = pubsub.subscribe('login-success', (data) => {
      log('Login success:', data);
      this.fetchExternalData();
    });

    // Subscribe to logout
    this.unsubscribeLogout = pubsub.subscribe('logout', () => {
      log('Logout detected, clearing data');
      this.clearData();
    });
    
    // Subscribe to collection log updates if available
    try {
      this.unsubscribeCollectionLog = pubsub.subscribe('collection-log-update', () => {
        log('Collection log updated');
        this.fetchExternalData();
      });
    } catch (err) {
      log('Error subscribing to collection log updates:', err);
    }
  }

  /**
   * Fetch data from external sources
   */
  async fetchExternalData() {
    try {
      log('Fetching external data');
      const womData = await wiseOldManService.getGroupData();
      if (womData) {
        this.sources.wiseOldMan.data = womData;
        log('Updated WOM data');
      }
      this.notifyDataUpdate();
    } catch (error) {
      console.error('Error fetching external data:', error);
    }
  }

  /**
   * Notify all subscribers that data has been updated
   */
  notifyDataUpdate() {
    // Use pubsub if available
    if (this.pubsubInstance && typeof this.pubsubInstance.publish === 'function') {
      this.pubsubInstance.publish('multi-source-data-updated', this.getAllData());
    }
    
    // Also dispatch a DOM event for components not using pubsub
    try {
      const event = new CustomEvent('multi-source-data-updated', {
        bubbles: true,
        detail: this.getAllData()
      });
      document.dispatchEvent(event);
    } catch (err) {
      log('Error dispatching custom event:', err);
    }
  }

  /**
   * Get data for all members from all sources
   */
  getAllData() {
    return {
      sources: this.sources,
      members: this.getMergedMembers(),
      timestamp: Date.now()
    };
  }

  /**
   * Get a merged list of all members from all data sources
   */
  getMergedMembers() {
    // Start with plugin members if available
    const members = new Map();
    const pluginData = this.sources.plugin.data;
    const womData = this.sources.wiseOldMan.data;

    // Add members from plugin data
    if (pluginData && pluginData.members) {
      Object.entries(pluginData.members).forEach(([name, data]) => {
        members.set(name.toLowerCase(), {
          name,
          sources: { plugin: true },
          data: { plugin: data }
        });
      });
    }

    // Add or merge members from WOM data
    if (womData && womData.members) {
      womData.members.forEach(member => {
        const lowerName = member.username.toLowerCase();
        if (members.has(lowerName)) {
          // Merge with existing member
          const existing = members.get(lowerName);
          existing.sources.wiseOldMan = true;
          existing.data.wiseOldMan = member;
        } else {
          // Add new member
          members.set(lowerName, {
            name: member.username,
            sources: { wiseOldMan: true },
            data: { wiseOldMan: member }
          });
        }
      });
    }

    // Convert Map to array
    return Array.from(members.values());
  }

  /**
   * Get member data from all sources by name
   */
  getMemberData(memberName) {
    if (!memberName) return null;
    
    const lowerName = memberName.toLowerCase();
    const members = this.getMergedMembers();
    
    return members.find(m => m.name.toLowerCase() === lowerName) || null;
  }

  /**
   * Clear all data
   */
  clearData() {
    this.sources.plugin.data = null;
    this.sources.wiseOldMan.data = null;
    this.sources.wiki.data = null;
    this.notifyDataUpdate();
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    if (this.unsubscribeGroupData) this.unsubscribeGroupData();
    if (this.unsubscribeLogin) this.unsubscribeLogin();
    if (this.unsubscribeLogout) this.unsubscribeLogout();
    if (this.unsubscribeCollectionLog) this.unsubscribeCollectionLog();
  }

  /**
   * Check if a sync is currently in progress
   * @returns {boolean} - True if sync is in progress
   */
  isSyncInProgress() {
    return this.syncInProgress;
  }

  /**
   * Check if data for a player is currently cached and valid
   * @param {string} playerName - Name of the player
   * @returns {boolean} - True if cached data is available and valid
   */
  hasCachedData(playerName) {
    if (!this.lastSyncData.has(playerName)) {
      return false;
    }

    const syncData = this.lastSyncData.get(playerName);
    const currentTime = new Date().getTime();
    return (currentTime - syncData.timestamp) < this.cacheTimeout;
  }

  /**
   * Get cached data for a player if available
   * @param {string} playerName - Name of the player
   * @returns {Object|null} - Cached data or null if not available
   */
  getCachedData(playerName) {
    if (!this.hasCachedData(playerName)) {
      return null;
    }
    
    return this.lastSyncData.get(playerName).data;
  }

  /**
   * Sync data for a specific player
   * @param {string} playerName - Name of the player
   * @param {boolean} forceRefresh - Force refresh even if cached data is available
   * @returns {Promise<Object>} - Synchronized player data
   */
  async syncPlayerData(playerName, forceRefresh = false) {
    // Check if we have valid cached data
    if (!forceRefresh && this.hasCachedData(playerName)) {
      return this.getCachedData(playerName);
    }
    
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }
    
    this.syncInProgress = true;
    
    try {
      // 1. Get primary data from RuneLite plugin API
      const primaryData = await this.fetchPrimaryData(playerName);
      
      // 2. Enrich data with wiki information if available
      const enrichedData = await this.enrichWithWikiData(primaryData);
      
      // 3. Process the data for challenge and milestone updates
      await this.processPlayerUpdates(playerName, enrichedData);
      
      // 4. Detect and process valuable drops
      await this.detectValuableDrops(playerName, enrichedData);
      
      // Store previous data for change detection in future syncs
      this.previousPlayerData.set(playerName, {...enrichedData});
      
      // Cache the result
      this.lastSyncData.set(playerName, {
        data: enrichedData,
        timestamp: new Date().getTime()
      });
      
      return enrichedData;
    } catch (error) {
      console.error(`Error syncing data for ${playerName}:`, error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Sync data for an entire group
   * @param {Array<string>} playerNames - Array of player names in the group
   * @param {boolean} forceRefresh - Force refresh even if cached data is available
   * @returns {Promise<Object>} - Synchronized group data
   */
  async syncGroupData(playerNames, forceRefresh = false) {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }
    
    this.syncInProgress = true;
    
    try {
      const groupData = {
        members: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Process each player in parallel
      const memberPromises = playerNames.map(async (playerName) => {
        try {
          // Use cached data if available and not forcing refresh
          if (!forceRefresh && this.hasCachedData(playerName)) {
            return this.getCachedData(playerName);
          }
          
          // Otherwise fetch new data
          const primaryData = await this.fetchPrimaryData(playerName);
          const enrichedData = await this.enrichWithWikiData(primaryData);
          
          // Process the data for challenge and milestone updates
          await this.processPlayerUpdates(playerName, enrichedData);
          
          // Detect and process valuable drops
          await this.detectValuableDrops(playerName, enrichedData);
          
          // Store previous data for change detection in future syncs
          this.previousPlayerData.set(playerName, {...enrichedData});
          
          // Cache the result
          this.lastSyncData.set(playerName, {
            data: enrichedData,
            timestamp: new Date().getTime()
          });
          
          return enrichedData;
        } catch (error) {
          console.error(`Error syncing data for group member ${playerName}:`, error);
          // Return partial data if available, otherwise null
          return this.hasCachedData(playerName) 
            ? this.getCachedData(playerName) 
            : { playerName, error: error.message, partial: true };
        }
      });
      
      groupData.members = await Promise.all(memberPromises);
      
      return groupData;
    } catch (error) {
      console.error('Error syncing group data:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Fetch primary data from RuneLite plugin API
   * @param {string} playerName - Name of the player
   * @returns {Promise<Object>} - Player data from primary source
   */
  async fetchPrimaryData(playerName) {
    try {
      const response = await fetch(`${API_BASE_URL}/player/${playerName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player data: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching primary data for ${playerName}:`, error);
      throw error;
    }
  }
  
  /**
   * Enrich player data with information from OSRS Wiki
   * @param {Object} playerData - Player data from primary source
   * @returns {Promise<Object>} - Enriched player data
   */
  async enrichWithWikiData(playerData) {
    if (!playerData || !playerData.equipment) {
      return playerData;
    }
    
    const enrichedData = { ...playerData };
    
    try {
      // Process equipped items
      if (enrichedData.equipment && enrichedData.equipment.items) {
        const items = enrichedData.equipment.items;
        
        // Process each item in parallel
        const itemPromises = Object.entries(items).map(async ([slot, item]) => {
          if (item && item.id) {
            // Check if we have cached data for this item
            if (this.wikiCache.has(item.id)) {
              items[slot].wikiData = this.wikiCache.get(item.id);
            } else {
              // Fetch data from wiki service
              try {
                const wikiData = await wikiService.getItemData(item.id);
                if (wikiData) {
                  items[slot].wikiData = wikiData;
                  this.wikiCache.set(item.id, wikiData);
                }
              } catch (error) {
                console.warn(`Failed to fetch wiki data for item ${item.id}:`, error);
              }
            }
          }
          return [slot, items[slot]];
        });
        
        const processedItems = await Promise.all(itemPromises);
        enrichedData.equipment.items = Object.fromEntries(processedItems);
      }
      
      return enrichedData;
    } catch (error) {
      console.error('Error enriching data with wiki information:', error);
      return playerData; // Return original data if enrichment fails
    }
  }
  
  /**
   * Process player data updates for challenges and milestones
   * @param {string} playerName - Name of the player
   * @param {Object} playerData - Updated player data
   */
  async processPlayerUpdates(playerName, playerData) {
    if (!playerName || !playerData) return;
    
    try {
      // Auto-update challenges based on player data
      const updatedChallenges = await groupChallengesService.autoUpdateChallengeProgress(
        playerData,
        playerName
      );
      
      // If challenges were updated, show a notification
      if (updatedChallenges && updatedChallenges.length > 0) {
        store.dispatch(
          addNotification({
            id: `challenge-update-${Date.now()}`,
            type: 'info',
            title: 'Challenge Progress Updated',
            message: `Your progress on ${updatedChallenges.length} challenge(s) has been updated!`,
            autoDismiss: true
          })
        );
      }
      
      // Note: Milestone updates are handled server-side in authed.rs through auto_update_milestone_progress
      
    } catch (error) {
      console.error(`Error processing updates for ${playerName}:`, error);
    }
  }
  
  /**
   * Detect and process valuable drops by comparing current and previous player data
   * @param {string} playerName - Name of the player
   * @param {Object} currentData - Current player data
   */
  async detectValuableDrops(playerName, currentData) {
    // Skip if we don't have previous data for comparison
    if (!this.previousPlayerData.has(playerName) || !currentData) return;
    
    try {
      const previousData = this.previousPlayerData.get(playerName);
      
      // Check inventory for valuable items that weren't there before
      if (currentData.inventory && previousData.inventory) {
        const currentInventory = JSON.parse(currentData.inventory || '[]');
        const previousInventory = JSON.parse(previousData.inventory || '[]');
        
        // Find new items or items with increased quantity
        for (const currentItem of currentInventory) {
          if (!currentItem) continue;
          
          // Find same item in previous inventory
          const prevItem = previousInventory.find(item => item && item.id === currentItem.id);
          
          // If item is new or quantity increased
          if ((!prevItem || currentItem.quantity > prevItem.quantity) && 
              isItemValuable(currentItem, this.valuableDropThreshold)) {
            
            const newQuantity = prevItem ? (currentItem.quantity - prevItem.quantity) : currentItem.quantity;
            
            // Process as a valuable drop
            const dropData = {
              item_id: currentItem.id,
              item_name: currentItem.name,
              quantity: newQuantity,
              value: currentItem.price || 0,
              source: currentData.interacting || 'Unknown'
            };
            
            await processPluginDrop(
              {
                name: playerName,
                coordinates: JSON.parse(currentData.coordinates || '[0,0,0]'),
                interacting: currentData.interacting
              },
              dropData
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error detecting valuable drops for ${playerName}:`, error);
    }
  }

  /**
   * Set the value threshold for valuable drops
   * @param {number} value - New threshold value in GP
   */
  setValuableDropThreshold(value) {
    if (typeof value === 'number' && value > 0) {
      this.valuableDropThreshold = value;
    }
  }
}

// Create a singleton instance
const dataSyncService = new DataSyncService();
dataSyncService.initialize();
export default dataSyncService;

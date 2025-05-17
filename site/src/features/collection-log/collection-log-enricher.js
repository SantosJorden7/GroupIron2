/**
 * Collection Log Data Enricher
 * 
 * Enhances the collection log with additional data sources without modifying the UI.
 * Acts as a middleware between RuneLite plugin data and the collection log service.
 */

import { pubsub } from "../../data/pubsub";
import collectionLogService from './collection-log-service';

class CollectionLogEnricher {
  constructor() {
    this.initialized = false;
    this.sources = {
      // Additional data sources like API endpoints
      wikiItemDatabase: "https://prices.runescape.wiki/api/v1/osrs/mapping",
      externalLogData: [], // Will be populated from additional sources
      lastUpdated: null
    };
  }

  /**
   * Initialize the enricher and set up event subscriptions
   */
  initialize() {
    if (this.initialized) return;
    
    console.log('Initializing Collection Log Enricher...');
    
    // Subscribe to collection log updates from plugin
    pubsub.subscribe("collection-log-updated", (data) => {
      this.enhanceLogData(data);
    });
    
    // Subscribe to group data updates to check for new members or changes
    pubsub.subscribe("group-data-updated", () => {
      this.refreshAdditionalData();
    });
    
    this.initialized = true;
    this.refreshAdditionalData();
    
    console.log('Collection Log Enricher initialized');
  }
  
  /**
   * Enhance collection log data with additional information
   * @param {Object} logData - The original collection log data
   */
  async enhanceLogData(logData) {
    if (!logData) return;
    
    try {
      console.log('Enhancing collection log data with additional sources...');
      
      // 1. Add more detailed item information
      const enhancedItems = await this.enrichItemInformation(logData.items || []);
      
      // 2. Add additional categories or tabs if needed
      const enhancedCategories = this.enhanceCategories(logData.categories || []);
      
      // 3. Create the enhanced data object
      const enhancedData = {
        ...logData,
        items: enhancedItems,
        categories: enhancedCategories,
        metadata: {
          ...logData.metadata,
          enriched: true,
          enrichmentSource: "CollectionLogEnricher",
          enrichmentTimestamp: new Date().toISOString()
        }
      };
      
      // 4. Update the collection log service with enhanced data
      collectionLogService.updateLogData(enhancedData);
      
      // 5. Publish event to inform UI components
      pubsub.publish("collection-log-enriched", {
        originalSize: logData.items?.length || 0,
        enhancedSize: enhancedItems.length,
        newCategories: enhancedCategories.filter(c => 
          !(logData.categories || []).some(oc => oc.id === c.id)
        ).length
      });
      
      console.log('Collection log data enhanced');
      
    } catch (error) {
      console.error('Error enhancing collection log data:', error);
    }
  }
  
  /**
   * Enrich item information with additional details
   * @param {Array} items - The original collection log items
   * @returns {Array} - Enhanced collection log items
   */
  async enrichItemInformation(items) {
    try {
      // Start with the original items
      let enhancedItems = [...items];
      
      // Add community drop rate data where available
      enhancedItems = enhancedItems.map(item => {
        const communityData = this.getCommunityDropRateData(item.id);
        if (communityData) {
          return {
            ...item,
            communityData,
            enriched: true
          };
        }
        return item;
      });
      
      // Add additional items that might be missing from the original data
      if (this.sources.externalLogData.length > 0) {
        const existingIds = new Set(enhancedItems.map(item => item.id));
        const additionalItems = this.sources.externalLogData
          .filter(item => !existingIds.has(item.id))
          .map(item => ({
            ...item,
            source: 'external',
            enriched: true
          }));
        
        enhancedItems = [...enhancedItems, ...additionalItems];
      }
      
      return enhancedItems;
    } catch (error) {
      console.error('Error enriching item information:', error);
      return items; // Return original items if enhancement fails
    }
  }
  
  /**
   * Enhance categories with additional information
   * @param {Array} categories - The original collection log categories
   * @returns {Array} - Enhanced collection log categories
   */
  enhanceCategories(categories) {
    try {
      // Start with the original categories
      let enhancedCategories = [...categories];
      
      // Add custom categories if needed
      const customCategories = this.getCustomCategories();
      
      // Only add categories that don't already exist
      const existingCategoryIds = new Set(enhancedCategories.map(c => c.id));
      const newCategories = customCategories.filter(c => !existingCategoryIds.has(c.id));
      
      enhancedCategories = [...enhancedCategories, ...newCategories];
      
      return enhancedCategories;
    } catch (error) {
      console.error('Error enhancing categories:', error);
      return categories; // Return original categories if enhancement fails
    }
  }
  
  /**
   * Get community-sourced drop rate data for an item
   * @param {number} itemId - The item ID
   * @returns {Object|null} - Drop rate data or null if not found
   */
  getCommunityDropRateData(itemId) {
    // Mock implementation - in a real scenario, this would come from a database or API
    const dropRateData = {
      // Key items with verified drop rates
      11838: { // Dragon Warhammer
        dropRate: "1/5000",
        averageKillsNeeded: 5000,
        source: "OSRS Wiki"
      },
      12019: { // Tanzanite Fang
        dropRate: "1/512",
        averageKillsNeeded: 512,
        source: "OSRS Wiki"
      },
      12073: { // Abyssal Whip
        dropRate: "1/512",
        averageKillsNeeded: 512,
        source: "OSRS Wiki"
      },
      13652: { // Dragon Claws
        dropRate: "1/378 (Raids)",
        averageKillsNeeded: 378,
        source: "OSRS Wiki"
      },
      // Add more common collection log items here
    };
    
    return dropRateData[itemId] || null;
  }
  
  /**
   * Get custom categories for the collection log
   * @returns {Array} - Custom collection log categories
   */
  getCustomCategories() {
    // Mock custom categories - in a real scenario, these would be defined elsewhere
    return [
      {
        id: "group_milestone_drops",
        name: "Group Milestones",
        description: "Special drops achieved by the group",
        source: "custom",
        items: [] // Would be populated dynamically
      },
      {
        id: "valuable_drops",
        name: "Valuable Drops",
        description: "High-value items obtained by the group",
        source: "custom",
        items: [] // Would be populated dynamically
      }
    ];
  }
  
  /**
   * Refresh additional data from external sources
   */
  async refreshAdditionalData() {
    try {
      console.log('Refreshing additional collection log data...');
      
      // Mock external data loading - in a real implementation, this would fetch from APIs
      // Simulating a 1 second delay to mimic API call
      setTimeout(() => {
        this.sources.externalLogData = [
          // These would be real items from external APIs
          {
            id: 20000, // Made-up ID for example
            name: "Group Challenge Reward",
            obtained: false,
            quantity: 0,
            categoryId: "group_milestone_drops",
            imageUrl: "",
            source: "external"
          },
          {
            id: 20001, // Made-up ID for example
            name: "Group Ironman Trophy",
            obtained: false,
            quantity: 0,
            categoryId: "group_milestone_drops",
            imageUrl: "",
            source: "external"
          }
        ];
        
        this.sources.lastUpdated = new Date();
        
        console.log('Additional collection log data refreshed');
        
        // Notify the service that we have new external data
        pubsub.publish("external-log-data-updated", {
          itemCount: this.sources.externalLogData.length,
          source: "CollectionLogEnricher",
          timestamp: this.sources.lastUpdated
        });
        
      }, 1000);
      
    } catch (error) {
      console.error('Error refreshing additional data:', error);
    }
  }
}

// Create a singleton instance
const collectionLogEnricher = new CollectionLogEnricher();

// Export the singleton instance
export default collectionLogEnricher;

// Auto-initialize when loaded in browser context
if (typeof window !== 'undefined') {
  // Wait for DOM content to be loaded
  window.addEventListener('DOMContentLoaded', () => {
    collectionLogEnricher.initialize();
  });
}

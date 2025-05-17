/**
 * Wiki Service
 * 
 * Provides integration with the OSRS Wiki API, fetching data about items, quests, skills, and more.
 * Includes a caching mechanism to minimize API calls and improve performance.
 */

// Try to use the existing axios instance, fall back to direct import if needed
let axios;
try {
  // First try to get axios from window object
  if (typeof window !== 'undefined' && window.axios) {
    axios = window.axios;
  } else {
    // Try to import from original codebase
    import('../../utils/axios-instance').then(module => {
      axios = module.default || module;
    }).catch(() => {
      // Direct import as fallback
      import('axios').then(module => {
        axios = module.default || module;
      }).catch(err => {
        console.error('Could not import axios:', err);
        // Final fallback: create a minimal fetch wrapper
        axios = {
          get: async (url, options = {}) => {
            const response = await fetch(url, options);
            return { data: await response.json() };
          }
        };
      });
    });
  }
} catch (err) {
  console.error('Error setting up axios:', err);
  // Create minimal fetch wrapper
  axios = {
    get: async (url, options = {}) => {
      const response = await fetch(url, options);
      return { data: await response.json() };
    }
  };
}

class WikiService {
  constructor() {
    this.initialized = false;
    this.cache = {
      items: {},
      quests: {},
      skills: {},
      bosses: {}
    };
    this.baseUrl = 'https://oldschool.runescape.wiki/api.php';
    this.priceUrl = 'https://prices.runescape.wiki/api/v1/osrs';
    this.lastUpdate = null;
    
    // Try to initialize immediately
    this.initialize();
  }

  /**
   * Initialize the Wiki Service
   */
  async initialize() {
    if (this.initialized) {
      console.log('Wiki service already initialized');
      return true;
    }

    console.log('Initializing Wiki service');
    
    try {
      // Load cached data if available
      this.loadFromLocalStorage();
      
      // Fetch initial data if cache is empty or old
      if (Object.keys(this.cache.items).length === 0 || 
          (this.lastUpdate && Date.now() - this.lastUpdate > 12 * 60 * 60 * 1000)) {
        await this.refreshItemPrices();
      }
      
      this.initialized = true;
      console.log('Wiki service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Wiki service:', error);
      return false;
    }
  }

  /**
   * Load cached data from localStorage
   */
  loadFromLocalStorage() {
    try {
      const savedCache = localStorage.getItem('wiki-service-cache');
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache);
        // Check if the cache is still valid (less than 24 hours old)
        if (parsedCache.timestamp && Date.now() - parsedCache.timestamp < 24 * 60 * 60 * 1000) {
          this.cache = parsedCache.data || this.cache;
          this.lastUpdate = parsedCache.timestamp;
          console.log('Loaded Wiki cache from localStorage');
        }
      }
    } catch (error) {
      console.warn('Error loading Wiki cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  saveToLocalStorage() {
    try {
      const timestamp = Date.now();
      const cacheData = {
        timestamp,
        data: this.cache
      };
      localStorage.setItem('wiki-service-cache', JSON.stringify(cacheData));
      this.lastUpdate = timestamp;
    } catch (error) {
      console.warn('Error saving Wiki cache:', error);
    }
  }

  /**
   * Get items from cache or API
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Object} Items data
   */
  async getItems(forceRefresh = false) {
    if (!forceRefresh && Object.keys(this.cache.items).length > 0) {
      return this.cache.items;
    }

    // Try to fetch from API or use default cache
    try {
      await this.refreshItemPrices();
      return this.cache.items;
    } catch (error) {
      console.error('Error fetching items:', error);
      return this.cache.items;
    }
  }

  /**
   * Refresh item prices from the OSRS Wiki API
   */
  async refreshItemPrices() {
    try {
      console.log('Fetching item prices from OSRS Wiki API');
      
      // Ensure axios is available
      if (!axios || typeof axios.get !== 'function') {
        console.error('Axios not available for wiki API call');
        return false;
      }
      
      // Fetch latest prices
      const response = await axios.get(`${this.priceUrl}/latest`);
      
      if (response.data && response.data.data) {
        // Process the price data
        Object.entries(response.data.data).forEach(([itemId, priceData]) => {
          const id = parseInt(itemId, 10);
          this.cache.items[id] = {
            ...this.cache.items[id],
            id,
            price: priceData.high || priceData.low || 0,
            highPrice: priceData.high || 0,
            lowPrice: priceData.low || 0,
            updated: Date.now()
          };
        });
        
        // Save to localStorage
        this.saveToLocalStorage();
        console.log(`Cached ${Object.keys(this.cache.items).length} items`);
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing item prices:', error);
      return false;
    }
  }
  
  /**
   * Get item details by ID
   * @param {number} itemId - Item ID to fetch
   * @returns {Object|null} Item data or null if not found
   */
  getItem(itemId) {
    return this.cache.items[itemId] || null;
  }
  
  /**
   * Get item price by ID
   * @param {number} itemId - Item ID to fetch price for
   * @returns {number} Item price (or 0 if not found)
   */
  getItemPrice(itemId) {
    const item = this.getItem(itemId);
    return item ? item.price || 0 : 0;
  }
  
  /**
   * Get quests data
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Object} Quests data
   */
  async getQuests(forceRefresh = false) {
    if (!forceRefresh && Object.keys(this.cache.quests).length > 0) {
      return this.cache.quests;
    }
    
    // For now, return empty object as we haven't implemented quest fetching yet
    return {};
  }
  
  /**
   * Get skills data
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Object} Skills data
   */
  async getSkills(forceRefresh = false) {
    if (!forceRefresh && Object.keys(this.cache.skills).length > 0) {
      return this.cache.skills;
    }
    
    // For now, return empty object as we haven't implemented skills fetching yet
    return {};
  }
  
  /**
   * Get bosses data
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Object} Bosses data
   */
  async getBosses(forceRefresh = false) {
    if (!forceRefresh && Object.keys(this.cache.bosses).length > 0) {
      return this.cache.bosses;
    }
    
    // For now, return empty object as we haven't implemented bosses fetching yet
    return {};
  }
}

// Create singleton instance
export const wikiService = new WikiService();

// Export for direct use
export default wikiService;

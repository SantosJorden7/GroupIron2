/**
 * Features Integration Module
 * 
 * This file provides the integration layer between custom features and the original
 * Group Ironmen codebase. It uses the same custom element patterns as the original code
 * to ensure consistency and compatibility.
 */

import { pubsub } from '../data/pubsub';
import { BaseElement } from '../base-element/base-element';
import { router } from '../router';

/**
 * Shared CSS Variables - ensures all custom panels match the original site's styling
 */
const SHARED_STYLES = `
  :root {
    /* Match the original site's CSS variables */
    --panel-border: 2px solid var(--border-color);
    --panel-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    --panel-radius: 4px;
    --panel-padding: 16px;
    --item-spacing: 8px;
  }
  
  /* Core panel styles */
  .rs-panel {
    background-color: var(--background);
    border: var(--panel-border);
    border-radius: var(--panel-radius);
    box-shadow: var(--panel-shadow);
    margin-bottom: 16px;
    overflow: hidden;
  }
  
  .rs-panel-header {
    background-color: var(--header-bg);
    padding: 8px 16px;
    font-family: rsbold, 'RuneScape Bold', sans-serif;
    font-size: 18px;
    color: var(--header-text);
    border-bottom: 1px solid var(--border-color);
  }
  
  .rs-panel-content {
    padding: var(--panel-padding);
    font-family: rssmall, 'RuneScape Small', sans-serif;
    font-size: 14px;
    color: var(--primary-text);
  }
  
  /* OSRS-style button */
  .rs-button {
    background-color: var(--button-bg);
    border: 1px solid var(--button-border);
    border-radius: 2px;
    color: var(--button-text);
    cursor: pointer;
    font-family: rssmall, 'RuneScape Small', sans-serif;
    font-size: 14px;
    padding: 4px 12px;
    text-align: center;
    text-decoration: none;
    transition: background-color 0.2s;
  }
  
  .rs-button:hover {
    background-color: var(--button-hover-bg);
  }
  
  /* Badge styles matching the original */
  .rs-badge {
    background-color: var(--badge-bg);
    border-radius: 9999px;
    color: var(--badge-text);
    display: inline-block;
    font-family: rssmall, 'RuneScape Small', sans-serif;
    font-size: 12px;
    padding: 2px 8px;
    margin: 0 4px;
  }
  
  /* Data source indicators */
  .data-source {
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
  
  .data-source.plugin {
    background-color: var(--source-plugin-bg, #4a934a);
    color: var(--source-plugin-text, white);
  }
  
  .data-source.wom {
    background-color: var(--source-wom-bg, #3a67a8);
    color: var(--source-wom-text, white);
  }
  
  .data-source.wiki {
    background-color: var(--source-wiki-bg, #a83a3a);
    color: var(--source-wiki-text, white);
  }
`;

/**
 * Initialize all features and ensure they're properly integrated
 * with the original codebase's structure
 */
export function initializeFeatures() {
  console.log('Initializing custom features integration...');
  
  try {
    // 1. Inject shared styles for consistent UI
    injectSharedStyles();
    
    // 2. Register all custom panels
    registerCustomPanels();
    
    // 3. Set up route handlers for custom panels
    setupCustomRoutes();
    
    // 4. Publish initialization event
    if (typeof pubsub !== 'undefined' && pubsub.publish) {
      pubsub.publish('custom-features-initialized', { timestamp: Date.now() });
    }
    
    console.log('Custom features successfully integrated');
    return true;
  } catch (error) {
    console.error('Error initializing custom features:', error);
    return false;
  }
}

/**
 * Create and inject shared styles element
 */
function injectSharedStyles() {
  if (document.getElementById('custom-features-styles')) {
    return; // Already injected
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'custom-features-styles';
  styleElement.textContent = SHARED_STYLES;
  document.head.appendChild(styleElement);
  
  console.log('Injected shared styles for custom features');
}

/**
 * Set up route handlers for custom panels
 */
function setupCustomRoutes() {
  // Define panel types that match our custom panels
  const CUSTOM_PANEL_TYPES = [
    'slayer-tasks',
    'valuable-drops', 
    'group-challenges',
    'group-milestones',
    'shared-calendar',
    'activities',
    'boss-strategy',
    'dps-calculator',
    'collection-log-custom'
  ];
  
  try {
    // Connect with the router from the original codebase
    import('../router').then(module => {
      const router = module.router;
      
      if (!router || typeof router.register !== 'function') {
        console.warn('Router not available, custom panel routes will not be registered');
        return;
      }
      
      // Register routes for each custom panel
      CUSTOM_PANEL_TYPES.forEach(panelType => {
        const path = `/panel/${panelType}`;
        
        // Create a route handler that shows the panel
        const routeHandler = {
          path,
          enable: () => {
            console.log(`Enabling custom panel route: ${path}`);
            showCustomPanel(panelType);
          },
          disable: () => {
            console.log(`Disabling custom panel route: ${path}`);
            hideCustomPanel(panelType);
          }
        };
        
        // Register the route
        router.register(path, routeHandler);
      });
      
      console.log('Custom panel routes registered successfully');
    }).catch(err => {
      console.error('Error importing router module:', err);
    });
  } catch (error) {
    console.error('Error setting up custom routes:', error);
  }
}

/**
 * Show a custom panel by type
 */
function showCustomPanel(panelType) {
  try {
    // Find the panel container
    const panelsContainer = document.getElementById('panels-container') || 
                          document.querySelector('.panels-container');
    
    if (!panelsContainer) {
      console.error('Panels container not found');
      return false;
    }
    
    // Check if panel already exists
    let panel = document.getElementById(`panel-${panelType}`);
    
    // If the panel doesn't exist, create it
    if (!panel) {
      panel = document.createElement('div');
      panel.id = `panel-${panelType}`;
      panel.className = 'panel custom-panel';
      panel.dataset.panelType = panelType;
      panelsContainer.appendChild(panel);
    }
    
    // Show the panel
    panel.style.display = 'block';
    
    // Mark it as active in navigation
    const navItems = document.querySelectorAll('[data-panel-type]');
    navItems.forEach(item => {
      if (item.dataset.panelType === panelType) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error showing custom panel ${panelType}:`, error);
    return false;
  }
}

/**
 * Hide a custom panel by type
 */
function hideCustomPanel(panelType) {
  try {
    const panel = document.getElementById(`panel-${panelType}`);
    if (panel) {
      panel.style.display = 'none';
    }
    
    // Remove active class from navigation
    const navItems = document.querySelectorAll('[data-panel-type]');
    navItems.forEach(item => {
      if (item.dataset.panelType === panelType) {
        item.classList.remove('active');
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error hiding custom panel ${panelType}:`, error);
    return false;
  }
}

// Initialize immediately when this module is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeFeatures, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeFeatures, 100);
    });
  }
  
  // Also initialize when the window loads as a fallback
  window.addEventListener('load', () => {
    if (!window.customFeaturesInitialized) {
      console.log('Window loaded, initializing custom features...');
      initializeFeatures();
    }
  });
}

export default {
  initializeFeatures,
  injectSharedStyles,
  setupCustomRoutes
};

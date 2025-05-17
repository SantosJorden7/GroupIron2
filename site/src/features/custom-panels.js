/**
 * Custom Panels Registration
 * 
 * This module registers all custom panels with the panels page
 * following the original codebase's custom elements pattern.
 */

import { BaseElement } from '../base-element/base-element';
import { router } from '../router';
import { pubsub } from '../data/pubsub';

/**
 * Panel definitions for our custom features
 */
const PANEL_DEFINITIONS = [
  { 
    id: 'slayer-tasks',
    name: 'Slayer Tasks',
    icon: '🗡️',
    description: 'Track group slayer tasks and progress',
    route: '/panel/slayer-tasks',
    component: 'slayer-tasks-panel'
  },
  { 
    id: 'valuable-drops',
    name: 'Valuable Drops',
    icon: '💎',
    description: 'Log valuable item drops from all group members',
    route: '/panel/valuable-drops',
    component: 'valuable-drops-panel'
  },
  {
    id: 'group-challenges',
    name: 'Challenges',
    icon: '🏆',
    description: 'Create and track group challenges',
    route: '/panel/group-challenges',
    component: 'group-challenges-panel'
  },
  {
    id: 'group-milestones',
    name: 'Milestones',
    icon: '✨',
    description: 'Track important group milestones',
    route: '/panel/group-milestones',
    component: 'group-milestones-panel'
  },
  {
    id: 'shared-calendar',
    name: 'Calendar',
    icon: '📅',
    description: 'Group event calendar and scheduling',
    route: '/panel/shared-calendar',
    component: 'shared-calendar-panel'
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: '📋',
    description: 'Recent group activities and events',
    route: '/panel/activities',
    component: 'activities-panel'
  },
  {
    id: 'boss-strategy',
    name: 'Boss Strategies',
    icon: '👑',
    description: 'Shared boss strategies and gear setups',
    route: '/panel/boss-strategy',
    component: 'boss-strategy-panel'
  },
  {
    id: 'dps-calculator',
    name: 'DPS Calculator',
    icon: '📊',
    description: 'Calculate and compare DPS for different gear setups',
    route: '/panel/dps-calculator',
    component: 'dps-calculator-panel'
  },
  {
    id: 'wiki-integration',
    name: 'Wiki Lookup',
    icon: '📚',
    description: 'Integrated OSRS wiki item and quest information',
    route: '/panel/wiki-integration',
    component: 'wiki-integration-panel'
  },
  {
    id: 'collection-log-custom',
    name: 'Collection Log+',
    icon: '📒',
    description: 'Enhanced collection log with additional features',
    route: '/panel/collection-log-custom',
    component: 'collection-log-panel'
  }
];

/**
 * Base Panel Route Handler
 * Creates a route handler for panel components
 */
class PanelRouteHandler {
  constructor(panelDef) {
    this.panelDef = panelDef;
    this.path = panelDef.route;
    this.active = false;
  }

  enable() {
    console.log(`Enabling panel route: ${this.path}`);
    
    if (this.active) return;
    this.active = true;
    
    // Find panels container
    const panelsContainer = document.querySelector('.panels-container');
    if (!panelsContainer) {
      console.warn('No panels container found');
      return;
    }
    
    // Create and add panel element if it doesn't exist
    let panel = document.getElementById(`panel-${this.panelDef.id}`);
    if (!panel) {
      panel = document.createElement(this.panelDef.component);
      panel.id = `panel-${this.panelDef.id}`;
      panel.className = 'panel';
      panelsContainer.appendChild(panel);
    }
    
    // Make sure it's visible
    panel.style.display = 'block';
    
    // Notify listeners that panel was shown
    pubsub.publish('panel-shown', { 
      id: this.panelDef.id,
      name: this.panelDef.name,
      timestamp: Date.now()
    });
  }

  disable() {
    console.log(`Disabling panel route: ${this.path}`);
    
    if (!this.active) return;
    this.active = false;
    
    // Hide the panel
    const panel = document.getElementById(`panel-${this.panelDef.id}`);
    if (panel) {
      panel.style.display = 'none';
    }
  }
}

/**
 * Custom Panels Registration
 * Handles registering all panels with the router
 */
export class CustomPanels extends BaseElement {
  constructor() {
    super();
    this.routeHandlers = [];
  }

  html() {
    return `<div class="custom-panels"></div>`;
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('Registering custom panels...');
    
    this.registerPanels();
    this.injectPanelStyles();
    this.updatePanelsPage();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('Unregistering custom panels...');
    
    this.unregisterPanels();
  }
  
  /**
   * Register all panels with the router
   */
  registerPanels() {
    PANEL_DEFINITIONS.forEach(panelDef => {
      try {
        const handler = new PanelRouteHandler(panelDef);
        router.register(panelDef.route, handler);
        this.routeHandlers.push(handler);
        
        console.log(`Registered panel route: ${panelDef.route}`);
      } catch (error) {
        console.error(`Error registering panel ${panelDef.id}:`, error);
      }
    });
  }
  
  /**
   * Unregister all panels
   */
  unregisterPanels() {
    PANEL_DEFINITIONS.forEach(panelDef => {
      try {
        router.unregister(panelDef.route);
      } catch (error) {
        console.error(`Error unregistering panel ${panelDef.id}:`, error);
      }
    });
  }
  
  /**
   * Inject custom panel styles
   */
  injectPanelStyles() {
    // Check if styles already exist
    if (document.getElementById('custom-panels-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'custom-panels-styles';
    style.textContent = `
      /* Custom panel styles matching the original site */
      .panel {
        background-color: var(--background);
        border: 2px solid var(--border-color);
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        margin-bottom: 16px;
        overflow: hidden;
        display: none;
      }
      
      .panel-header {
        background-color: var(--header-bg);
        padding: 8px 16px;
        font-family: rsbold, 'RuneScape Bold', sans-serif;
        font-size: 18px;
        color: var(--header-text);
        border-bottom: 1px solid var(--border-color);
      }
      
      .panel-content {
        padding: 16px;
        font-family: rssmall, 'RuneScape Small', sans-serif;
        font-size: 14px;
        color: var(--primary-text);
      }

      /* Source indicators */
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
        background-color: #4a934a;
        color: white;
      }
      
      .data-source.wom {
        background-color: #3a67a8;
        color: white;
      }
      
      .data-source.wiki {
        background-color: #a83a3a;
        color: white;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Update panels page to include our custom panels
   */
  updatePanelsPage() {
    // Wait a bit for panels-page to load
    setTimeout(() => {
      try {
        const panelsPage = document.querySelector('panels-page');
        if (!panelsPage) {
          console.warn('No panels-page found, trying again in 1s');
          setTimeout(() => this.updatePanelsPage(), 1000);
          return;
        }
        
        // Find or create the panel links container
        let panelLinks = panelsPage.querySelector('.panel-links');
        if (!panelLinks) {
          const panelsPageContent = panelsPage.querySelector('.panels-page-content');
          if (panelsPageContent) {
            panelLinks = document.createElement('div');
            panelLinks.className = 'panel-links';
            panelLinks.innerHTML = '<h3>Custom Panels</h3>';
            panelsPageContent.appendChild(panelLinks);
          }
        }
        
        if (panelLinks) {
          // Add links for each panel
          PANEL_DEFINITIONS.forEach(panelDef => {
            const link = document.createElement('a');
            link.href = panelDef.route;
            link.className = 'panel-link';
            link.innerHTML = `
              <div class="panel-link-icon">${panelDef.icon}</div>
              <div class="panel-link-name">${panelDef.name}</div>
              <div class="panel-link-description">${panelDef.description}</div>
            `;
            panelLinks.appendChild(link);
          });
        }
      } catch (error) {
        console.error('Error updating panels page:', error);
      }
    }, 500);
  }
}

// Register the custom element
customElements.define('custom-panels', CustomPanels);

/**
 * Initialize panels registration
 */
export function initializeCustomPanels() {
  try {
    // Create instance if it doesn't exist
    if (!document.querySelector('custom-panels')) {
      const panels = document.createElement('custom-panels');
      document.body.appendChild(panels);
    }
    return true;
  } catch (error) {
    console.error('Error initializing custom panels:', error);
    return false;
  }
}

// Export for direct use
export default {
  initializeCustomPanels,
  panelDefinitions: PANEL_DEFINITIONS
};

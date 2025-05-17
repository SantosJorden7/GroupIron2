/**
 * Panel Registration System
 * Registers all custom panels with the site's routing system
 * No React components - using native Web Components only
 */

// Import panel modules - this ensures they're registered as custom elements
import "../slayer-tasks-panel/slayer-tasks-panel.js";
import "../activities-panel/activities-panel.js";
import "../group-challenges-panel/group-challenges-panel.js";
import "../valuable-drops-panel/valuable-drops-panel.js";

// Import the collection log enricher to enhance collection log data
import "../features/collection-log/collection-log-enricher.js";

// Panel configuration data
export const panelConfig = [
  {
    id: "slayer-tasks",
    title: "Slayer Tasks",
    icon: "☠️",
    elementTag: "slayer-tasks-panel",
    defaultView: "panel", // panel or main
    displayOrder: 5 // Order in the panel list
  },
  {
    id: "activities",
    title: "Activities",
    icon: "📋",
    elementTag: "activities-panel",
    defaultView: "panel",
    displayOrder: 6
  },
  {
    id: "group-challenges",
    title: "Group Challenges",
    icon: "🏆",
    elementTag: "group-challenges-panel",
    defaultView: "panel",
    displayOrder: 7
  },
  {
    id: "valuable-drops",
    title: "Valuable Drops",
    icon: "💎",
    elementTag: "valuable-drops-panel",
    defaultView: "panel",
    displayOrder: 8
  }
  // Additional panels would be registered here
];

/**
 * Register panels with the main site's panel system
 * @param {Object} siteRouter - The router instance from the main app
 */
export function registerPanels(siteRouter) {
  if (!siteRouter) {
    console.error("Site router not found, cannot register panels");
    return;
  }

  // Register each panel with the router
  panelConfig.forEach(panel => {
    siteRouter.registerPanel({
      id: panel.id,
      title: panel.title,
      icon: panel.icon,
      elementTag: panel.elementTag,
      defaultView: panel.defaultView || "panel",
      displayOrder: panel.displayOrder || 99
    });
  });

  console.log("Custom panels registered successfully");
}

/**
 * Initialize the panel system
 * To be called from the main app initialization
 */
export function initializePanels() {
  // Subscribe to the router-ready event to register panels
  window.pubsub.subscribe("router-ready", (router) => {
    registerPanels(router);
  });
  
  console.log("Panel registration system initialized");
}

// Auto-initialize if in browser context
if (typeof window !== 'undefined') {
  // Wait for DOM content to be loaded
  window.addEventListener('DOMContentLoaded', () => {
    initializePanels();
  });
}

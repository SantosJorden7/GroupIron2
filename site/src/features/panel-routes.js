/**
 * Panel Routes
 * 
 * This file defines routes for custom panels to integrate with the main application
 * using the same approach as the original codebase.
 */

import { router } from '../router';

/**
 * Register a panel route
 * @param {string} routePath - Route path (e.g. /panel/slayer-tasks)
 * @param {string} panelElement - Custom element tag name to create
 */
export function registerPanelRoute(routePath, panelElement) {
  // Create a route handler
  const routeHandler = {
    path: routePath,
    
    // When route is activated
    enable() {
      console.log(`Enabling route: ${routePath}`);
      
      // Get the main panels container
      const panelsContainer = document.querySelector('.panels-container');
      if (!panelsContainer) {
        console.warn('No panels container found');
        return;
      }
      
      // Check if panel already exists
      let panel = document.getElementById(`panel-${panelElement}`);
      
      // Create it if it doesn't exist
      if (!panel) {
        panel = document.createElement(panelElement);
        panel.id = `panel-${panelElement}`;
        panel.classList.add('panel');
        panelsContainer.appendChild(panel);
      }
      
      // Make panel visible
      panel.style.display = 'block';
    },
    
    // When route is deactivated
    disable() {
      console.log(`Disabling route: ${routePath}`);
      
      // Hide the panel
      const panel = document.getElementById(`panel-${panelElement}`);
      if (panel) {
        panel.style.display = 'none';
      }
    }
  };
  
  // Register the route
  router.register(routePath, routeHandler);
  console.log(`Registered route: ${routePath}`);
}

/**
 * Register a panel link in the panels page
 * @param {string} name - Display name
 * @param {string} route - Route path
 * @param {string} icon - Icon character or emoji
 * @param {string} description - Panel description
 */
export function registerPanelLink(name, route, icon, description) {
  // We'll add this to the DOM when panels page is loaded
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const panelsPage = document.querySelector('panels-page');
      if (!panelsPage) {
        console.warn('panels-page not found for adding panel link');
        return;
      }
      
      // Find or create panel links container
      let linksContainer = panelsPage.querySelector('.panel-links');
      if (!linksContainer) {
        const panelsContent = panelsPage.querySelector('.panels-page-content');
        if (panelsContent) {
          linksContainer = document.createElement('div');
          linksContainer.className = 'panel-links';
          linksContainer.innerHTML = '<h3>Custom Panels</h3>';
          panelsContent.appendChild(linksContainer);
        } else {
          console.warn('panels-page-content not found');
          return;
        }
      }
      
      // Create and add link
      const link = document.createElement('a');
      link.className = 'panel-link';
      link.href = route;
      link.innerHTML = `
        <div class="panel-link-icon">${icon}</div>
        <div class="panel-link-info">
          <div class="panel-link-name">${name}</div>
          <div class="panel-link-description">${description}</div>
        </div>
      `;
      
      linksContainer.appendChild(link);
      console.log(`Added panel link for ${name}`);
    }, 1000); // Wait a bit for panels page to be ready
  });
}

// Register our custom panels
document.addEventListener('DOMContentLoaded', () => {
  // Register slayer tasks panel
  registerPanelRoute('/panel/slayer-tasks', 'simple-panel');
  registerPanelLink('Slayer Tasks', '/panel/slayer-tasks', '🗡️', 'Track slayer tasks for all group members');
  
  console.log('Custom panel routes registered');
});

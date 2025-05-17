import "./appearance.js";
import "./men-homepage/men-homepage.js";
import "./wrap-routes/wrap-routes.js";
import "./data/api.js";
import "./data/group-data.js";
import "./search-element/search-element.js";
import "./inventory-item/inventory-item.js";
import "./inventory-pager/inventory-pager.js";
import "./app-navigation/app-navigation.js";
import "./items-page/items-page.js";
import "./app-route/app-route.js";
import "./map-page/map-page.js";
import "./side-panel/side-panel.js";
import "./player-panel/player-panel.js";
import "./player-stats/player-stats.js";
import "./player-inventory/player-inventory.js";
import "./player-skills/player-skills.js";
import "./skill-box/skill-box.js";
import "./player-equipment/player-equipment.js";
import "./xp-dropper/xp-dropper.js";
import "./rs-tooltip/rs-tooltip.js";
import "./item-box/item-box.js";
import "./total-level-box/total-level-box.js";
import "./player-quests/player-quests.js";
import "./create-group/create-group.js";
import "./men-link/men-link.js";
import "./setup-instructions/setup-instructions.js";
import "./app-initializer/app-initializer.js";
import "./group-settings/group-settings.js";
import "./member-name-input/member-name-input.js";
import "./men-input/men-input.js";
import "./edit-member/edit-member.js";
import "./loading-screen/loading-screen.js";
import "./login-page/login-page.js";
import "./logout-page/logout-page.js";
import "./demo-page/demo-page.js";
import "./social-links/social-links.js";
import "./rune-pouch/rune-pouch.js";
import "./stat-bar/stat-bar.js";
import "./player-interacting/player-interacting.js";
import "./skills-graphs/skills-graphs.js";
import "./skill-graph/skill-graph.js";
import "./confirm-dialog/confirm-dialog.js";
import "./panels-page/panels-page.js";
import "./diary-dialog/diary-dialog.js";
import "./player-diaries/player-diaries.js";
import "./diary-completion/diary-completion.js";
import "./canvas-map/canvas-map.js";
import "./collection-log/collection-log.js";
import "./collection-log-page/collection-log-page.js";
import "./collection-log-tab/collection-log-tab.js";
import "./collection-log-item/collection-log-item.js";
import "./player-icon/player-icon.js";
import "./donate-button/donate-button.js";

/**
 * Custom Panels Integration
 * These are the custom panels built for the Group Iron Site project
 * 
 * Integration follows the 3-source data integration model:
 * 1. RuneLite Plugin (group-ironmen-tracker)
 * 2. Wise Old Man API
 * 3. OSRS Wiki (via WikiService)
 */

// Import all custom panels
import "./panels/group-panel-activities.js";
import "./panels/group-panel-boss-strategy.js";
import "./panels/group-panel-challenges.js";
import "./panels/group-panel-dps-calculator.js";
import "./panels/group-panel-group-milestones.js";
import "./panels/group-panel-shared-calendar.js";
import "./panels/group-panel-slayers.js";
import "./panels/group-panel-valuable-drops.js";

// Initialize all custom panels
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing custom panels...');
});

// Add custom panel registration directly in index.js
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Check if the router is available
    if (typeof window.router !== 'undefined') {
      // Register a route for the slayer tasks panel
      const routeHandler = {
        path: '/panel/slayer-tasks',
        
        enable() {
          console.log('Enabling slayer tasks panel');
          
          // Find panels container
          const panelsContainer = document.querySelector('.panels-container');
          if (!panelsContainer) {
            console.warn('No panels container found');
            return;
          }
          
          // Create panel if it doesn't exist
          let panel = document.querySelector('slayer-tasks-panel');
          if (!panel) {
            panel = document.createElement('slayer-tasks-panel');
            panelsContainer.appendChild(panel);
          }
          
          // Show panel
          panel.style.display = 'block';
        },
        
        disable() {
          console.log('Disabling slayer tasks panel');
          
          // Hide panel
          const panel = document.querySelector('slayer-tasks-panel');
          if (panel) {
            panel.style.display = 'none';
          }
        }
      };
      
      // Register route
      window.router.register('/panel/slayer-tasks', routeHandler);
      console.log('Registered slayer tasks panel route');
      
      // Add link to panels page when panels page is available
      setTimeout(() => {
        const panelsPage = document.querySelector('panels-page');
        if (panelsPage) {
          const panelsContent = panelsPage.querySelector('.panels-page-content');
          if (panelsContent) {
            // Find or create links container
            let linksContainer = panelsContent.querySelector('.custom-panel-links');
            if (!linksContainer) {
              linksContainer = document.createElement('div');
              linksContainer.className = 'panel-links custom-panel-links';
              linksContainer.innerHTML = '<h3>Custom Panels</h3>';
              panelsContent.appendChild(linksContainer);
            }
            
            // Add link
            const link = document.createElement('a');
            link.className = 'panel-link';
            link.href = '/panel/slayer-tasks';
            link.innerHTML = `
              <div class="panel-link-icon">🗡️</div>
              <div class="panel-link-info">
                <div class="panel-link-name">Slayer Tasks</div>
                <div class="panel-link-description">Track slayer tasks for all group members</div>
              </div>
            `;
            
            linksContainer.appendChild(link);
          }
        }
      }, 1000);
    } else {
      console.warn('Router not available for panel registration');
    }
  } catch (err) {
    console.error('Error registering custom panels:', err);
  }
});

// Log diagnostic info
console.log('Custom components module loaded - waiting for DOM ready');

// Create global accessor for debugging
if (typeof window !== 'undefined') {
  window.customPanels = {
    getStatus: () => window.customElements.get('group-panel-activities') !== undefined
  };
}

/**
 * Features Index
 * Centralizes imports of all feature components to ensure they're loaded correctly
 * Each feature follows the 3-source data integration model:
 * 1. RuneLite Plugin (group-ironmen-tracker)
 * 2. Wise Old Man API
 * 3. OSRS Wiki (via WikiService)
 */

// Import the panel routes system that integrates with the original codebase
import './panel-routes';

// Import each feature module
import './activities';
import './boss-strategy';
import './group-challenges';
import './group-milestones';
import './shared-calendar';
import './slayer-tasks';
import './valuable-drops';
import './dps-calculator';
import './collection-log';

// Support services and contexts
import './data-sync/index.js';
import './wiki-integration/index.js';
import { SyncProvider } from './contexts/SyncContext';
import { GroupProvider } from './contexts/GroupContext';
import { WikiProvider } from './wiki-integration/WikiContext';

// Export providers for use in the main app
export const providers = {
  SyncProvider,
  GroupProvider,
  WikiProvider
};

// Import integration utilities (adds styles and core functionality)
import './integration';

// Initialize when document loads
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Custom features loaded and ready');
  });
}

// Export features for use in other parts of the application
export const featureModules = {
  activities: require('./activities'),
  bossStrategy: require('./boss-strategy'),
  groupChallenges: require('./group-challenges'),
  groupMilestones: require('./group-milestones'),
  sharedCalendar: require('./shared-calendar'),
  slayerTasks: require('./slayer-tasks'),
  valuableDrops: require('./valuable-drops'),
  dpsCalculator: require('./dps-calculator'),
  collectionLog: require('./collection-log')
};

// Set initialization flag for debugging
if (typeof window !== 'undefined') {
  window.customFeaturesLoaded = true;
}

console.log('Custom components module loaded');

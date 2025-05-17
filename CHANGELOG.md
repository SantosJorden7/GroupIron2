# CHANGELOG - Group Ironmen Site

## Version 1.0.0 (2025-05-17)

### Major Architecture Changes

- **Complete Migration from React to Web Components**
  - Removed all React-based components in favor of native Web Components
  - Eliminated React dependencies, significantly reducing bundle size
  - Streamlined build process using ESBuild

### New Panels

All panels now follow a consistent pattern as Web Components:
- Extend the BaseElement class
- Use connectedCallback() and disconnectedCallback() lifecycle methods
- Implement 3-source data fallback (Plugin → WOM → Wiki → Mock)
- Display correct data source badges (P/W/K)
- Use OSRS styling variables (--orange, --background, etc.)
- Use RuneScape fonts (rsbold, rssmall)

#### Newly Implemented Panels:

- **Activities Panel** (`group-panel-activities.js`) - Track group activities and achievements
- **Boss Strategy Panel** (`group-panel-boss-strategy.js`) - Collaborative boss guides and strategies
- **Group Challenges Panel** (`group-panel-challenges.js`) - Custom group challenges tracking
- **DPS Calculator Panel** (`group-panel-dps-calculator.js`) - Calculate DPS for different gear setups
- **Group Milestones Panel** (`group-panel-group-milestones.js`) - Track important group milestones
- **Shared Calendar Panel** (`group-panel-shared-calendar.js`) - Coordinate group activities
- **Slayer Panel** (`group-panel-slayers.js`) - Track slayer tasks across group members
- **Valuable Drops Panel** (`group-panel-valuable-drops.js`) - Track and share valuable item drops

### Integration Features

- **PubSub Integration** - All panels respond to data updates via the pubsub system
- **Data Source Fallback** - Plugin → Wise Old Man → Wiki → Fallback mock data
- **Dynamic Source Badges** - Visual indicators show data source in real-time
- **Responsive Design** - Mobile-friendly layouts for all new panels

### Build System Improvements

- Removed dependency on React
- Streamlined build process with explicit exclusions for legacy code
- Improved error handling and logging
- Added production build optimizations

### Styling

- Consistent use of OSRS theme across all custom panels
- Enhanced UI for better readability and usability
- Mobile responsiveness improvements

### Bug Fixes

- Fixed data synchronization issues in collection log integration
- Addressed layout overflow in mobile views
- Improved error handling for API failures
- Enhanced fallback mechanisms for offline usage

### Known Issues

- First-time data load may experience slight delay with the plugin source
- Wiki data for certain niche bosses may be incomplete

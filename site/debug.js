/**
 * Debug script to identify module loading issues
 */
const fs = require('fs');
const path = require('path');

// Check if BaseElement exists
console.log('Checking for BaseElement file...');
const baseElementPath = path.join(__dirname, 'src', 'base-element', 'base-element.js');
if (fs.existsSync(baseElementPath)) {
  console.log('BaseElement found: ' + baseElementPath);
  console.log('BaseElement content preview:');
  const content = fs.readFileSync(baseElementPath, 'utf8');
  console.log(content.substring(0, 500) + '...');
} else {
  console.log('BaseElement not found at expected path');
}

// Check for pubsub module
console.log('\nChecking for pubsub module...');
const pubsubPath = path.join(__dirname, 'src', 'data', 'pubsub.js');
if (fs.existsSync(pubsubPath)) {
  console.log('Pubsub found: ' + pubsubPath);
} else {
  console.log('Pubsub not found at expected path');
}

// Check for custom panels
console.log('\nChecking for panel modules...');
const panelsDir = path.join(__dirname, 'src', 'panels');
if (fs.existsSync(panelsDir)) {
  const panelFiles = fs.readdirSync(panelsDir);
  console.log(`Found ${panelFiles.length} panel files:`);
  panelFiles.forEach(file => console.log(` - ${file}`));
} else {
  console.log('Panels directory not found at expected path');
}

// Create standalone test panel
console.log('\nCreating standalone test panel...');
const testPanelDir = path.join(__dirname, 'public', 'test');
fs.mkdirSync(testPanelDir, { recursive: true });

// Create simplified test files
const baseElementTest = `
class BaseElement extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {}
  disconnectedCallback() {}
}
export { BaseElement };
`;

const pubsubTest = `
const pubsub = {
  subscribe: (event, callback) => {
    console.log('Subscribed to:', event);
    return () => console.log('Unsubscribed from:', event);
  },
  publish: (event, data) => {
    console.log('Published event:', event, data);
  }
};
export { pubsub };
`;

const testPanelJs = `
import { BaseElement } from './base-element.js';
import { pubsub } from './pubsub.js';

class TestPanel extends BaseElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    this.innerHTML = \`
      <div class="panel-content">
        <h3>Test Panel</h3>
        <p>If you can see this, the panel system is working!</p>
      </div>
    \`;
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = \`
      .panel-content {
        font-family: sans-serif;
        color: var(--primary-text);
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 16px;
      }
      
      h3 {
        margin-top: 0;
        color: var(--orange);
      }
    \`;
    this.appendChild(style);
  }
}

// Register the custom element
customElements.define('test-panel', TestPanel);
`;

const testHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Test Panel</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #111;
      color: #fff;
      font-family: sans-serif;
      padding: 20px;
      --orange: #ff981f;
      --background: #111111;
      --primary-text: #ffffff;
      --border: #474747;
    }
    h1 {
      color: var(--orange);
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Test Panel</h1>
  <test-panel></test-panel>
  
  <script type="module" src="./test-panel.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(testPanelDir, 'base-element.js'), baseElementTest);
fs.writeFileSync(path.join(testPanelDir, 'pubsub.js'), pubsubTest);
fs.writeFileSync(path.join(testPanelDir, 'test-panel.js'), testPanelJs);
fs.writeFileSync(path.join(testPanelDir, 'index.html'), testHtml);

console.log('Created test files at', testPanelDir);
console.log('Access the test panel at http://localhost:4000/test/');

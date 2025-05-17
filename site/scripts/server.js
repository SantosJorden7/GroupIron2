const express = require('express');
const winston = require('winston');
const expressWinston = require('express-winston');
const path = require('path');
const compression = require('compression');
const axios = require('axios');
const app = express();
const port = 4000;

const args = process.argv.map((arg) => arg.trim());
function getArgValue(arg) {
  const i = args.indexOf(arg);
  if (i === -1) return;
  return args[i + 1];
}

const backend = getArgValue('--backend') === undefined ? process.env.HOST_URL : getArgValue('--backend');

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  meta: false,
  msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}}",
  expressFormat: false,
  colorize: true,
  metaField: null
}));
app.use(compression());
app.use(express.static('public'));
app.use(express.static('.'));

// Check if index.html exists in public directory
const fs = require('fs');
const publicIndexPath = path.resolve('public', 'index.html');
if (!fs.existsSync(publicIndexPath)) {
  console.log('Warning: public/index.html not found! Creating a basic one...');
  // Create a minimal index.html if it doesn't exist
  const customPanelsHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Group Ironmen - Custom Panels</title>
  <meta charset="UTF-8" />
  <style>
    body { font-family: sans-serif; background: #111; color: #eee; }
    body { --orange: #ff981f; --background: #111; --primary-text: #fff; --border: #474747; }
    .panel-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px; }
    .header { background: var(--orange); color: black; padding: 10px 20px; text-align: center; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>Group Ironmen Custom Panels</h1></div>
  <div class="panel-container">
    <group-panel-activities></group-panel-activities>
    <group-panel-slayers></group-panel-slayers>
    <group-panel-valuable-drops></group-panel-valuable-drops>
    <group-panel-challenges></group-panel-challenges>
    <group-panel-dps-calculator></group-panel-dps-calculator>
    <group-panel-boss-strategy></group-panel-boss-strategy>
    <group-panel-shared-calendar></group-panel-shared-calendar>
    <group-panel-group-milestones></group-panel-group-milestones>
  </div>
  <script src="/app.js"></script>
</body>
</html>`;
  
  try {
    // Make sure the public directory exists
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }
    fs.writeFileSync(publicIndexPath, customPanelsHtml);
    console.log('Created fallback index.html successfully');
  } catch (err) {
    console.error('Error creating fallback index.html:', err);
  }
}

if (backend) {
  console.log(`Backend for api calls: ${backend}`);
  app.use(express.json());
  app.use('/api*', (req, res, next) => {
    const forwardUrl = backend + req.originalUrl;
    console.log(`Calling backend ${forwardUrl}`);
    const headers = Object.assign({}, req.headers);
    delete headers.host;
    delete headers.referer;
    axios({
      method: req.method,
      url: forwardUrl,
      responseType: 'stream',
      headers,
      data: req.body
    }).then((response) => {
      res.status(response.status);
      res.set(response.headers);
      response.data.pipe(res);
    }).catch((error) => {
      if (error.response) {
        res.status(error.response.status);
        res.set(error.response.headers);
        error.response.data.pipe(res);
      } else if (error.request) {
        res.status(418).end();
      } else {
        console.error('Error', error.message);
        res.status(418).end();
      }
    });
  });
} else {
  console.log("No backend supplied for api calls, not going to handle api requests");
}

app.get('*', function (request, response) {
  if (request.path.includes('/map') && request.path.includes('.png')) {
    response.sendStatus(404);
  } else {
    response.sendFile(path.resolve('public', 'index.html'));
  }
});

const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

const fs = require('node:fs');
const path = require('node:path');

const frontendRoot = path.resolve(__dirname, '..');
const configPath = path.join(frontendRoot, 'config.json');

// Keep a deployment's custom configuration when one has already been provided.
if (!fs.existsSync(configPath)) {
  fs.copyFileSync(path.join(frontendRoot, 'config.example.json'), configPath);
}

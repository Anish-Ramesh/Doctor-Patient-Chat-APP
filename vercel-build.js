const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Vercel build process...');

// Install client dependencies and build
console.log('Installing client dependencies...');
execSync('cd doctor-patient-chat/client && npm install --production=false', { stdio: 'inherit' });

console.log('Building client...');
execSync('cd doctor-patient-chat/client && npm run build', { stdio: 'inherit' });

// Install server dependencies
console.log('Installing server dependencies...');
execSync('cd doctor-patient-chat/server && npm install --production=true', { stdio: 'inherit' });

console.log('Vercel build completed successfully!');

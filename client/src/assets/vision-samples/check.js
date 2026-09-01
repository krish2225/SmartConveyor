const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/Krish/.gemini/antigravity/scratch/smartconveyor/client/src/assets/vision-samples';
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

// Check what exists
console.log('Existing files:', fs.readdirSync(targetDir));

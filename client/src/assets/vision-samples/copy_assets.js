const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/Krish/.gemini/antigravity/scratch/smartconveyor/client/src/assets/vision-samples';
const brainDir = 'C:/Users/Krish/.gemini/antigravity/brain/c7077aeb-8911-466a-bb2a-87246ffecf45';

try {
  fs.copyFileSync(
    path.join(brainDir, 'conveyor_warning_surface_wear_1788290624984.jpg'),
    path.join(targetDir, 'surface_wear_warning.jpg')
  );
  console.log('Copied surface_wear_warning.jpg');
} catch (e) {
  console.error('Error copying surface wear:', e);
}

try {
  fs.copyFileSync(
    path.join(brainDir, 'conveyor_critical_rupture_new_1788290367035.jpg'),
    path.join(targetDir, 'critical_rupture.jpg')
  );
  console.log('Copied critical_rupture.jpg');
} catch (e) {
  console.error('Error copying critical rupture:', e);
}

// Simple icon generator using SVG
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG template for the icon
function createSVG(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text x="${size/2}" y="${size/2 + size*0.1}" font-family="Arial, sans-serif" font-size="${size*0.3}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">UOMe</text>
</svg>`;
}

// Save SVG files
const sizes = [
  { size: 192, name: 'pwa-192x192' },
  { size: 512, name: 'pwa-512x512' },
  { size: 180, name: 'apple-touch-icon' }
];

console.log('Generating SVG files with UOMe text...\n');

sizes.forEach(({ size, name }) => {
  const svg = createSVG(size);
  const svgPath = path.join(__dirname, 'public', `${name}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Created ${name}.svg`);
});

console.log('\n===========================================');
console.log('SVG files created! Now converting to PNG...');
console.log('===========================================\n');
console.log('Please open: frontend/generate-icons-simple.html');
console.log('in your web browser and click the download buttons.');

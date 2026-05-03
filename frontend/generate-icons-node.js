// Simple icon generator using SVG to PNG conversion
const fs = require('fs');
const path = require('path');

// SVG template for the icon
function createSVG(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text x="${size/2}" y="${size/2 + size*0.1}" font-family="Arial, sans-serif" font-size="${size*0.3}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">UOMe</text>
</svg>`;
}

// Save SVG files that can be manually converted
const sizes = [
  { size: 192, name: 'pwa-192x192' },
  { size: 512, name: 'pwa-512x512' },
  { size: 180, name: 'apple-touch-icon' }
];

console.log('Generating SVG files...\n');

sizes.forEach(({ size, name }) => {
  const svg = createSVG(size);
  const svgPath = path.join('public', `${name}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Created ${svgPath}`);
});

console.log('\n===========================================');
console.log('SVG files created successfully!');
console.log('===========================================\n');
console.log('To convert to PNG, you have two options:\n');
console.log('Option 1: Use an online converter');
console.log('  1. Go to https://cloudconvert.com/svg-to-png');
console.log('  2. Upload each SVG file from frontend/public/');
console.log('  3. Download the PNG files');
console.log('  4. Rename them to remove .svg extension\n');
console.log('Option 2: Open generate-icons-simple.html in your browser');
console.log('  1. Open frontend/generate-icons-simple.html in Chrome/Edge');
console.log('  2. Click each download button');
console.log('  3. Save the files to frontend/public/\n');

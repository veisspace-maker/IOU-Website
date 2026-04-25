// Simple PWA icon generator using Canvas API
// Run with: node generate-pwa-icons.js

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1976d2';
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IOU', size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer('image/png');
  const path = join(__dirname, 'public', filename);
  writeFileSync(path, buffer);
  console.log(`Generated ${filename}`);
}

try {
  generateIcon(192, 'pwa-192x192.png');
  generateIcon(512, 'pwa-512x512.png');
  generateIcon(180, 'apple-touch-icon.png');
  console.log('All icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('\nNote: This script requires the "canvas" package.');
  console.log('Install it with: npm install --save-dev canvas');
  console.log('\nAlternatively, use the pwa-icon-generator.html file in your browser.');
}

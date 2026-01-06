/**
 * Script to generate PNG icons from SVG for PWA and Android
 * 
 * This script requires sharp: npm install --save-dev sharp
 * Run: npm run generate:icons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../public/app-icon.svg');
const publicDir = path.join(__dirname, '../public');
const androidResDir = path.join(__dirname, '../android/app/src/main/res');

// Android mipmap sizes (in dp, converted to px)
// mdpi: 48dp = 48px, hdpi: 48dp = 72px, xhdpi: 48dp = 96px, xxhdpi: 48dp = 144px, xxxhdpi: 48dp = 192px
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Read SVG file
const svgBuffer = fs.readFileSync(svgPath);

// Helper function to create circular (round) icon for Android
async function createRoundedIcon(inputBuffer, size) {
  const radius = size / 2;
  const circleMask = Buffer.from(
    `<svg><circle cx="${radius}" cy="${radius}" r="${radius}"/></svg>`
  );
  
  const icon = await sharp(inputBuffer)
    .resize(size, size)
    .png()
    .toBuffer();
  
  return await sharp(circleMask)
    .resize(size, size)
    .composite([{
      input: icon,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();
}

// Generate icons
async function generateIcons() {
  try {
    console.log('Generating web/PWA icons...\n');
    
    // Generate 192x192 icon
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'pwa-192x192.png'));
    console.log('✓ Generated pwa-192x192.png');

    // Generate 512x512 icon
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'pwa-512x512.png'));
    console.log('✓ Generated pwa-512x512.png');

    // Generate favicon.ico (16x16, 32x32, 48x48 sizes)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));
    console.log('✓ Generated favicon-32x32.png');

    // Generate apple-touch-icon (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');

    console.log('\nGenerating Android launcher icons...\n');

    // Generate Android icons for each density
    for (const [mipmapFolder, size] of Object.entries(androidSizes)) {
      const mipmapPath = path.join(androidResDir, mipmapFolder);
      
      // Ensure directory exists
      if (!fs.existsSync(mipmapPath)) {
        fs.mkdirSync(mipmapPath, { recursive: true });
      }

      // Generate regular launcher icon
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(mipmapPath, 'ic_launcher.png'));
      console.log(`✓ Generated ${mipmapFolder}/ic_launcher.png (${size}x${size})`);

      // Generate round launcher icon
      const roundedBuffer = await createRoundedIcon(svgBuffer, size);
      await sharp(roundedBuffer)
        .png()
        .toFile(path.join(mipmapPath, 'ic_launcher_round.png'));
      console.log(`✓ Generated ${mipmapFolder}/ic_launcher_round.png (${size}x${size})`);

      // Generate foreground icon (for adaptive icons)
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(mipmapPath, 'ic_launcher_foreground.png'));
      console.log(`✓ Generated ${mipmapFolder}/ic_launcher_foreground.png (${size}x${size})`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log('\n📱 Android icons are ready in: android/app/src/main/res/mipmap-*/');
    console.log('🌐 Web icons are ready in: public/');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();


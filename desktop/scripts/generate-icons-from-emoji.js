const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsDir = path.join(__dirname, '../assets');

async function generateIconsFromEmoji() {
  console.log('Creating PNG from graduation cap emoji...');

  // Create SVG with emoji
  const emojiSvg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="transparent"/>
      <text x="512" y="780" font-size="900" text-anchor="middle" font-family="Arial, sans-serif">🎓</text>
    </svg>
  `;

  const svgPath = path.join(assetsDir, 'icon.svg');
  const pngPath = path.join(assetsDir, 'icon.png');

  // Save emoji SVG
  fs.writeFileSync(svgPath, emojiSvg);

  // Convert SVG to PNG
  await sharp(Buffer.from(emojiSvg))
    .resize(1024, 1024)
    .png()
    .toFile(pngPath);

  console.log('PNG created successfully');

  // Generate ICNS for macOS
  console.log('Generating ICNS for macOS...');
  const iconsetDir = path.join(assetsDir, 'icon.iconset');

  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir);
  }

  const sizes = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png']
  ];

  for (const [size, filename] of sizes) {
    await sharp(pngPath)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsetDir, filename));
  }

  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(assetsDir, 'icon.icns')}"`, {
      stdio: 'inherit'
    });
    console.log('ICNS created successfully');

    // Clean up iconset directory
    fs.rmSync(iconsetDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create ICNS:', error.message);
  }

  // Generate ICO for Windows
  console.log('Generating ICO for Windows...');
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoImages = [];

  for (const size of icoSizes) {
    const buffer = await sharp(pngPath)
      .resize(size, size)
      .png()
      .toBuffer();
    icoImages.push(buffer);
  }

  // Create ICO file
  const icoPath = path.join(assetsDir, 'icon.ico');
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Image type (1 = ICO)
  icoHeader.writeUInt16LE(icoImages.length, 4); // Number of images

  const icoEntries = [];
  let imageDataOffset = 6 + (16 * icoImages.length);

  for (let i = 0; i < icoImages.length; i++) {
    const size = icoSizes[i];
    const imageData = icoImages[i];
    const entry = Buffer.alloc(16);

    entry.writeUInt8(size === 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(imageData.length, 8); // Image data size
    entry.writeUInt32LE(imageDataOffset, 12); // Image data offset

    icoEntries.push(entry);
    imageDataOffset += imageData.length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...icoEntries, ...icoImages]);
  fs.writeFileSync(icoPath, icoBuffer);

  console.log('ICO created successfully');
  console.log('\n✅ Icon files generated:');
  console.log('📄 icon.svg');
  console.log('🖼️  icon.png');
  console.log('🍎 icon.icns (macOS)');
  console.log('🪟 icon.ico (Windows)');
}

generateIconsFromEmoji().catch(console.error);

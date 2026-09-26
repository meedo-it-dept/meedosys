const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Generate SVG Icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1e40af" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Outer gold accent ring -->
  <rect x="24" y="24" width="464" height="464" rx="92" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.4" />

  <!-- Center Store / Enterprise Icon Graphic -->
  <g filter="url(#shadow)">
    <!-- Roof / Canopy -->
    <path d="M120 220 L256 128 L392 220 L380 248 L132 248 Z" fill="url(#goldGrad)" />
    
    <!-- Building Pillars & Base -->
    <rect x="144" y="252" width="224" height="136" rx="8" fill="#ffffff" />
    
    <!-- Stall Openings / Pillars -->
    <rect x="168" y="280" width="38" height="88" rx="6" fill="#1e40af" />
    <rect x="237" y="280" width="38" height="88" rx="6" fill="#1e40af" />
    <rect x="306" y="280" width="38" height="88" rx="6" fill="#1e40af" />
    
    <!-- Pedestal Base -->
    <rect x="120" y="388" width="272" height="24" rx="6" fill="url(#goldGrad)" />
  </g>

  <!-- MEEDO Typography -->
  <text x="256" y="456" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">
    MEEDOSYS
  </text>
  <text x="256" y="482" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#93c5fd" text-anchor="middle" letter-spacing="2">
    MALUNGON
  </text>
</svg>`;

// Helper to construct a PNG buffer
function createPngBuffer(width, height, isMaskable = false) {
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const cornerR = isMaskable ? 0 : width * 0.22;
  const boxHalf = isMaskable ? width / 2 : width * 0.44;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      let inside = false;
      if (isMaskable) {
        inside = true;
      } else if (dx <= boxHalf && dy <= boxHalf) {
        inside = true;
      } else if (dx > boxHalf - cornerR && dy > boxHalf - cornerR) {
        const cdx = dx - (boxHalf - cornerR);
        const cdy = dy - (boxHalf - cornerR);
        if (cdx * cdx + cdy * cdy <= cornerR * cornerR) inside = true;
      }

      if (inside) {
        // Gradient from #1d4ed8 (29, 78, 216) to #1e3a8a (30, 58, 138)
        const t = (x + y) / (width + height);
        buffer[idx] = Math.round(29 * (1 - t) + 30 * t);
        buffer[idx + 1] = Math.round(78 * (1 - t) + 58 * t);
        buffer[idx + 2] = Math.round(216 * (1 - t) + 138 * t);
        buffer[idx + 3] = 255;

        // Draw market stall / M graphic
        const nx = (x - cx) / (width * 0.5); // -1 to 1
        const ny = (y - cy) / (height * 0.5); // -1 to 1

        // Gold canopy roof (triangle: ny from -0.5 to -0.1, nx within (-0.6, 0.6))
        if (ny >= -0.52 && ny <= -0.15) {
          const roofWidth = (ny - (-0.52)) / 0.37 * 0.65;
          if (Math.abs(nx) <= roofWidth) {
            // Gold gradient
            buffer[idx] = 251;
            buffer[idx + 1] = 191;
            buffer[idx + 2] = 36;
            buffer[idx + 3] = 255;
          }
        }

        // White building body
        if (ny > -0.15 && ny <= 0.42 && Math.abs(nx) <= 0.52) {
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 255;

          // 3 Blue Stall Archways
          if (ny >= -0.02 && ny <= 0.35) {
            const arch1 = Math.abs(nx - (-0.32)) <= 0.09;
            const arch2 = Math.abs(nx - 0) <= 0.09;
            const arch3 = Math.abs(nx - 0.32) <= 0.09;
            if (arch1 || arch2 || arch3) {
              buffer[idx] = 30;
              buffer[idx + 1] = 58;
              buffer[idx + 2] = 138;
              buffer[idx + 3] = 255;
            }
          }
        }

        // Gold Base
        if (ny > 0.42 && ny <= 0.52 && Math.abs(nx) <= 0.58) {
          buffer[idx] = 245;
          buffer[idx + 1] = 158;
          buffer[idx + 2] = 11;
          buffer[idx + 3] = 255;
        }
      } else {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  // Build PNG format
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // Filter None
    buffer.copy(rawData, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);
console.log('Created icon.svg');

// Write PNGs
const p192 = createPngBuffer(192, 192, false);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), p192);
console.log('Created icon-192.png');

const p512 = createPngBuffer(512, 512, false);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), p512);
console.log('Created icon-512.png');

const pMaskable = createPngBuffer(512, 512, true);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), pMaskable);
console.log('Created icon-maskable-512.png');

const pApple = createPngBuffer(180, 180, false);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), pApple);
console.log('Created apple-touch-icon.png');

// Also copy or write favicon.ico in public
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), p192);
console.log('Created favicon.ico');

// Generates the Atlas app icons (globe mark) as PNGs. No external deps.
// Run: node scripts/gen-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CLAY = [168, 92, 66];
const WHITE = [255, 255, 255];

// CRC32 for PNG chunks
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  // raw scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Draw the globe mark into an RGBA buffer.
// opts: { bg: [r,g,b]|null, mark: [r,g,b], rFrac, strokeFrac, meridianRxFrac }
function renderGlobe(size, opts) {
  const { bg, mark, rFrac, strokeFrac, meridianRxFrac } = opts;
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const R = rFrac * size;
  const hs = (strokeFrac * size) / 2;   // half stroke
  const rx = meridianRxFrac * size;
  const ry = R;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5, py = y + 0.5;
      const nx = px - cx, ny = py - cy;

      // circle outline
      const dCircle = Math.abs(Math.hypot(nx, ny) - R);

      // equator (horizontal chord within the circle)
      const ex = Math.max(Math.abs(nx) - R, 0);
      const dEquator = Math.hypot(ex, ny);

      // meridian ellipse outline (approx signed distance via gradient)
      let dMeridian = Infinity;
      const gx = nx / rx, gy = ny / ry;
      const f = gx * gx + gy * gy - 1;
      const grad = Math.hypot((2 * nx) / (rx * rx), (2 * ny) / (ry * ry));
      if (grad > 1e-6) dMeridian = Math.abs(f / grad);

      const d = Math.min(dCircle, dEquator, dMeridian);
      // 1px feather anti-aliasing
      let cov = Math.max(0, Math.min(1, hs - d + 0.5));

      const i = (y * size + x) * 4;
      let r = 0, g = 0, b = 0, a = 0;
      if (bg) { r = bg[0]; g = bg[1]; b = bg[2]; a = 1; }
      // composite mark over bg
      const oa = cov + a * (1 - cov);
      if (oa > 0) {
        r = (mark[0] * cov + r * a * (1 - cov)) / oa;
        g = (mark[1] * cov + g * a * (1 - cov)) / oa;
        b = (mark[2] * cov + b * a * (1 - cov)) / oa;
      }
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = Math.round(oa * 255);
    }
  }
  return buf;
}

function write(name, size, opts) {
  const buf = renderGlobe(size, opts);
  const out = path.join(__dirname, '..', 'assets', name);
  fs.writeFileSync(out, encodePNG(size, size, buf));
  console.log('wrote', name, size + 'x' + size);
}

const geo = { rFrac: 0.30, strokeFrac: 0.05, meridianRxFrac: 0.115 };

// App icon (iOS + fallback): white globe on clay, full square (OS rounds corners)
write('icon.png', 1024, { bg: CLAY, mark: WHITE, ...geo });
// Android adaptive foreground: white globe on transparent, smaller for safe zone
write('android-icon-foreground.png', 1024, { bg: null, mark: WHITE, rFrac: 0.22, strokeFrac: 0.037, meridianRxFrac: 0.084 });
// Web favicon: white globe on clay
write('favicon.png', 64, { bg: CLAY, mark: WHITE, ...geo });
// Splash: clay globe on transparent (shown over bone background)
write('splash-icon.png', 512, { bg: null, mark: CLAY, ...geo });
// Android themed (monochrome) icon: globe silhouette on transparent
write('android-icon-monochrome.png', 1024, { bg: null, mark: WHITE, rFrac: 0.22, strokeFrac: 0.037, meridianRxFrac: 0.084 });

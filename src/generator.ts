import { createCanvas } from '@napi-rs/canvas';
import { randomInt, randomBytes } from 'crypto';
import type { PrimeResult, ResolvedOptions } from './types';

/**
 * Alphabet filtered from ambiguous characters.
 * Removes: 0, O, 1, I — characters that often confuse users.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Dark contrast color palette for captcha characters.
 * Uses colors that contrast well against light backgrounds.
 */
const CHAR_COLORS = [
  '#1a237e', // deep blue
  '#880e4f', // deep pink
  '#1b5e20', // deep green
  '#e65100', // deep orange
  '#4a148c', // deep purple
  '#006064', // deep cyan
  '#bf360c', // deep red-orange
];

/**
 * Generates one random character from the filtered alphabet.
 * Uses crypto.randomInt for high-entropy security.
 */
function randomChar(): string {
  return ALPHABET[randomInt(0, ALPHABET.length)];
}

/**
 * Generates captcha text with the specified length.
 * @param length - Number of characters to generate
 */
function generateText(length: number): string {
  let text = '';
  for (let i = 0; i < length; i++) {
    text += randomChar();
  }
  return text;
}

/**
 * Draws background layer with smooth gradients and pastel colors.
 * A clean background ensures characters are human-readable
 * while still challenging for OCR.
 */
function drawBackground(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  width: number,
  height: number
): void {
  // Pastel colors that vary per request using crypto.randomInt
  const hue1 = randomInt(180, 240); // blue-cyan range
  const hue2 = randomInt(200, 260); // blue-purple variation

  // Create gradient from top-left to bottom-right
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${hue1}, 40%, 95%)`);
  gradient.addColorStop(1, `hsl(${hue2}, 40%, 88%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draws vector lines as an interference layer.
 * Uses quadratic bezier curves for more natural lines.
 * Minimum 4 lines with random opacity to hinder OCR segmentation.
 * @param noiseIntensity - 1 to 10, determines line count & thickness
 */
function drawInterferenceLines(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  width: number,
  height: number,
  noiseIntensity: number
): void {
  // Calculate line count: minimum 4, more intensity means more lines
  const lineCount = 4 + Math.floor(noiseIntensity * 0.8);

  for (let i = 0; i < lineCount; i++) {
    ctx.save();

    // Random opacity for each line (0.1 - 0.5)
    const opacity = randomInt(10, 50) / 100;

    // Random color for each line
    const r = randomInt(50, 200);
    const g = randomInt(50, 200);
    const b = randomInt(50, 200);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.lineWidth = randomInt(1, 3);

    ctx.beginPath();
    ctx.moveTo(randomInt(0, width), randomInt(0, height));

    // Quadratic bezier curve for natural lines (not straight)
    ctx.quadraticCurveTo(
      randomInt(0, width),
      randomInt(0, height),
      randomInt(0, width),
      randomInt(0, height)
    );

    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draws grain noise (pixel dust) over the canvas.
 * 
 * Uses raw pixel manipulation via ImageData for
 * much higher performance than per-pixel fillRect().
 * Only modifies selected pixels randomly based on crypto.randomBytes
 * to minimize syscall count.
 * 
 * @param noiseIntensity - Determines grain density (1-10)
 */
function drawGrainNoise(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  width: number,
  height: number,
  noiseIntensity: number
): void {
  // Get pixel data for the entire canvas at once (1 call, not per-pixel)
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data; // Uint8ClampedArray: [R, G, B, A, R, G, B, A, ...]

  // Number of pixels to modify
  const totalPixels = width * height;
  const noisePixelCount = Math.floor((totalPixels * noiseIntensity) / 80);

  // Generate all random bytes at once (much more efficient than randomInt loop)
  // Each noise pixel needs: x(2byte) + y(2byte) + r + g + b + alpha = 6 bytes
  const rndBuf = randomBytes(noisePixelCount * 6);

  for (let i = 0; i < noisePixelCount; i++) {
    const offset = i * 6;

    // Get coordinates from random bytes (0-65535, then modulo to canvas range)
    const x = ((rndBuf[offset] << 8) | rndBuf[offset + 1]) % width;
    const y = ((rndBuf[offset + 2] << 8) | rndBuf[offset + 3]) % height;

    // Colors and alpha from random bytes
    const r = rndBuf[offset + 4] % 200;
    const g = rndBuf[offset + 5] % 200;
    const b = rndBuf[offset % rndBuf.length] % 200; // recycle byte for b

    // Opacity: 30-80% range (mapped from 0-255)
    const alpha = 75 + (rndBuf[(offset + 1) % rndBuf.length] % 128); // ~30%-80%

    // Calculate pixel index in Uint8ClampedArray (format: R,G,B,A per pixel)
    const pixelIndex = (y * width + x) * 4;

    // Blend noise with existing pixel (simple alpha compositing)
    const blendFactor = alpha / 255;
    data[pixelIndex] = Math.floor(data[pixelIndex] * (1 - blendFactor) + r * blendFactor);
    data[pixelIndex + 1] = Math.floor(data[pixelIndex + 1] * (1 - blendFactor) + g * blendFactor);
    data[pixelIndex + 2] = Math.floor(data[pixelIndex + 2] * (1 - blendFactor) + b * blendFactor);
    // Alpha channel: stays opaque
  }

  // Put modified pixel data back to canvas (1 call)
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draws captcha characters one by one with full obfuscation:
 * - Per-character random rotation (-20° to 20°)
 * - Y-axis jitter (slightly varying vertical position)
 * - Per-character random color from the defined palette
 * - Subtle shadow for visual depth
 */
function drawCharacters(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  text: string,
  width: number,
  height: number,
  fontSize: number
): void {
  const charCount = text.length;

  // Calculate even spacing based on canvas width and character count
  const charSpacing = (width - fontSize) / charCount;

  for (let i = 0; i < charCount; i++) {
    ctx.save();

    // X Position: even distribution with slight horizontal jitter
    const baseX = fontSize / 2 + i * charSpacing + randomInt(-3, 4);

    // Y Position: center canvas with Y-axis jitter (±15% of canvas height)
    const jitterRange = Math.floor(height * 0.15);
    const baseY = height / 2 + randomInt(-jitterRange, jitterRange + 1);

    // Translate origin to character position for accurate rotation
    ctx.translate(baseX, baseY);

    // Random rotation: -20° to 20° (converted to radians)
    const rotateDeg = randomInt(-20, 21);
    ctx.rotate((rotateDeg * Math.PI) / 180);

    // Select color from palette randomly
    const colorIndex = randomInt(0, CHAR_COLORS.length);
    ctx.fillStyle = CHAR_COLORS[colorIndex];

    // Font with slight size variation to break patterns
    const fontSizeVariation = fontSize + randomInt(-4, 5);
    ctx.font = `bold ${fontSizeVariation}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtle shadow to make characters more "real" and OCR-resistant
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;

    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
}

/**
 * Core generator function — main function to produce a captcha.
 *
 * Process flow (Buffer-First):
 * 1. Generate random text with crypto.randomInt
 * 2. Create canvas in memory (zero disk I/O)
 * 3. Draw gradient background
 * 4. Draw interference lines (under characters)
 * 5. Draw characters with per-char obfuscation
 * 6. Draw grain noise on the top layer
 * 7. Export to PNG Buffer
 *
 * @param options - Resolved configuration (all fields required)
 * @returns PrimeResult with image Buffer and plaintext text
 */
export function generateCaptcha(options: ResolvedOptions): PrimeResult {
  const { width, height, length, fontSize, noiseIntensity } = options;

  // Step 1: Generate captcha text with crypto.randomInt
  const text = generateText(length);

  // Step 2: Create canvas in memory (zero disk I/O)
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Step 3: Draw gradient background
  drawBackground(ctx, width, height);

  // Step 4: Draw interference lines (under characters)
  drawInterferenceLines(ctx, width, height, noiseIntensity);

  // Step 5: Draw characters with per-char obfuscation
  drawCharacters(ctx, text, width, height, fontSize);

  // Step 6: Draw grain noise on top layer (over characters)
  drawGrainNoise(ctx, width, height, noiseIntensity);

  // Step 7: Export to PNG Buffer (synchronous, zero disk I/O)
  // @napi-rs/canvas uses a very fast Rust-based encoder
  const image = canvas.toBuffer('image/png');

  return { image, text };
}

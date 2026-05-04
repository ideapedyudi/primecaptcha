# primecaptcha 🔐 — Node.js Image Captcha Library

> The ultimate high-performance, buffer-first **Image CAPTCHA library for Node.js**. Supports both **Alphanumeric Text CAPTCHA** and **Mathematical CAPTCHA** equations. Built with Zero Disk I/O and Crypto-Secure randomness to prevent OCR bots and spam.

[![npm version](https://img.shields.io/npm/v/primecaptcha.svg)](https://www.npmjs.com/package/primecaptcha)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D_20-brightgreen.svg)](https://nodejs.org)

**primecaptcha** is a highly optimized, TypeScript-ready captcha generator for Express, NestJS, and Fastify. By rendering images entirely in memory (RAM), it guarantees ultra-low latency. Perfect for securing login forms, protecting registrations, and preventing spam on your APIs.

**Keywords**: `nodejs captcha`, `math captcha`, `image captcha`, `anti-bot`, `spam protection`, `express captcha`, `typescript`


## 🖼️ Preview

<div align="center">
  <br />

| Captcha Type | Example Output |
| :---: | :---: |
| **Text** | <img src="public/sample.png" alt="Text Captcha Sample Image" width="200" height="80" /> |
| **Math** | <img src="public/samplemath.png" alt="Math Captcha Sample Image" width="200" height="80" /> |

  <br />
</div>

---

## ✨ Key Features

| Feature | Details |
|---|---|
| 🔠 **Dual Mode** | Choose between **Alphanumeric Text CAPTCHA** or **Mathematical CAPTCHA** |
| ⚡ **Buffer-First** | Zero Disk I/O — everything is processed directly in RAM for maximum speed |
| 🔒 **Crypto-Secure** | Uses `crypto.randomInt` for secure randomness |
| 🎨 **Anti-OCR** | Per-character rotation, Y-jitter, vector lines, grain noise |
| 📦 **Lightweight** | Only requires `@napi-rs/canvas` as the main dependency |
| 🔷 **TypeScript** | Full type definitions included |

---

## 📦 Installation

```bash
npm install primecaptcha
```

> **Note:** This library requires **Node.js version 20 or higher** for optimal performance and compatibility.

---

## 🚀 Usage

### Basic Usage

```typescript
import { generate } from 'primecaptcha';

const captcha = generate();

console.log(captcha.text);   // "K3PQ7M"
console.log(captcha.image);  // <Buffer 89 50 4e 47 ...> (PNG Buffer)
```

### Integration with Express.js

```typescript
import express from 'express';
import { generate } from 'primecaptcha';

const app = express();

// Map to store captcha (use Redis in production)
const captchaStore = new Map<string, string>();

// Endpoint to generate captcha
app.get('/captcha/:sessionId', (req, res) => {
  const captcha = generate();
  
  // Save text for validation
  captchaStore.set(req.params.sessionId, captcha.text);
  
  // Send image directly to client
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.send(captcha.image);
});

// Endpoint to verify captcha
app.post('/verify/:sessionId', express.json(), (req, res) => {
  const { userInput } = req.body;
  const expected = captchaStore.get(req.params.sessionId);
  
  captchaStore.delete(req.params.sessionId); // Delete after verification
  
  if (!expected || userInput.toUpperCase() !== expected) {
    return res.status(400).json({ valid: false, message: 'Invalid captcha!' });
  }
  
  res.json({ valid: true, message: 'Captcha is correct!' });
});
```

### Custom Options

```typescript
import { generate } from 'primecaptcha';

// Text CAPTCHA
const textCaptcha = generate({
  type: 'text',        // 'text' or 'math' (default: 'text')
  width: 250,          // Canvas width (default: 200)
  height: 90,          // Canvas height (default: 80)
  length: 8,           // Number of characters (default: 6)
  fontSize: 48,        // Font size (default: 42)
  noiseIntensity: 7,   // Noise intensity 1-10 (default: 5)
});

// Math CAPTCHA
const mathCaptcha = generate({
  type: 'math',        // Mathematical equations (e.g. "12 + 5 = ?")
  width: 250,
  height: 80,
});
console.log(mathCaptcha.text); // "17" (The answer to validate against)
```

### Async Version (for high-concurrency)

```typescript
import { generateAsync } from 'primecaptcha';

const captcha = await generateAsync({ length: 6 });
```

---

## 📐 API Reference

### `generate(options?): PrimeResult`

Main function to generate captcha synchronously.

**Parameters:**

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | `'text' \| 'math'` | `'text'` | Captcha type: random text or simple math equation |
| `width` | `number` | `200` | Canvas width in pixels |
| `height` | `number` | `80` | Canvas height in pixels |
| `length` | `number` | `6` | Number of captcha characters (only for `text` type) |
| `fontSize` | `number` | `42` | Font size in pixels |
| `noiseIntensity` | `number` | `5` | Noise intensity (1-10) |

**Return Value (`PrimeResult`):**

| Field | Type | Description |
|---|---|---|
| `image` | `Buffer` | PNG image as a Buffer |
| `text` | `string` | Plaintext captcha text |

### `generateAsync(options?): Promise<PrimeResult>`

Async version of `generate()` for concurrent use.

---

## 🛡️ Security

- **Filtered alphabet:** `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (removes ambiguous characters: `0`, `O`, `1`, `I`)
- **Crypto-grade randomness:** All randomization uses `crypto.randomInt` and `crypto.randomBytes` (not `Math.random`)
- **Anti-OCR layers:**
  - Per-character rotation: -20° to +20°
  - Y-axis jitter: varying vertical position
  - Vector interference lines: minimum 4 bezier curves
  - Grain noise: pixel dust covering the entire canvas

---

## ⚡ Performance

Benchmark results on a MacBook Pro M1 (for reference):

| Configuration | Throughput |
|---|---|
| Default (200x80, 6 char) | ~800-1200 captchas/sec |
| Minimal (150x60, 4 char) | ~1500-2000 captchas/sec |
| Large (400x150, 8 char) | ~300-500 captchas/sec |

Run the benchmark yourself:

```bash
npm run benchmark
```

---

## 📄 License

MIT © [ideapedyudi](https://github.com/ideapedyudi)

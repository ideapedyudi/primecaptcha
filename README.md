# primecaptcha 🔐

> High-performance, buffer-first image captcha library for Node.js — Zero Disk I/O, Crypto-Secure.

[![npm version](https://img.shields.io/npm/v/primecaptcha.svg)](https://www.npmjs.com/package/primecaptcha)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/primecaptcha)](https://nodejs.org)

---

## ✨ Fitur Utama

| Fitur | Detail |
|---|---|
| ⚡ **Buffer-First** | Zero Disk I/O — semua diproses langsung di RAM |
| 🔒 **Crypto-Secure** | Menggunakan `crypto.randomInt` untuk randomness yang aman |
| 🎨 **Anti-OCR** | Rotasi per-karakter, Y-jitter, vector lines, grain noise |
| 📦 **Ringan** | Hanya butuh `canvas` sebagai dependency utama |
| 🔷 **TypeScript** | Full type definitions included |

---

## 📦 Instalasi

```bash
npm install primecaptcha
```

> **Catatan:** Library ini menggunakan `node-canvas` yang memerlukan native binding. Jika instalasi gagal, pastikan kamu sudah punya build tools:
> - **Linux:** `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
> - **macOS:** `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
> - **Windows:** Ikuti panduan di [node-canvas wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

---

## 🚀 Cara Pakai

### Basic Usage

```typescript
import { generate } from 'primecaptcha';

const captcha = generate();

console.log(captcha.text);   // "K3PQ7M"
console.log(captcha.image);  // <Buffer 89 50 4e 47 ...> (PNG Buffer)
```

### Integrasi dengan Express.js

```typescript
import express from 'express';
import { generate } from 'primecaptcha';

const app = express();

// Map untuk menyimpan captcha (gunakan Redis di production)
const captchaStore = new Map<string, string>();

// Endpoint generate captcha
app.get('/captcha/:sessionId', (req, res) => {
  const captcha = generate();
  
  // Simpan teks untuk validasi
  captchaStore.set(req.params.sessionId, captcha.text);
  
  // Kirim gambar langsung ke client
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.send(captcha.image);
});

// Endpoint verifikasi captcha
app.post('/verify/:sessionId', express.json(), (req, res) => {
  const { userInput } = req.body;
  const expected = captchaStore.get(req.params.sessionId);
  
  captchaStore.delete(req.params.sessionId); // Hapus setelah verifikasi
  
  if (!expected || userInput.toUpperCase() !== expected) {
    return res.status(400).json({ valid: false, message: 'Captcha salah!' });
  }
  
  res.json({ valid: true, message: 'Captcha benar!' });
});
```

### Custom Options

```typescript
import { generate } from 'primecaptcha';

const captcha = generate({
  width: 250,          // Lebar canvas (default: 200)
  height: 90,          // Tinggi canvas (default: 80)
  length: 8,           // Jumlah karakter (default: 6)
  fontSize: 48,        // Ukuran font (default: 42)
  noiseIntensity: 7,   // Intensitas noise 1-10 (default: 5)
});
```

### Async Version (untuk high-concurrency)

```typescript
import { generateAsync } from 'primecaptcha';

const captcha = await generateAsync({ length: 6 });
```

---

## 📐 API Reference

### `generate(options?): PrimeResult`

Fungsi utama untuk generate captcha secara synchronous.

**Parameter:**

| Opsi | Tipe | Default | Keterangan |
|---|---|---|---|
| `width` | `number` | `200` | Lebar canvas dalam piksel |
| `height` | `number` | `80` | Tinggi canvas dalam piksel |
| `length` | `number` | `6` | Jumlah karakter captcha |
| `fontSize` | `number` | `42` | Ukuran font dalam piksel |
| `noiseIntensity` | `number` | `5` | Intensitas noise (1-10) |

**Return Value (`PrimeResult`):**

| Field | Tipe | Keterangan |
|---|---|---|
| `image` | `Buffer` | PNG image sebagai Buffer |
| `text` | `string` | Teks captcha plaintext |

### `generateAsync(options?): Promise<PrimeResult>`

Versi async dari `generate()` untuk penggunaan concurrent.

---

## 🛡️ Keamanan

- **Alfabet yang difilter:** `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (menghapus karakter ambigu: `0`, `O`, `1`, `I`)
- **Crypto-grade randomness:** Semua randomisasi menggunakan `crypto.randomInt` (bukan `Math.random`)
- **Anti-OCR layers:**
  - Rotasi per-karakter: -20° sampai +20°
  - Y-axis jitter: posisi vertikal yang bervariasi
  - Vector interference lines: minimum 4 bezier curves
  - Grain noise: pixel dust yang menutupi seluruh canvas

---

## ⚡ Performance

Hasil benchmark di MacBook Pro M1 (sebagai referensi):

| Konfigurasi | Throughput |
|---|---|
| Default (200x80, 6 char) | ~800-1200 captcha/detik |
| Minimal (150x60, 4 char) | ~1500-2000 captcha/detik |
| Large (400x150, 8 char) | ~300-500 captcha/detik |

Jalankan benchmark sendiri:

```bash
npm run benchmark
```

---

## 📄 Lisensi

MIT © [ideapedyudi](https://github.com/ideapedyudi)

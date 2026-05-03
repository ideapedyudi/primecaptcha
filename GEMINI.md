# 🏛️ PROJECT SPECIFICATION: PRIMECAPTCHA

## 🤖 AI AGENT ROLE
Act as a Senior Backend Architect & Performance Engineer. Your mission is to build **primecaptcha**, a high-performance image-based captcha library for the Node.js ecosystem, written in pure TypeScript.

## 📋 CORE PRINCIPLES
- **Name**: `primecaptcha`
- **Focus**: Speed, Memory Efficiency, and Low Latency.
- **Philosophy**: "Buffer-First" — Zero Disk I/O. Everything stays in RAM.
- **Target**: Production-grade Web2 applications with high request volumes.

## 🛠️ TECHNICAL STACK & CONSTRAINTS
1. **Engine**: Use `canvas` (node-canvas).
2. **Platform**: Node.js + TypeScript (Strict Mode).
3. **Randomness**: Implement `crypto.randomInt` for all randomization (text, rotation, noise) to ensure high-entropy security.
4. **Encoding**: Optimized PNG generation via `canvas.toBuffer('image/png', { compressionLevel: 3 })`.

## 🧠 LOGIC REQUIREMENTS (The "Prime" Standards)
- **Character Filtering**: Use a refined alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (Removes ambiguous chars like 0, O, 1, I).
- **Security Obfuscation**:
    - **Per-Char Rotation**: Random rotate each character between `-20°` and `20°`.
    - **Y-Axis Jitter**: Slightly randomize the vertical position of each letter.
    - **Interference Layer**: 
        - **Vector Lines**: Minimum 4 lines with randomized opacity.
        - **Grain Noise**: Randomized pixel "dust" across the canvas to break OCR patterns.
- **Memory Management**: Ensure no memory leaks during high-frequency rendering.

### Final Tips for You:
1. **Publish to NPM**: Before you `npm publish`, make sure you run `npm login` and verify that the name `primecaptcha` is not already taken. If it is, you can use your own name scope, for example `@ideapedyudi/primecaptcha`.
2. **Performance Test**: Once the code is complete, you can test its speed. With this "Buffer-First" specification, your library should be able to handle thousands of requests per second without any issues.

## 📂 ARCHITECTURE & INTERFACES

### 1. Configuration Interface
```typescript
export interface PrimeOptions {
  width?: number;        // Default: 200
  height?: number;       // Default: 80
  length?: number;       // Default: 6
  fontSize?: number;     // Default: 42
  noiseIntensity?: number; // 1 to 10 (Default: 5)
}


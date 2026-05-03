import { generateCaptcha } from './generator';
import type { PrimeOptions, PrimeResult, ResolvedOptions } from './types';

// Re-export types for library users
export type { PrimeOptions, PrimeResult };

/**
 * Default values optimized for performance and security.
 * Separated as a constant for easy extensibility.
 */
const DEFAULT_OPTIONS: Readonly<ResolvedOptions> = {
  width: 200,
  height: 80,
  length: 6,
  fontSize: 42,
  noiseIntensity: 5,
} as const;

/**
 * Validates and clamps noiseIntensity value to a valid range (1-10).
 */
function clampNoiseIntensity(value: number): number {
  return Math.max(1, Math.min(10, Math.floor(value)));
}

/**
 * Merges user options with default values and validates the results.
 * Uses efficient spread operator for zero-overhead merging.
 */
function resolveOptions(options?: PrimeOptions): ResolvedOptions {
  return {
    width: options?.width ?? DEFAULT_OPTIONS.width,
    height: options?.height ?? DEFAULT_OPTIONS.height,
    length: options?.length ?? DEFAULT_OPTIONS.length,
    fontSize: options?.fontSize ?? DEFAULT_OPTIONS.fontSize,
    noiseIntensity: options?.noiseIntensity !== undefined
      ? clampNoiseIntensity(options.noiseIntensity)
      : DEFAULT_OPTIONS.noiseIntensity,
  };
}

/**
 * # primecaptcha — Generate Image Captcha
 * 
 * Main function of the primecaptcha library. Produces a captcha image as a Buffer
 * directly in memory without writing files to disk (Buffer-First Philosophy).
 * 
 * ## Usage Example (Express.js):
 * ```typescript
 * import { generate } from 'primecaptcha';
 * 
 * app.get('/captcha', (req, res) => {
 *   const captcha = generate();
 *   
 *   // Save text to session for validation
 *   req.session.captchaText = captcha.text;
 *   
 *   // Send image directly to client
 *   res.setHeader('Content-Type', 'image/png');
 *   res.send(captcha.image);
 * });
 * ```
 * 
 * ## Example with Custom Options:
 * ```typescript
 * const captcha = generate({
 *   width: 250,
 *   height: 90,
 *   length: 8,
 *   fontSize: 48,
 *   noiseIntensity: 7,
 * });
 * ```
 * 
 * @param options - Optional configuration for captcha
 * @returns {{ image: Buffer, text: string }} PNG Buffer + plaintext text
 */
export function generate(options?: PrimeOptions): PrimeResult {
  const resolved = resolveOptions(options);
  return generateCaptcha(resolved);
}

/**
 * Async version of generate() for non-blocking use cases.
 * Use this if you are generating many captchas concurrently.
 * 
 * @param options - Optional configuration for captcha
 * @returns Promise<PrimeResult>
 */
export async function generateAsync(options?: PrimeOptions): Promise<PrimeResult> {
  return new Promise((resolve, reject) => {
    try {
      const result = generate(options);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

// Default export for easy import
export default { generate, generateAsync };

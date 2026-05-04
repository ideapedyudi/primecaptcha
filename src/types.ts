/**
 * Optional configuration for generating captcha.
 * All fields are optional with optimized default values.
 */
export interface PrimeOptions {
  /** Captcha type. 'text' for random alphanumeric, 'math' for simple math equations. Default: 'text' */
  type?: 'text' | 'math';
  /** Canvas width in pixels. Default: 200 */
  width?: number;
  /** Canvas height in pixels. Default: 80 */
  height?: number;
  /** Number of characters to generate (only for 'text' type). Default: 6 */
  length?: number;
  /** Font size in pixels. Default: 42 */
  fontSize?: number;
  /** Noise intensity (1 = minimal, 10 = maximal). Default: 5 */
  noiseIntensity?: number;
}

/**
 * Captcha generation result returned to the library user.
 */
export interface PrimeResult {
  /** PNG Buffer of the captcha image, ready to be sent as an HTTP response. */
  image: Buffer;
  /** Plaintext captcha text (or math answer) for session/database storage. */
  text: string;
}

/**
 * Internal configuration after merging with default values.
 * All fields are required to ensure type safety.
 */
export interface ResolvedOptions {
  type: 'text' | 'math';
  width: number;
  height: number;
  length: number;
  fontSize: number;
  noiseIntensity: number;
}

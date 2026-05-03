/**
 * Benchmark script to measure primecaptcha performance.
 * Run with: npx ts-node test/benchmark.ts
 */

import { generate } from '../src/index';

// ─── Benchmark Configuration ─────────────────────────────────────────────────
const WARMUP_RUNS = 100;    // Warmup to stabilize JIT compiler
const BENCH_RUNS = 1000;    // Number of generations per test
const DISPLAY_SAMPLE = 3;   // Number of samples to display

// ─── Utility Functions ────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printHeader(title: string): void {
  const line = '─'.repeat(50);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(line);
}

// ─── Benchmark Logic ──────────────────────────────────────────────────────────

function runBenchmark(label: string, runs: number, options?: Parameters<typeof generate>[0]): void {
  printHeader(`Benchmark: ${label}`);
  
  // Warmup phase
  process.stdout.write(`  Warming up (${WARMUP_RUNS} runs)... `);
  for (let i = 0; i < WARMUP_RUNS; i++) {
    generate(options);
  }
  console.log('✓');
  
  // Collect memory usage before benchmark
  const memBefore = process.memoryUsage().heapUsed;
  
  // Main benchmark phase
  console.log(`  Running ${formatNumber(runs)} iterations...`);
  const startTime = performance.now();
  
  const results: { textLength: number; imageSize: number }[] = [];
  
  for (let i = 0; i < runs; i++) {
    const result = generate(options);
    // Store first few samples for display
    if (i < DISPLAY_SAMPLE) {
      results.push({
        textLength: result.text.length,
        imageSize: result.image.length,
      });
    }
  }
  
  const endTime = performance.now();
  
  // Collect memory usage after benchmark
  const memAfter = process.memoryUsage().heapUsed;
  const memDiff = memAfter - memBefore;
  
  // Calculate statistics
  const totalMs = endTime - startTime;
  const avgMs = totalMs / runs;
  const opsPerSecond = Math.floor(1000 / avgMs);
  
  // Display results
  console.log('\n  📊 Results:');
  console.log(`     Total time      : ${totalMs.toFixed(2)} ms`);
  console.log(`     Average/run     : ${avgMs.toFixed(3)} ms`);
  console.log(`     Throughput      : ~${formatNumber(opsPerSecond)} captcha/sec`);
  console.log(`     Memory delta    : ${formatBytes(memDiff)}`);
  
  // Display sample output
  if (results.length > 0) {
    console.log(`\n  🖼️  Sample Output:`);
    const lastResult = generate(options);
    console.log(`     Captcha text    : "${lastResult.text}"`);
    console.log(`     Buffer size     : ${formatBytes(lastResult.image.length)}`);
  }
}

// ─── Main Execution ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🚀 PRIMECAPTCHA — Performance Benchmark');
  console.log('   Buffer-First | Zero Disk I/O | Crypto-Secure\n');
  
  // Test 1: Default config
  runBenchmark('Default Config (200x80, length=6)', BENCH_RUNS);
  
  // Test 2: High noise
  runBenchmark('High Noise Intensity (noiseIntensity=9)', BENCH_RUNS, {
    noiseIntensity: 9,
  });
  
  // Test 3: Larger canvas
  runBenchmark('Large Canvas (400x150, length=8)', Math.floor(BENCH_RUNS / 2), {
    width: 400,
    height: 150,
    length: 8,
    fontSize: 56,
  });
  
  // Test 4: Minimal config (fastest)
  runBenchmark('Minimal Config (150x60, length=4, noise=1)', BENCH_RUNS, {
    width: 150,
    height: 60,
    length: 4,
    fontSize: 36,
    noiseIntensity: 1,
  });
  
  console.log('\n─'.repeat(50));
  console.log('  ✅ Benchmark completed!');
  console.log('─'.repeat(50) + '\n');
}

main().catch(console.error);

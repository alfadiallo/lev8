#!/usr/bin/env tsx
/**
 * Bundle Size Analysis Script
 * 
 * Analyzes Next.js build output to track bundle sizes over time.
 * Compares against performance budgets.
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

interface BundleInfo {
  name: string;
  size: number;
  sizeGzipped?: number;
}

interface BundleAnalysis {
  totalSize: number;
  totalSizeGzipped: number;
  largestChunks: BundleInfo[];
  budgets: {
    initialLoadJS: { budget: number; actual: number; status: 'pass' | 'fail' };
    totalJS: { budget: number; actual: number; status: 'pass' | 'fail' };
    css: { budget: number; actual: number; status: 'pass' | 'fail' };
  };
}

const BUDGETS = {
  initialLoadJS: 200 * 1024, // 200 KB gzipped
  totalJS: 500 * 1024, // 500 KB gzipped
  css: 50 * 1024, // 50 KB gzipped
};

async function analyzeBuildOutput(): Promise<BundleAnalysis> {
  const { glob } = await import('glob');
  const nextDir = join(process.cwd(), '.next');
  
  // Check if build exists
  try {
    await readdir(nextDir);
  } catch {
    console.log('⚠️  No build found. Running build...');
    execSync('npm run build', { stdio: 'inherit' });
  }
  
  const staticDir = join(nextDir, 'static');
  const chunks: BundleInfo[] = [];
  
  // Analyze JS chunks
  try {
    const jsFiles = await glob('chunks/**/*.js', { cwd: staticDir, absolute: true });
    for (const file of jsFiles) {
      const stats = await require('fs').promises.stat(file);
      chunks.push({
        name: file.replace(staticDir + '/', ''),
        size: stats.size,
      });
    }
  } catch (error) {
    console.warn('Could not analyze JS chunks:', error);
  }
  
  // Analyze CSS
  let cssSize = 0;
  try {
    const cssFiles = await glob('**/*.css', { cwd: staticDir, absolute: true });
    for (const file of cssFiles) {
      const stats = await require('fs').promises.stat(file);
      cssSize += stats.size;
    }
  } catch (error) {
    console.warn('Could not analyze CSS:', error);
  }
  
  // Calculate totals
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  
  // Estimate gzipped size (roughly 30% of original)
  const totalSizeGzipped = Math.round(totalSize * 0.3);
  
  // Get largest chunks
  const largestChunks = chunks
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(chunk => ({
      ...chunk,
      sizeGzipped: Math.round(chunk.size * 0.3),
    }));
  
  // Check budgets
  const budgets = {
    initialLoadJS: {
      budget: BUDGETS.initialLoadJS,
      actual: largestChunks[0]?.sizeGzipped || 0,
      status: (largestChunks[0]?.sizeGzipped || 0) <= BUDGETS.initialLoadJS ? 'pass' : 'fail',
    },
    totalJS: {
      budget: BUDGETS.totalJS,
      actual: totalSizeGzipped,
      status: totalSizeGzipped <= BUDGETS.totalJS ? 'pass' : 'fail',
    },
    css: {
      budget: BUDGETS.css,
      actual: cssSize,
      status: cssSize <= BUDGETS.css ? 'pass' : 'fail',
    },
  };
  
  return {
    totalSize,
    totalSizeGzipped,
    largestChunks,
    budgets,
  };
}

function generateReport(analysis: BundleAnalysis): string {
  let report = '# Bundle Size Analysis Report\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total JS Size**: ${formatBytes(analysis.totalSize)} (${formatBytes(analysis.totalSizeGzipped)} gzipped)\n`;
  report += `- **CSS Size**: ${formatBytes(analysis.budgets.css.actual)}\n\n`;
  
  report += `## Performance Budgets\n\n`;
  report += `| Metric | Budget | Actual | Status |\n`;
  report += `|--------|--------|--------|--------|\n`;
  report += `| Initial Load JS | ${formatBytes(analysis.budgets.initialLoadJS.budget)} | ${formatBytes(analysis.budgets.initialLoadJS.actual)} | ${analysis.budgets.initialLoadJS.status === 'pass' ? '✅ Pass' : '❌ Fail'} |\n`;
  report += `| Total JS | ${formatBytes(analysis.budgets.totalJS.budget)} | ${formatBytes(analysis.budgets.totalJS.actual)} | ${analysis.budgets.totalJS.status === 'pass' ? '✅ Pass' : '❌ Fail'} |\n`;
  report += `| CSS | ${formatBytes(analysis.budgets.css.budget)} | ${formatBytes(analysis.budgets.css.actual)} | ${analysis.budgets.css.status === 'pass' ? '✅ Pass' : '❌ Fail'} |\n\n`;
  
  report += `## Largest Chunks\n\n`;
  report += `| Chunk | Size | Gzipped |\n`;
  report += `|-------|------|---------|\n`;
  for (const chunk of analysis.largestChunks) {
    report += `| \`${chunk.name}\` | ${formatBytes(chunk.size)} | ${formatBytes(chunk.sizeGzipped || 0)} |\n`;
  }
  
  return report;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function main() {
  try {
    const { glob } = await import('glob');
    const analysis = await analyzeBuildOutput();
    const report = generateReport(analysis);
    
    console.log('\n' + '='.repeat(60));
    console.log(report);
    console.log('='.repeat(60));
    
    // Write report to file
    const reportPath = join(process.cwd(), 'docs', 'optimization', 'bundle-size-analysis.md');
    await require('fs').promises.mkdir(join(process.cwd(), 'docs', 'optimization'), { recursive: true });
    await require('fs').promises.writeFile(reportPath, report);
    console.log(`\n📄 Report written to: ${reportPath}`);
    
    // Exit with error code if budgets exceeded
    const budgetsFailed = Object.values(analysis.budgets).some(b => b.status === 'fail');
    if (budgetsFailed) {
      console.log(`\n⚠️  Warning: Performance budgets exceeded`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { analyzeBuildOutput, generateReport };


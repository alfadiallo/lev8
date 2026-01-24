#!/usr/bin/env tsx
/**
 * Server Component Analysis Script
 * 
 * Identifies pages that should be converted to server components:
 * 1. Pages that only fetch data (no interactivity on initial load)
 * 2. Pages that use useEffect for data fetching
 * 3. Pages that could benefit from server-side rendering
 */

import { readFile } from 'fs/promises';
import { join, relative } from 'path';

interface PageAnalysis {
  file: string;
  isClientComponent: boolean;
  hasUseEffect: boolean;
  hasDataFetching: boolean;
  hasInteractivity: boolean;
  shouldBeServerComponent: boolean;
  reasons: string[];
}

async function analyzePage(filePath: string): Promise<PageAnalysis> {
  const content = await readFile(filePath, 'utf-8');
  const relativePath = relative(process.cwd(), filePath);
  
  const isClientComponent = content.includes("'use client'");
  const hasUseEffect = content.includes('useEffect');
  const hasDataFetching = content.includes('fetch(') || content.includes('useState') && content.includes('fetch');
  const hasInteractivity = content.includes('onClick') || 
                          content.includes('onChange') || 
                          content.includes('useState') && (content.includes('onClick') || content.includes('onChange'));
  
  const reasons: string[] = [];
  let shouldBeServerComponent = false;
  
  if (isClientComponent && hasDataFetching && !hasInteractivity) {
    shouldBeServerComponent = true;
    reasons.push('Fetches data but has no interactivity on initial load');
  }
  
  if (isClientComponent && hasUseEffect && content.includes('fetch')) {
    shouldBeServerComponent = true;
    reasons.push('Uses useEffect for data fetching (should use server component)');
  }
  
  if (isClientComponent && !hasInteractivity && hasDataFetching) {
    shouldBeServerComponent = true;
    reasons.push('Data-fetching page with no client-side interactivity');
  }
  
  return {
    file: relativePath,
    isClientComponent,
    hasUseEffect,
    hasDataFetching,
    hasInteractivity,
    shouldBeServerComponent,
    reasons,
  };
}

async function analyzePages(): Promise<PageAnalysis[]> {
  const { glob } = await import('glob');
  const pages = await glob('app/**/page.tsx', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/.next/**'],
  });
  
  const analyses: PageAnalysis[] = [];
  
  for (const page of pages) {
    const analysis = await analyzePage(page);
    analyses.push(analysis);
  }
  
  return analyses;
}

function generateReport(analyses: PageAnalysis[]): string {
  let report = '# Server Component Analysis Report\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  
  const total = analyses.length;
  const clientComponents = analyses.filter(a => a.isClientComponent).length;
  const serverComponents = total - clientComponents;
  const candidates = analyses.filter(a => a.shouldBeServerComponent).length;
  
  report += `- **Total Pages**: ${total}\n`;
  report += `- **Server Components**: ${serverComponents} (${Math.round(serverComponents / total * 100)}%)\n`;
  report += `- **Client Components**: ${clientComponents} (${Math.round(clientComponents / total * 100)}%)\n`;
  report += `- **Conversion Candidates**: ${candidates}\n\n`;
  
  if (candidates > 0) {
    report += `## Pages That Should Be Server Components\n\n`;
    report += `*These pages fetch data but have no interactivity on initial load*\n\n`;
    report += `| Page | Reasons |\n`;
    report += `|------|---------|\n`;
    for (const analysis of analyses.filter(a => a.shouldBeServerComponent)) {
      report += `| \`${analysis.file}\` | ${analysis.reasons.join('; ')} |\n`;
    }
    report += '\n';
  }
  
  report += `## All Pages\n\n`;
  report += `| Page | Type | Has useEffect | Has Data Fetching | Has Interactivity | Candidate |\n`;
  report += `|------|------|---------------|-------------------|-------------------|-----------|\n`;
  for (const analysis of analyses) {
    const type = analysis.isClientComponent ? 'Client' : 'Server';
    const candidate = analysis.shouldBeServerComponent ? '✅' : '';
    report += `| \`${analysis.file}\` | ${type} | ${analysis.hasUseEffect ? '✅' : ''} | ${analysis.hasDataFetching ? '✅' : ''} | ${analysis.hasInteractivity ? '✅' : ''} | ${candidate} |\n`;
  }
  
  return report;
}

async function main() {
  try {
    const analyses = await analyzePages();
    const report = generateReport(analyses);
    
    console.log('\n' + '='.repeat(60));
    console.log(report);
    console.log('='.repeat(60));
    
    // Write report to file
    const reportPath = join(process.cwd(), 'docs', 'optimization', 'server-component-analysis.md');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await require('fs').promises.mkdir(join(process.cwd(), 'docs', 'optimization'), { recursive: true });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await require('fs').promises.writeFile(reportPath, report);
    console.log(`\n📄 Report written to: ${reportPath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { analyzePages, generateReport };


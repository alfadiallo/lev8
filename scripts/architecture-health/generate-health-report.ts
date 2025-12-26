#!/usr/bin/env tsx
/**
 * Generate Comprehensive Architecture Health Report
 * 
 * Runs all architecture health checks and generates a combined report.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

async function generateHealthReport() {
  console.log('🔍 Running architecture health checks...\n');
  
  const reports: { name: string; path: string; content?: string }[] = [];
  
  // Run all audits
  try {
    console.log('1. Auditing API routes...');
    execSync('npm run audit:routes', { stdio: 'inherit' });
    reports.push({
      name: 'API Route Audit',
      path: join(process.cwd(), 'docs', 'optimization', 'api-route-audit.md'),
    });
  } catch (error) {
    console.warn('API route audit failed:', error);
  }
  
  try {
    console.log('\n2. Checking auth patterns...');
    execSync('npm run audit:auth', { stdio: 'inherit' });
    reports.push({
      name: 'Auth Pattern Compliance',
      path: join(process.cwd(), 'docs', 'optimization', 'auth-pattern-compliance.md'),
    });
  } catch (error) {
    console.warn('Auth pattern check failed:', error);
  }
  
  try {
    console.log('\n3. Analyzing bundle size...');
    execSync('npm run audit:bundle', { stdio: 'inherit' });
    reports.push({
      name: 'Bundle Size Analysis',
      path: join(process.cwd(), 'docs', 'optimization', 'bundle-size-analysis.md'),
    });
  } catch (error) {
    console.warn('Bundle size analysis failed:', error);
  }
  
  try {
    console.log('\n4. Analyzing server components...');
    execSync('tsx scripts/architecture-health/check-server-components.ts', { stdio: 'inherit' });
    reports.push({
      name: 'Server Component Analysis',
      path: join(process.cwd(), 'docs', 'optimization', 'server-component-analysis.md'),
    });
  } catch (error) {
    console.warn('Server component analysis failed:', error);
  }
  
  // Read all reports
  for (const report of reports) {
    try {
      report.content = await readFile(report.path, 'utf-8');
    } catch (error) {
      console.warn(`Could not read ${report.name}:`, error);
    }
  }
  
  // Generate combined report
  let combinedReport = '# Architecture Health Report\n\n';
  combinedReport += `**Generated**: ${new Date().toISOString()}\n\n`;
  combinedReport += `## Overview\n\n`;
  combinedReport += `This report combines findings from all architecture health checks.\n\n`;
  
  for (const report of reports) {
    if (report.content) {
      combinedReport += `## ${report.name}\n\n`;
      // Extract summary from each report
      const summaryMatch = report.content.match(/## Summary\n\n([\s\S]*?)(?=\n##|\n#|$)/);
      if (summaryMatch) {
        combinedReport += summaryMatch[1] + '\n\n';
      }
      combinedReport += `*Full report: [${report.name}](${report.path.replace(process.cwd() + '/', '')})*\n\n`;
    }
  }
  
  // Write combined report
  const combinedPath = join(process.cwd(), 'docs', 'optimization', 'architecture-health-report.md');
  await require('fs').promises.writeFile(combinedPath, combinedReport);
  console.log(`\n📄 Combined report written to: ${combinedPath}`);
  
  return combinedReport;
}

if (require.main === module) {
  generateHealthReport().catch(console.error);
}

export { generateHealthReport };


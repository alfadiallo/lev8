#!/usr/bin/env tsx
/**
 * API Route Usage Audit Script
 * 
 * Scans the codebase to:
 * 1. Find all API route files
 * 2. Find all fetch calls to API routes
 * 3. Map routes to their callers
 * 4. Identify unused routes
 * 5. Identify routes with single caller (candidate for server component)
 */

import { readFile } from 'fs/promises';
import { join, relative } from 'path';

interface RouteInfo {
  path: string;
  filePath: string;
  methods: string[];
  callers: string[];
  isUnused: boolean;
  callerCount: number;
}

interface AuditResult {
  totalRoutes: number;
  usedRoutes: number;
  unusedRoutes: number;
  routesWithSingleCaller: number;
  routes: RouteInfo[];
}

async function findAllApiRoutes(): Promise<RouteInfo[]> {
  const { glob } = await import('glob');
  const apiDir = join(process.cwd(), 'app', 'api');
  const routeFiles = await glob('**/route.ts', { cwd: apiDir, absolute: true });
  
  const routes: RouteInfo[] = [];
  
  for (const filePath of routeFiles) {
    const content = await readFile(filePath, 'utf-8');
    const relativePath = relative(apiDir, filePath).replace(/\/route\.ts$/, '');
    const apiPath = '/' + relativePath.replace(/\\/g, '/');
    
    // Detect HTTP methods
    const methods: string[] = [];
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function PATCH')) methods.push('PATCH');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    
    routes.push({
      path: apiPath,
      filePath: relative(process.cwd(), filePath),
      methods,
      callers: [],
      isUnused: false,
      callerCount: 0,
    });
  }
  
  return routes;
}

async function findApiCalls(): Promise<Map<string, string[]>> {
  const { glob } = await import('glob');
  const callMap = new Map<string, string[]>();
  
  // Find all TypeScript/JavaScript files (excluding node_modules, .next, etc.)
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**', 'scripts/**'],
  });
  
  for (const file of files) {
    const filePath = join(process.cwd(), file);
    const content = await readFile(filePath, 'utf-8');
    
    // Match fetch('/api/...') or fetch("/api/...") patterns
    const fetchPattern = /fetch\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    
    while ((match = fetchPattern.exec(content)) !== null) {
      const url = match[1];
      if (url.startsWith('/api/')) {
        // Normalize URL (remove query params, hash, etc.)
        const normalizedUrl = url.split('?')[0].split('#')[0];
        
        if (!callMap.has(normalizedUrl)) {
          callMap.set(normalizedUrl, []);
        }
        callMap.get(normalizedUrl)!.push(file);
      }
    }
  }
  
  return callMap;
}

async function auditRoutes(): Promise<AuditResult> {
  console.log('🔍 Scanning for API routes...');
  const routes = await findAllApiRoutes();
  console.log(`   Found ${routes.length} API routes`);
  
  console.log('🔍 Scanning for API calls...');
  const callMap = await findApiCalls();
  console.log(`   Found ${callMap.size} unique API endpoints being called`);
  
  // Map callers to routes
  for (const route of routes) {
    const callers = callMap.get(route.path) || [];
    route.callers = [...new Set(callers)]; // Remove duplicates
    route.callerCount = route.callers.length;
    route.isUnused = route.callerCount === 0;
  }
  
  const usedRoutes = routes.filter(r => !r.isUnused).length;
  const unusedRoutes = routes.filter(r => r.isUnused).length;
  const routesWithSingleCaller = routes.filter(r => r.callerCount === 1).length;
  
  return {
    totalRoutes: routes.length,
    usedRoutes,
    unusedRoutes,
    routesWithSingleCaller,
    routes: routes.sort((a, b) => {
      // Sort by: unused first, then by caller count
      if (a.isUnused !== b.isUnused) return a.isUnused ? -1 : 1;
      return a.callerCount - b.callerCount;
    }),
  };
}

function generateReport(result: AuditResult): string {
  let report = '# API Route Usage Audit Report\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Routes**: ${result.totalRoutes}\n`;
  report += `- **Used Routes**: ${result.usedRoutes}\n`;
  report += `- **Unused Routes**: ${result.unusedRoutes}\n`;
  report += `- **Routes with Single Caller**: ${result.routesWithSingleCaller}\n\n`;
  
  report += `## Unused Routes (${result.unusedRoutes})\n\n`;
  const unused = result.routes.filter(r => r.isUnused);
  if (unused.length === 0) {
    report += `✅ No unused routes found!\n\n`;
  } else {
    for (const route of unused) {
      report += `- \`${route.path}\` (${route.methods.join(', ')})\n`;
      report += `  - File: \`${route.filePath}\`\n`;
    }
    report += '\n';
  }
  
  report += `## Routes with Single Caller (${result.routesWithSingleCaller})\n\n`;
  report += `*These routes are candidates for conversion to server components*\n\n`;
  const singleCaller = result.routes.filter(r => r.callerCount === 1 && !r.isUnused);
  if (singleCaller.length === 0) {
    report += `✅ No routes with single caller found!\n\n`;
  } else {
    for (const route of singleCaller) {
      report += `- \`${route.path}\` (${route.methods.join(', ')})\n`;
      report += `  - Called from: \`${route.callers[0]}\`\n`;
    }
    report += '\n';
  }
  
  report += `## All Routes\n\n`;
  report += `| Route | Methods | Callers | Status |\n`;
  report += `|-------|---------|---------|--------|\n`;
  for (const route of result.routes) {
    const status = route.isUnused ? '❌ Unused' : route.callerCount === 1 ? '⚠️ Single' : '✅ Used';
    report += `| \`${route.path}\` | ${route.methods.join(', ')} | ${route.callerCount} | ${status} |\n`;
  }
  
  return report;
}

async function main() {
  try {
    const result = await auditRoutes();
    const report = generateReport(result);
    
    console.log('\n' + '='.repeat(60));
    console.log(report);
    console.log('='.repeat(60));
    
    // Write report to file
    const reportPath = join(process.cwd(), 'docs', 'optimization', 'api-route-audit.md');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await require('fs').promises.mkdir(join(process.cwd(), 'docs', 'optimization'), { recursive: true });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await require('fs').promises.writeFile(reportPath, report);
    console.log(`\n📄 Report written to: ${reportPath}`);
    
    // Exit with error code if unused routes found
    if (result.unusedRoutes > 0) {
      console.log(`\n⚠️  Warning: ${result.unusedRoutes} unused routes found`);
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

export { auditRoutes, generateReport };


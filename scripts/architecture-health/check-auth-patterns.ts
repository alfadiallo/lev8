#!/usr/bin/env tsx
/**
 * Auth Pattern Compliance Check
 * 
 * Verifies that the codebase follows the new authentication patterns:
 * 1. API routes use getApiUser() or checkApiPermission()
 * 2. Server components use getServerUser() or getServerUserWithProfile()
 * 3. No direct Supabase client creation in API routes (use getServerSupabaseClient)
 * 4. Minimal client-side getSession() calls
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

interface Violation {
  file: string;
  line: number;
  type: string;
  message: string;
}

interface AuditResult {
  violations: Violation[];
  apiRoutesChecked: number;
  serverComponentsChecked: number;
  clientComponentsChecked: number;
}

async function checkFile(filePath: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  // Check if it's an API route
  const isApiRoute = filePath.includes('/app/api/') && filePath.endsWith('/route.ts');
  const isServerComponent = !filePath.includes('/app/api/') && 
                            filePath.includes('/app/') && 
                            filePath.endsWith('.tsx') &&
                            !content.includes("'use client'");
  const isClientComponent = content.includes("'use client'");
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // API Route Checks
    if (isApiRoute) {
      // Check for direct Supabase client creation (should use getServerSupabaseClient)
      if (line.includes('createServerClient') && 
          !line.includes('getServerSupabaseClient') &&
          !line.includes('lib/supabase/server')) {
        violations.push({
          file: relativePath,
          line: lineNum,
          type: 'api-direct-client',
          message: 'API route creates Supabase client directly. Use getServerSupabaseClient() from lib/supabase/server',
        });
      }
      
      if (line.includes('createClient') && 
          line.includes('SUPABASE') &&
          !line.includes('getServiceSupabaseClient') &&
          !line.includes('lib/supabase/server')) {
        violations.push({
          file: relativePath,
          line: lineNum,
          type: 'api-direct-client',
          message: 'API route creates Supabase client directly. Use getServerSupabaseClient() or getServiceSupabaseClient()',
        });
      }
      
      // Check for direct auth checks (should use getApiUser or checkApiPermission)
      if (line.includes('supabase.auth.getUser') && 
          !line.includes('getApiUser') &&
          !line.includes('checkApiPermission')) {
        violations.push({
          file: relativePath,
          line: lineNum,
          type: 'api-direct-auth',
          message: 'API route checks auth directly. Use getApiUser() or checkApiPermission()',
        });
      }
    }
    
    // Server Component Checks
    if (isServerComponent) {
      // Check for client-side auth patterns
      if (line.includes('useAuth') || line.includes('useRouter')) {
        violations.push({
          file: relativePath,
          line: lineNum,
          type: 'server-client-hook',
          message: 'Server component uses client-side hook. Convert to server component pattern',
        });
      }
    }
    
    // Client Component Checks (should minimize getSession calls)
    if (isClientComponent && !filePath.includes('debug') && !filePath.includes('admin')) {
      if (line.includes('.auth.getSession()') || line.includes('.auth.onAuthStateChange')) {
        violations.push({
          file: relativePath,
          line: lineNum,
          type: 'client-get-session',
          message: 'Client component calls getSession(). Consider using server-provided data instead',
        });
      }
    }
  });
  
  return violations;
}

async function auditAuthPatterns(): Promise<AuditResult> {
  const { glob } = await import('glob');
  const violations: Violation[] = [];
  
  // Find all relevant files
  const apiRoutes = await glob('app/api/**/route.ts', { cwd: process.cwd(), absolute: true });
  const pages = await glob('app/**/*.{ts,tsx}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/.next/**', '**/api/**'],
  });
  
  console.log(`🔍 Checking ${apiRoutes.length} API routes...`);
  for (const file of apiRoutes) {
    const fileViolations = await checkFile(file);
    violations.push(...fileViolations);
  }
  
  console.log(`🔍 Checking ${pages.length} page files...`);
  for (const file of pages) {
    const fileViolations = await checkFile(file);
    violations.push(...fileViolations);
  }
  
  return {
    violations,
    apiRoutesChecked: apiRoutes.length,
    serverComponentsChecked: pages.filter(f => !f.includes('api')).length,
    clientComponentsChecked: 0, // Would need to check content
  };
}

function generateReport(result: AuditResult): string {
  let report = '# Auth Pattern Compliance Report\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **API Routes Checked**: ${result.apiRoutesChecked}\n`;
  report += `- **Server Components Checked**: ${result.serverComponentsChecked}\n`;
  report += `- **Violations Found**: ${result.violations.length}\n\n`;
  
  if (result.violations.length === 0) {
    report += `✅ **No violations found!** All code follows auth patterns.\n\n`;
    return report;
  }
  
  // Group violations by type
  const byType = new Map<string, Violation[]>();
  for (const violation of result.violations) {
    if (!byType.has(violation.type)) {
      byType.set(violation.type, []);
    }
    byType.get(violation.type)!.push(violation);
  }
  
  report += `## Violations by Type\n\n`;
  for (const [type, violations] of byType.entries()) {
    report += `### ${type} (${violations.length})\n\n`;
    report += `| File | Line | Message |\n`;
    report += `|------|------|---------|\n`;
    for (const v of violations) {
      report += `| \`${v.file}\` | ${v.line} | ${v.message} |\n`;
    }
    report += '\n';
  }
  
  return report;
}

async function main() {
  try {
    const result = await auditAuthPatterns();
    const report = generateReport(result);
    
    console.log('\n' + '='.repeat(60));
    console.log(report);
    console.log('='.repeat(60));
    
    // Write report to file
    const reportPath = join(process.cwd(), 'docs', 'optimization', 'auth-pattern-compliance.md');
    await require('fs').promises.mkdir(join(process.cwd(), 'docs', 'optimization'), { recursive: true });
    await require('fs').promises.writeFile(reportPath, report);
    console.log(`\n📄 Report written to: ${reportPath}`);
    
    // Exit with error code if violations found
    if (result.violations.length > 0) {
      console.log(`\n⚠️  Warning: ${result.violations.length} violations found`);
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

export { auditAuthPatterns, generateReport };


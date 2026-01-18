import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ImportRow {
  name: string;
  email: string;
  provider_type: string;
  credential?: string;
  site?: string;
  department?: string;
  director_email?: string;
}

interface ImportResult {
  row: number;
  name: string;
  email: string;
  status: 'success' | 'error' | 'duplicate';
  message?: string;
}

/**
 * POST /api/pulsecheck/admin/import
 * Import providers from CSV data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rows, imported_by } = body as { rows: ImportRow[], imported_by: string };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Pre-fetch sites, departments, and directors for matching
    const [sitesRes, deptsRes, directorsRes, existingProvidersRes] = await Promise.all([
      supabase.from('pulsecheck_sites').select('id, name'),
      supabase.from('pulsecheck_departments').select('id, name, site_id'),
      supabase.from('pulsecheck_directors').select('id, email, department_id'),
      supabase.from('pulsecheck_providers').select('email'),
    ]);

    const sites = sitesRes.data || [];
    const departments = deptsRes.data || [];
    const directors = directorsRes.data || [];
    const existingEmails = new Set((existingProvidersRes.data || []).map(p => p.email.toLowerCase()));

    const results: ImportResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Account for header row and 0-index

      // Validate required fields
      if (!row.name || !row.email || !row.provider_type) {
        results.push({
          row: rowNum,
          name: row.name || 'Unknown',
          email: row.email || 'Unknown',
          status: 'error',
          message: 'Missing required fields (name, email, or provider_type)',
        });
        errorCount++;
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        results.push({
          row: rowNum,
          name: row.name,
          email: row.email,
          status: 'error',
          message: 'Invalid email format',
        });
        errorCount++;
        continue;
      }

      // Check for duplicate
      if (existingEmails.has(row.email.toLowerCase())) {
        results.push({
          row: rowNum,
          name: row.name,
          email: row.email,
          status: 'duplicate',
          message: 'Provider with this email already exists',
        });
        duplicateCount++;
        continue;
      }

      // Validate provider type
      const providerType = row.provider_type.toLowerCase();
      if (providerType !== 'physician' && providerType !== 'apc') {
        results.push({
          row: rowNum,
          name: row.name,
          email: row.email,
          status: 'error',
          message: 'Invalid provider type. Must be "physician" or "apc"',
        });
        errorCount++;
        continue;
      }

      // Find department
      let departmentId: string | null = null;
      if (row.department) {
        const dept = departments.find(d => 
          d.name.toLowerCase() === row.department?.toLowerCase()
        );
        if (dept) {
          departmentId = dept.id;
        } else if (row.site) {
          // Try to find by site + department combination
          const site = sites.find(s => s.name.toLowerCase() === row.site?.toLowerCase());
          if (site) {
            const deptInSite = departments.find(d => 
              d.site_id === site.id && d.name.toLowerCase() === row.department?.toLowerCase()
            );
            if (deptInSite) {
              departmentId = deptInSite.id;
            }
          }
        }
      }

      // If no department found, try to get from director
      let directorId: string | null = null;
      if (row.director_email) {
        const director = directors.find(d => 
          d.email.toLowerCase() === row.director_email?.toLowerCase()
        );
        if (director) {
          directorId = director.id;
          if (!departmentId) {
            departmentId = director.department_id;
          }
        }
      }

      // Department is required
      if (!departmentId) {
        results.push({
          row: rowNum,
          name: row.name,
          email: row.email,
          status: 'error',
          message: 'Could not match site/department. Please ensure site and department names exist.',
        });
        errorCount++;
        continue;
      }

      // Insert the provider
      const { error: insertError } = await supabase
        .from('pulsecheck_providers')
        .insert({
          name: row.name,
          email: row.email.toLowerCase(),
          provider_type: providerType,
          credential: row.credential || null,
          primary_department_id: departmentId,
          primary_director_id: directorId,
          is_active: true,
        });

      if (insertError) {
        results.push({
          row: rowNum,
          name: row.name,
          email: row.email,
          status: 'error',
          message: insertError.message,
        });
        errorCount++;
      } else {
        results.push({
          row: rowNum,
          name: row.name,
          email: row.email,
          status: 'success',
        });
        successCount++;
        existingEmails.add(row.email.toLowerCase()); // Prevent duplicates within same import
      }
    }

    // Record import history
    if (imported_by) {
      await supabase
        .from('pulsecheck_imports')
        .insert({
          imported_by,
          filename: 'bulk_import',
          total_rows: rows.length,
          success_count: successCount,
          error_count: errorCount,
          duplicate_count: duplicateCount,
          errors: results.filter(r => r.status !== 'success'),
        });
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: rows.length,
        success: successCount,
        errors: errorCount,
        duplicates: duplicateCount,
      },
      results,
    });
  } catch (error) {
    console.error('[pulsecheck/admin/import] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

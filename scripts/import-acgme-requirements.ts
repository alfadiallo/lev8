/**
 * Import ACGME Requirements from JSON Catalog
 * 
 * Reads the unified ACGME catalog and imports into the database.
 * 
 * Usage: npx tsx scripts/import-acgme-requirements.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Note: SUPABASE_SERVICE_KEY (not ROLE)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'set' : 'missing');
  console.error('\nMake sure .env.local contains these variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface JSONRequirement {
  id: string;
  scope: string;
  section: string;
  category: string;
  title: string;
  text: string;
  risk_level: string;
  owner: string;
  compliance_logic: string;
  evidence_needed: string;
  last_updated: string;
  source_file: string;
}

interface JSONCatalog {
  metadata: {
    title: string;
    generated_date: string;
    total_count: number;
  };
  requirements: JSONRequirement[];
}

async function importRequirements() {
  console.log('Starting ACGME requirements import...\n');

  // Read the JSON catalog
  const catalogPath = path.join(
    process.cwd(),
    'docs/_guidance/ACGME CPR/v6 - Gemini/coreAnalyzedFiles/ACGME_Unified_Master_Catalog.json'
  );

  if (!fs.existsSync(catalogPath)) {
    console.error(`Catalog not found at: ${catalogPath}`);
    process.exit(1);
  }

  const catalogContent = fs.readFileSync(catalogPath, 'utf-8');
  const catalog: JSONCatalog = JSON.parse(catalogContent);

  console.log(`Catalog: ${catalog.metadata.title}`);
  console.log(`Generated: ${catalog.metadata.generated_date}`);
  console.log(`Total requirements: ${catalog.metadata.total_count}\n`);

  // Transform requirements for database
  // Note: parent_id is set to null to avoid FK constraint issues during initial import
  // Parent-child relationships can be established later if needed
  const requirements = catalog.requirements.map(req => ({
    id: req.id,
    scope: req.scope || 'UNIVERSAL',
    section: req.section,
    category: req.category,
    title: req.title,
    text: req.text,
    risk_level: req.risk_level || 'Medium',
    owner: req.owner || 'PD',
    compliance_logic: req.compliance_logic || null,
    evidence_needed: req.evidence_needed || null,
    source_file: req.source_file || null,
    parent_id: null, // Disabled for initial import - can be set later
  }));

  // Validate data
  const validScopes = ['UNIVERSAL', 'EM_SPECIFIC', 'FELLOWSHIP'];
  const validRiskLevels = ['Critical', 'High', 'Medium', 'Low'];
  const validOwners = ['DIO', 'PD', 'PC', 'APD', 'Faculty', 'Resident'];

  let errors = 0;
  for (const req of requirements) {
    if (!validScopes.includes(req.scope)) {
      console.warn(`Invalid scope for ${req.id}: ${req.scope}, defaulting to UNIVERSAL`);
      req.scope = 'UNIVERSAL';
    }
    if (!validRiskLevels.includes(req.risk_level)) {
      console.warn(`Invalid risk_level for ${req.id}: ${req.risk_level}, defaulting to Medium`);
      req.risk_level = 'Medium';
    }
    if (!validOwners.includes(req.owner)) {
      console.warn(`Invalid owner for ${req.id}: ${req.owner}, defaulting to PD`);
      req.owner = 'PD';
    }
  }

  // Sort by ID to ensure parents are inserted before children
  requirements.sort((a, b) => {
    const aParts = a.id.split(/[.-]/);
    const bParts = b.id.split(/[.-]/);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || '';
      const bVal = bParts[i] || '';
      const aNum = parseInt(aVal) || 0;
      const bNum = parseInt(bVal) || 0;
      if (aNum !== bNum) return aNum - bNum;
      if (aVal !== bVal) return aVal.localeCompare(bVal);
    }
    return 0;
  });

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < requirements.length; i += batchSize) {
    const batch = requirements.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('acgme_requirements')
      .upsert(batch, { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      errors++;
    } else {
      inserted += data?.length || 0;
      console.log(`Processed batch ${i / batchSize + 1}: ${data?.length || 0} requirements`);
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Total processed: ${requirements.length}`);
  console.log(`Successfully upserted: ${inserted}`);
  console.log(`Errors: ${errors}`);

  // Verify counts by category
  const { data: categoryCounts } = await supabase
    .from('acgme_requirements')
    .select('category')
    .order('category');

  if (categoryCounts) {
    const counts: Record<string, number> = {};
    categoryCounts.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    
    console.log('\nRequirements by Category:');
    Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });
  }

  // Verify counts by risk level
  const { data: riskCounts } = await supabase
    .from('acgme_requirements')
    .select('risk_level');

  if (riskCounts) {
    const counts: Record<string, number> = {};
    riskCounts.forEach(r => {
      counts[r.risk_level] = (counts[r.risk_level] || 0) + 1;
    });
    
    console.log('\nRequirements by Risk Level:');
    Object.entries(counts)
      .sort((a, b) => {
        const order = ['Critical', 'High', 'Medium', 'Low'];
        return order.indexOf(a[0]) - order.indexOf(b[0]);
      })
      .forEach(([risk, count]) => {
        console.log(`  ${risk}: ${count}`);
      });
  }
}

/**
 * Determine parent ID from requirement ID
 * e.g., "CPR-1.3.a" -> "CPR-1.3"
 *       "CPR-1.3" -> "CPR-1"
 *       "CPR-1" -> null
 */
function determineParentId(id: string): string | null {
  // Match patterns like CPR-1.3.a or CPR-1.3
  const parts = id.split(/[.-]/);
  
  if (parts.length <= 2) {
    // e.g., "CPR-1" has no parent
    return null;
  }

  // Remove the last part to get parent
  // Handle letter suffixes (a, b, c)
  const lastPart = parts[parts.length - 1];
  if (/^[a-z]$/.test(lastPart)) {
    // e.g., "CPR-1.3.a" -> "CPR-1.3"
    parts.pop();
    return parts.slice(0, 2).join('-') + (parts.length > 2 ? '.' + parts.slice(2).join('.') : '');
  } else {
    // e.g., "CPR-1.3" -> "CPR-1"
    parts.pop();
    return parts.slice(0, 2).join('-') + (parts.length > 2 ? '.' + parts.slice(2).join('.') : '');
  }
}

importRequirements().catch(console.error);


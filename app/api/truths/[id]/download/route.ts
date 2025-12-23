import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTruthDocumentUrl } from '@/lib/truths/storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/truths/[id]/download
 * Get a signed URL to download a truth document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id } = params;
    
    // Get the document metadata
    const { data: document, error: fetchError } = await supabase
      .from('truth_documents')
      .select('storage_path, file_name, file_type')
      .eq('id', id)
      .single();
    
    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Get signed URL (valid for 1 hour)
    const signedUrl = await getTruthDocumentUrl(document.storage_path, 3600);
    
    return NextResponse.json({
      url: signedUrl,
      file_name: document.file_name,
      file_type: document.file_type
    });
  } catch (error) {
    console.error('[API /api/truths/[id]/download GET] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



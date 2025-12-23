import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteTruthDocument } from '@/lib/truths/storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * DELETE /api/truths/[id]
 * Delete a truth document (super_admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id } = params;
    
    // Get the document to find its storage path
    const { data: document, error: fetchError } = await supabase
      .from('truth_documents')
      .select('storage_path')
      .eq('id', id)
      .single();
    
    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete from storage
    await deleteTruthDocument(document.storage_path);
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from('truth_documents')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('[API /api/truths/[id] DELETE] Database error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('[API /api/truths/[id] DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



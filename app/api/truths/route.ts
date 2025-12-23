import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadTruthDocument, getFileTypeFromName } from '@/lib/truths/storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/truths
 * List all truth documents with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let query = supabase
      .from('truth_documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    // Search by title or description if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[API /api/truths GET] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    console.error('[API /api/truths GET] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/truths
 * Upload a new truth document (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const category = formData.get('category') as string;
    const tagsString = formData.get('tags') as string | null;
    const visibility = (formData.get('visibility') as string) || 'all';
    const version = (formData.get('version') as string) || '1.0';
    
    // Validate required fields
    if (!file || !title || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: file, title, category' },
        { status: 400 }
      );
    }
    
    // Parse tags
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : null;
    
    // Upload file to storage
    const storagePath = await uploadTruthDocument(file, { title, category });
    
    // Get file type from filename
    const fileType = getFileTypeFromName(file.name);
    
    // Insert document metadata into database
    const { data, error } = await supabase
      .from('truth_documents')
      .insert({
        title,
        description,
        category,
        file_name: file.name,
        file_type: fileType,
        file_size_bytes: file.size,
        storage_path: storagePath,
        visibility,
        version,
        tags
      })
      .select()
      .single();
    
    if (error) {
      console.error('[API /api/truths POST] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      id: data.id,
      message: 'Document uploaded successfully',
      document: data
    });
  } catch (error) {
    console.error('[API /api/truths POST] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



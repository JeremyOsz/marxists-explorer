import { NextResponse } from 'next/server';
import { loadThinker, getThinkerSubjects } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/thinkers/[category]/[name]
 * Returns a specific thinker with all their works
 * 
 * Query parameters:
 * - metadata_only: boolean - If true, returns only metadata without works
 */
export async function GET(
  request: Request,
  { params }: { params: { category: string; name: string } }
) {
  try {
    const category = decodeURIComponent(params.category);
    const name = decodeURIComponent(params.name);
    
    // Check if metadata_only query param is set
    const { searchParams } = new URL(request.url);
    const metadataOnly = searchParams.get('metadata_only') === 'true';
    
    if (metadataOnly) {
      // Return just the subjects without loading all works
      const subjects = await getThinkerSubjects(category, name);
      
      return NextResponse.json({
        success: true,
        data: {
          category,
          name,
          subjects,
        },
      });
    }
    
    // Load full thinker data with all works
    const thinker = await loadThinker(category, name);
    
    if (!thinker) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thinker not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: thinker,
    });
  } catch (error) {
    console.error(`Error loading thinker ${params.category}/${params.name}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to load thinker: ${params.name}`,
      },
      { status: 500 }
    );
  }
}


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
  { params }: { params: Promise<{ category: string; name: string }> }
) {
  try {
    const { category: categoryParam, name: nameParam } = await params;
    const category = decodeURIComponent(categoryParam);
    const name = decodeURIComponent(nameParam);
    
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
    const { category: categoryParam, name: nameParam } = await params;
    console.error(`Error loading thinker ${categoryParam}/${nameParam}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to load thinker: ${nameParam}`,
      },
      { status: 500 }
    );
  }
}


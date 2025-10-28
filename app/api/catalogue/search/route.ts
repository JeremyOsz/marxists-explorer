import { NextResponse } from 'next/server';
import { loadAllThinkersMetadata } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/search
 * Search thinkers by name, description, or category
 * 
 * Query parameters:
 * - q: search query
 * - category: filter by category
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const categoryFilter = searchParams.get('category')?.toLowerCase();
    
    if (!query && !categoryFilter) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a search query (q) or category filter',
        },
        { status: 400 }
      );
    }
    
    const allThinkers = await loadAllThinkersMetadata();
    
    let results = allThinkers;
    
    // Filter by category if provided
    if (categoryFilter) {
      results = results.filter(t => 
        t.category.toLowerCase().includes(categoryFilter)
      );
    }
    
    // Filter by search query if provided
    if (query) {
      results = results.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        query,
        category: categoryFilter,
        results,
        count: results.length,
      },
    });
  } catch (error) {
    console.error('Error searching catalogue:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search catalogue',
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { loadAllThinkersMetadata } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/random/thinker
 * Returns a random thinker
 * 
 * Query parameters:
 * - category: Optional category filter
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category')?.toLowerCase();
    
    const allThinkers = await loadAllThinkersMetadata();
    
    let thinkers = allThinkers;
    
    // Filter by category if provided
    if (categoryFilter) {
      thinkers = thinkers.filter(t => 
        t.category.toLowerCase().includes(categoryFilter)
      );
    }
    
    if (thinkers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No thinkers found matching criteria',
        },
        { status: 404 }
      );
    }
    
    // Select random thinker
    const randomIndex = Math.floor(Math.random() * thinkers.length);
    const randomThinker = thinkers[randomIndex];
    
    return NextResponse.json({
      success: true,
      data: randomThinker,
    });
  } catch (error) {
    console.error('Error getting random thinker:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get random thinker',
      },
      { status: 500 }
    );
  }
}


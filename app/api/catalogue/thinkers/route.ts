import { NextResponse } from 'next/server';
import { loadAllThinkersMetadata } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/thinkers
 * Returns all thinkers from all categories (metadata only, no works)
 */
export async function GET() {
  try {
    const thinkers = await loadAllThinkersMetadata();
    
    return NextResponse.json({
      success: true,
      data: {
        thinkers,
        count: thinkers.length,
      },
    });
  } catch (error) {
    console.error('Error loading thinkers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load thinkers',
      },
      { status: 500 }
    );
  }
}


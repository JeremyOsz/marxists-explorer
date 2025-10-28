import { NextResponse } from 'next/server';
import { loadCategoryThinkersMetadata } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/categories/[category]
 * Returns all thinkers in a specific category (metadata only, no works)
 */
export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  try {
    const category = decodeURIComponent(params.category);
    const thinkers = await loadCategoryThinkersMetadata(category);
    
    return NextResponse.json({
      success: true,
      data: {
        category,
        thinkers,
        count: thinkers.length,
      },
    });
  } catch (error) {
    console.error(`Error loading category ${params.category}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to load category: ${params.category}`,
      },
      { status: 500 }
    );
  }
}


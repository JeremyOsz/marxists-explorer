import { NextResponse } from 'next/server';
import { loadCategoryThinkersMetadata } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/categories/[category]
 * Returns all thinkers in a specific category (metadata only, no works)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category: categoryParam } = await params;
    const category = decodeURIComponent(categoryParam);
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
    const { category: categoryParam } = await params;
    console.error(`Error loading category ${categoryParam}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to load category: ${categoryParam}`,
      },
      { status: 500 }
    );
  }
}


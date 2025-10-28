import { NextResponse } from 'next/server';
import { loadCategoryIndex } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue
 * Returns the complete catalogue index with all categories
 */
export async function GET() {
  try {
    const index = await loadCategoryIndex();
    
    return NextResponse.json({
      success: true,
      data: index,
    });
  } catch (error) {
    console.error('Error loading catalogue:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load catalogue',
      },
      { status: 500 }
    );
  }
}


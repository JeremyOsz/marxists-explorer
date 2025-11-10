import { NextResponse } from 'next/server';
import { getAvailableCategories } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/categories
 * Returns list of all available categories
 */
export async function GET() {
  try {
    const categories = await getAvailableCategories();
    
    return NextResponse.json({
      success: true,
      data: {
        categories,
        count: categories.length,
      },
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load categories',
      },
      { status: 500 }
    );
  }
}


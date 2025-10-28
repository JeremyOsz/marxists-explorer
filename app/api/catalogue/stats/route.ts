import { NextResponse } from 'next/server';
import { loadAllThinkersMetadata, loadCategoryIndex } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/stats
 * Returns statistics about the entire catalogue
 */
export async function GET() {
  try {
    const [thinkers, index] = await Promise.all([
      loadAllThinkersMetadata(),
      loadCategoryIndex(),
    ]);
    
    // Calculate total works
    const totalWorks = thinkers.reduce((sum, t) => sum + (t.workCount || 0), 0);
    
    // Get top categories by thinker count
    const categoryStats = new Map<string, { thinkers: number; works: number }>();
    
    for (const thinker of thinkers) {
      const current = categoryStats.get(thinker.category) || { thinkers: 0, works: 0 };
      categoryStats.set(thinker.category, {
        thinkers: current.thinkers + 1,
        works: current.works + (thinker.workCount || 0),
      });
    }
    
    const topCategories = Array.from(categoryStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.works - a.works)
      .slice(0, 10);
    
    // Get most prolific thinkers
    const mostProlific = thinkers
      .filter(t => t.workCount && t.workCount > 0)
      .sort((a, b) => (b.workCount || 0) - (a.workCount || 0))
      .slice(0, 10)
      .map(t => ({
        name: t.name,
        category: t.category,
        works: t.workCount,
      }));
    
    // Count unique subjects across all thinkers
    const allSubjects = new Set<string>();
    for (const thinker of thinkers) {
      if (thinker.works) {
        // This would need subject data, for now approximate
        allSubjects.add('Political Theory');
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalThinkers: thinkers.length,
        totalWorks,
        totalCategories: index.categories.length,
        averageWorksPerThinker: Math.round(totalWorks / thinkers.length),
        topCategories,
        mostProlificThinkers: mostProlific,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error loading statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load statistics',
      },
      { status: 500 }
    );
  }
}


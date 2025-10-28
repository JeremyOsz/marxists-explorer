import { NextResponse } from 'next/server';
import { loadAllThinkersMetadata, getThinkerSubjects } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/thinkers/compare
 * Compare multiple thinkers
 * 
 * Query parameters:
 * - thinkers: Comma-separated list of thinker names
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const thinkersParam = searchParams.get('thinkers');
    
    if (!thinkersParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide thinkers parameter (comma-separated names)',
        },
        { status: 400 }
      );
    }
    
    const thinkerNames = thinkersParam.split(',').map(n => n.trim());
    
    if (thinkerNames.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide at least 2 thinkers to compare',
        },
        { status: 400 }
      );
    }
    
    const allThinkers = await loadAllThinkersMetadata();
    
    // Find the requested thinkers
    const comparison = [];
    const notFound = [];
    
    for (const name of thinkerNames) {
      const thinker = allThinkers.find(t => 
        t.name.toLowerCase() === name.toLowerCase()
      );
      
      if (thinker) {
        // Get subjects for this thinker
        const subjects = await getThinkerSubjects(thinker.category, thinker.name);
        
        comparison.push({
          name: thinker.name,
          category: thinker.category,
          description: thinker.description,
          works: thinker.workCount || 0,
          subjects: subjects.length,
          subjectList: subjects,
          majorWorks: thinker.majorWorks?.length || 0,
        });
      } else {
        notFound.push(name);
      }
    }
    
    if (comparison.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No thinkers found: ${notFound.join(', ')}`,
        },
        { status: 404 }
      );
    }
    
    // Find shared subjects
    const subjectSets = comparison.map(t => new Set(t.subjectList));
    const sharedSubjects = Array.from(subjectSets[0]).filter(subject =>
      subjectSets.every(set => set.has(subject))
    );
    
    return NextResponse.json({
      success: true,
      data: {
        comparison: comparison.map(t => ({
          ...t,
          subjectList: undefined, // Remove from output, keep for shared calculation
        })),
        sharedSubjects,
        notFound: notFound.length > 0 ? notFound : undefined,
      },
    });
  } catch (error) {
    console.error('Error comparing thinkers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compare thinkers',
      },
      { status: 500 }
    );
  }
}


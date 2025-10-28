import { NextResponse } from 'next/server';
import { loadThinkerWorksBySubject } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/thinkers/[category]/[name]/subjects/[subject]
 * Returns works for a specific thinker and subject
 */
export async function GET(
  request: Request,
  { params }: { params: { category: string; name: string; subject: string } }
) {
  try {
    const category = decodeURIComponent(params.category);
    const name = decodeURIComponent(params.name);
    const subject = decodeURIComponent(params.subject);
    
    const works = await loadThinkerWorksBySubject(category, name, subject);
    
    return NextResponse.json({
      success: true,
      data: {
        category,
        thinker: name,
        subject,
        works,
        count: works.length,
      },
    });
  } catch (error) {
    console.error(`Error loading works for ${params.name}/${params.subject}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to load works for subject: ${params.subject}`,
      },
      { status: 500 }
    );
  }
}


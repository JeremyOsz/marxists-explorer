import { NextResponse } from 'next/server';
import { loadThinkerWorksBySubject } from '@/lib/data/folder-loader';

/**
 * GET /api/catalogue/thinkers/[category]/[name]/subjects/[subject]
 * Returns works for a specific thinker and subject
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; name: string; subject: string }> }
) {
  try {
    const { category: categoryParam, name: nameParam, subject: subjectParam } = await params;
    const category = decodeURIComponent(categoryParam);
    const name = decodeURIComponent(nameParam);
    const subject = decodeURIComponent(subjectParam);
    
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
    const { name: nameParam, subject: subjectParam } = await params;
    console.error(`Error loading works for ${nameParam}/${subjectParam}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to load works for subject: ${subjectParam}`,
      },
      { status: 500 }
    );
  }
}


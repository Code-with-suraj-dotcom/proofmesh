import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [sources, claims] = await Promise.all([
      repository.getSources(id),
      repository.getClaims(id),
    ]);

    // Attach extracted claim count to each source
    const sourcesWithClaims = sources.map((src) => {
      const relatedClaims = claims.filter((c) => c.source_id === src.id);
      return {
        ...src,
        claim_count: relatedClaims.length,
        claims: relatedClaims,
      };
    });

    return NextResponse.json({ sources: sourcesWithClaims });
  } catch (err) {
    console.error('[API GET /api/research/[id]/sources Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}


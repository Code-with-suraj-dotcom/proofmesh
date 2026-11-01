import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [contradictions, claims, sources] = await Promise.all([
      repository.getContradictions(id),
      repository.getClaims(id),
      repository.getSources(id),
    ]);

    const enriched = contradictions.map((ct) => {
      const claimA = claims.find((c) => c.id === ct.claim_a_id);
      const claimB = claims.find((c) => c.id === ct.claim_b_id);
      const srcA = claimA ? sources.find((s) => s.id === claimA.source_id) : undefined;
      const srcB = claimB ? sources.find((s) => s.id === claimB.source_id) : undefined;

      return {
        ...ct,
        claim_a: claimA ? { ...claimA, source: srcA } : ct.claim_a,
        claim_b: claimB ? { ...claimB, source: srcB } : ct.claim_b,
      };
    });

    return NextResponse.json({ contradictions: enriched });
  } catch (err) {
    console.error('[API GET /api/research/[id]/contradictions Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch contradictions' }, { status: 500 });
  }
}


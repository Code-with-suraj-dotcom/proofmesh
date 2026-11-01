import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [claims, sources, objectives] = await Promise.all([
      repository.getClaims(id),
      repository.getSources(id),
      repository.getObjectives(id),
    ]);

    const enrichedClaims = claims.map((c) => {
      const src = sources.find((s) => s.id === c.source_id);
      const obj = objectives.find((o) => o.id === c.objective_id);
      return {
        ...c,
        source: src || c.source,
        objective: obj
          ? { id: obj.id, title: obj.title, specialization: obj.specialization }
          : c.objective,
      };
    });

    return NextResponse.json({ claims: enrichedClaims });
  } catch (err) {
    console.error('[API GET /api/research/[id]/claims Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}


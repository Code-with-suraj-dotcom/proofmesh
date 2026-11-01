import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const graph = await repository.getEvidenceGraph(id);
    return NextResponse.json(graph);
  } catch (err) {
    console.error('[API GET /api/research/[id]/graph Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch evidence graph' }, { status: 500 });
  }
}


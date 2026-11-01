import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await repository.getReport(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not generated yet' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error('[API GET /api/research/[id]/report Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}


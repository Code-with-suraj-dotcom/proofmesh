import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';
import { temporalIntelligence } from '@/research-engine/temporal';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await repository.getSession(id);
    if (!session) {
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 });
    }

    let report = await temporalIntelligence.getLatestDifferential(id);
    if (!report) {
      report = await temporalIntelligence.runDifferentialAudit(id);
    }

    return NextResponse.json({
      research_id: id,
      report,
    });
  } catch (err) {
    console.error('[API GET /api/research/[id]/temporal Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch temporal differential' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await repository.getSession(id);
    if (!session) {
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 });
    }

    const report = await temporalIntelligence.runDifferentialAudit(id);
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error('[API POST /api/research/[id]/temporal Error]:', err);
    return NextResponse.json({ error: 'Failed to run temporal differential audit' }, { status: 500 });
  }
}


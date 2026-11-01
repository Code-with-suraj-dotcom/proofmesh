import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';
import { aggregator } from '@/research-engine/aggregator';

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

    await repository.updateSession(id, {
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    });

    await aggregator.emitEvent(
      id,
      'research_completed',
      'Research investigation was cancelled by user.',
      'cancelled'
    );

    return NextResponse.json({ success: true, message: 'Session cancelled' });
  } catch (err) {
    console.error('[API POST /api/research/[id]/cancel Error]:', err);
    return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id') || undefined;

    const tasks = await repository.getWebsiteTasks(id, agentId);
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('[API GET /api/research/[id]/tasks Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch website tasks' }, { status: 500 });
  }
}


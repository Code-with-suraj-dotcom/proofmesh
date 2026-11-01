import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';
import { reproducibilityService } from '@/research-engine/reproducibility';

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

    let snapshots = await reproducibilityService.listSnapshots(id);
    if (snapshots.length === 0) {
      const initialSnapshot = await reproducibilityService.createSnapshot(id, 'Initial Baseline Snapshot');
      snapshots = [initialSnapshot];
    }

    return NextResponse.json({
      research_id: id,
      total: snapshots.length,
      snapshots,
    });
  } catch (err) {
    console.error('[API GET /api/research/[id]/snapshots Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch research snapshots' }, { status: 500 });
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

    const body = await req.json();
    const { action, label, versionA, versionB } = body;

    if (action === 'compare') {
      if (typeof versionA !== 'number' || typeof versionB !== 'number') {
        return NextResponse.json(
          { error: 'versionA and versionB numbers are required for comparison' },
          { status: 400 }
        );
      }

      const comparison = await reproducibilityService.compareSnapshots(id, versionA, versionB);
      return NextResponse.json({ success: true, comparison });
    }

    // Default action: Create new snapshot
    const newSnapshot = await reproducibilityService.createSnapshot(
      id,
      label || 'Manual User Milestone Snapshot'
    );

    return NextResponse.json({
      success: true,
      snapshot: newSnapshot,
    });
  } catch (err) {
    console.error('[API POST /api/research/[id]/snapshots Error]:', err);
    return NextResponse.json({ error: 'Failed to process snapshot action' }, { status: 500 });
  }
}


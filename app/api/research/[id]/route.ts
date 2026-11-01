import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';

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

    const [objectives, agents, websiteTasks, sources, claims, contradictions, report] =
      await Promise.all([
        repository.getObjectives(id),
        repository.getAgents(id),
        repository.getWebsiteTasks(id),
        repository.getSources(id),
        repository.getClaims(id),
        repository.getContradictions(id),
        repository.getReport(id),
      ]);

    // Attach website tasks to corresponding agents
    const agentsWithTasks = agents.map((agent) => ({
      ...agent,
      website_tasks: websiteTasks.filter((t) => t.agent_id === agent.id),
    }));

    return NextResponse.json({
      session,
      objectives,
      agents: agentsWithTasks,
      websiteTasks,
      sourcesCount: sources.length,
      claimsCount: claims.length,
      contradictionsCount: contradictions.length,
      report,
    });
  } catch (err) {
    console.error('[API GET /api/research/[id] Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch research session details' }, { status: 500 });
  }
}


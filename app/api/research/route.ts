import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { repository } from '@/database/store';
import { orchestrator } from '@/research-engine/orchestrator';
import { eventEmitter } from '@/observability/event-emitter';
import { ResearchSession } from '@/types/research';

const CreateResearchSchema = z.object({
  query: z.string().min(5, 'Research question must be at least 5 characters long.'),
  depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  domain_filters: z.array(z.string()).optional(),
  source_types: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateResearchSchema.parse(body);

    const sessionId = crypto.randomUUID();
    const newSession: ResearchSession = {
      id: sessionId,
      query: parsed.query.trim(),
      depth: parsed.depth,
      status: 'queued',
      total_objectives: 0,
      completed_objectives: 0,
      total_agents: 0,
      active_agents: 0,
      successful_agents: 0,
      failed_agents: 0,
      total_website_tasks: 0,
      completed_website_tasks: 0,
      failed_website_tasks: 0,
      sources_discovered: 0,
      claims_extracted: 0,
      claims_validated: 0,
      created_at: new Date().toISOString(),
      metadata: {
        domain_filters: parsed.domain_filters || [],
        source_types: parsed.source_types || [],
      },
    };

    await repository.createSession(newSession);
    await eventEmitter.emitResearchCreated(sessionId, parsed.query.trim(), parsed.depth);

    // Launch pipeline in background (does not block HTTP response)
    // Run asynchronously
    setTimeout(() => {
      orchestrator.runPipeline(sessionId).catch((err) => {
        console.error(`[API Background Pipeline Error for ${sessionId}]:`, err);
      });
    }, 100);

    return NextResponse.json({
      success: true,
      sessionId,
      session: newSession,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: (err as any).issues?.[0]?.message || 'Invalid input' }, { status: 400 });
    }
    console.error('[API POST /api/research Error]:', err);
    return NextResponse.json({ error: 'Failed to initiate research session' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sessions = await repository.listSessions();
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[API GET /api/research Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}


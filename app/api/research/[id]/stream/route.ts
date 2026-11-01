import { NextRequest } from 'next/server';
import { createResearchEventStream } from '@/observability/event-stream';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return createResearchEventStream({ researchId: id, signal: req.signal });
}


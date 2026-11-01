import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/database/store';
import { adversarialEngine, AdversarialEvaluation } from '@/research-engine/adversarial';
import { researchCompiler, FalsifiablePredicate, AdversarialPairing } from '@/research-engine/compiler';

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

    const [claims, contradictions, objectives] = await Promise.all([
      repository.getClaims(id),
      repository.getContradictions(id),
      repository.getObjectives(id),
    ]);

    // Compile formal predicates and adversarial pairings for this query
    const compiled = await researchCompiler.compile(session.query, session.depth);
    const predicates = compiled.falsifiable_predicates;
    const pairings = compiled.adversarial_pairings;

    const evaluations: AdversarialEvaluation[] = predicates.map((pred: FalsifiablePredicate) => {
      const pairing = pairings.find((p: AdversarialPairing) => p.predicate_id === pred.id);
      return adversarialEngine.evaluatePredicate(pred, pairing, claims);
    });

    const proponentTotal = evaluations.reduce((sum, e) => sum + e.proponent_claims_count, 0);
    const skepticTotal = evaluations.reduce((sum, e) => sum + e.skeptic_claims_count, 0);
    const avgTruthIndex =
      evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + e.truth_index, 0) / evaluations.length
        : 0.5;

    const falsifiedCount = evaluations.filter((e) => e.falsification_triggered).length;
    const contestedCount = evaluations.filter((e) => e.verdict === 'contested').length;
    const supportedCount = evaluations.filter((e) => e.verdict === 'supported').length;

    return NextResponse.json({
      research_id: id,
      metrics: {
        total_predicates: predicates.length,
        proponent_claims_count: proponentTotal,
        skeptic_claims_count: skepticTotal,
        average_truth_index: Number(avgTruthIndex.toFixed(3)),
        supported_count: supportedCount,
        falsified_count: falsifiedCount,
        contested_count: contestedCount,
        contradictions_detected: contradictions.length,
      },
      evaluations,
      pairings,
    });
  } catch (err) {
    console.error('[API GET /api/research/[id]/adversarial Error]:', err);
    return NextResponse.json({ error: 'Failed to compute adversarial evaluations' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { claim_id, skeptic_agent_name, critique } = body;

    if (!claim_id || !critique) {
      return NextResponse.json(
        { error: 'claim_id and critique are required' },
        { status: 400 }
      );
    }

    await adversarialEngine.auditClaimChallenge(
      id,
      claim_id,
      skeptic_agent_name || 'Independent Skeptic Agent',
      critique
    );

    return NextResponse.json({
      success: true,
      claim_id,
      audited_at: new Date().toISOString(),
      message: 'Adversarial critique appended to permanent chain of custody.',
    });
  } catch (err) {
    console.error('[API POST /api/research/[id]/adversarial Error]:', err);
    return NextResponse.json({ error: 'Failed to audit claim challenge' }, { status: 500 });
  }
}

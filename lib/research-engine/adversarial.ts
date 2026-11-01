import crypto from 'crypto';
import { Claim, Contradiction } from '@/types/evidence';
import { FalsifiablePredicate, AdversarialPairing } from './compiler';
import { evidenceLedger } from '@/database/ledger';

export interface AdversarialEvaluation {
  predicate_id: string;
  statement: string;
  proponent_claims_count: number;
  skeptic_claims_count: number;
  truth_index: number; // 0.0 to 1.0
  verdict: 'supported' | 'refuted' | 'inconclusive' | 'contested';
  falsification_triggered: boolean;
  rationale: string;
}

export class AdversarialResearchEngine {
  evaluatePredicate(
    predicate: FalsifiablePredicate,
    pairing: AdversarialPairing | undefined,
    claims: Claim[]
  ): AdversarialEvaluation {
    const supportingClaims = claims.filter((c) => c.stance === 'supports');
    const contradictingClaims = claims.filter((c) => c.stance === 'contradicts');

    const proponentWeight = supportingClaims.reduce((sum, c) => sum + (c.confidence || 0.8), 0);
    const skepticWeight = contradictingClaims.reduce((sum, c) => sum + (c.confidence || 0.8), 0);
    const totalWeight = proponentWeight + skepticWeight;

    const truthIndex = totalWeight > 0 ? proponentWeight / totalWeight : 0.5;

    let verdict: AdversarialEvaluation['verdict'] = 'inconclusive';
    let falsificationTriggered = false;

    if (skepticWeight > proponentWeight && contradictingClaims.length >= 1) {
      verdict = 'refuted';
      falsificationTriggered = true;
    } else if (truthIndex >= predicate.target_truth_threshold) {
      verdict = 'supported';
    } else if (contradictingClaims.length > 0 && supportingClaims.length > 0) {
      verdict = 'contested';
    }

    const rationale = falsificationTriggered
      ? `Null hypothesis corroborated by ${contradictingClaims.length} independent empirical counterarguments. Threshold of ${predicate.target_truth_threshold} not achieved.`
      : verdict === 'supported'
      ? `Predicate verified: ${supportingClaims.length} supporting sources achieved truth index of ${truthIndex.toFixed(2)} (threshold: ${predicate.target_truth_threshold}).`
      : `Adversarial cross-examination yielded mixed evidence (${supportingClaims.length} supporting vs ${contradictingClaims.length} contesting).`;

    return {
      predicate_id: predicate.id,
      statement: predicate.statement,
      proponent_claims_count: supportingClaims.length,
      skeptic_claims_count: contradictingClaims.length,
      truth_index: Number(truthIndex.toFixed(3)),
      verdict,
      falsification_triggered: falsificationTriggered,
      rationale,
    };
  }

  async auditClaimChallenge(
    researchId: string,
    claimId: string,
    skepticAgentName: string,
    critique: string
  ): Promise<void> {
    await evidenceLedger.appendCustodyStep(
      researchId,
      claimId,
      'challenged',
      skepticAgentName,
      `Adversarial challenge: ${critique}`
    );
  }
}

export const adversarialEngine = new AdversarialResearchEngine();


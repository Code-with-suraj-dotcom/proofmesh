import React, { Suspense } from 'react';
import { LiveResearchClient } from './LiveResearchClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default function LiveResearchPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#3678F6]/20 border-t-[#3678F6] animate-spin"></div>
          <p className="text-xs font-mono text-[#8994A8]">
            Connecting to ProofMesh Live Observability Stream...
          </p>
        </div>
      }
    >
      <PageInner params={params} />
    </Suspense>
  );
}

async function PageInner({ params }: Props) {
  const { id } = await params;
  return <LiveResearchClient sessionId={id} />;
}

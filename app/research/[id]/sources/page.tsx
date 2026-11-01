import React, { Suspense } from 'react';
import { SourcesExplorerClient } from './SourcesExplorerClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default function SourcesExplorerPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-[#8994A8]">Loading sources...</div>}>
      <SourcesInner params={params} />
    </Suspense>
  );
}

async function SourcesInner({ params }: Props) {
  const { id } = await params;
  return <SourcesExplorerClient sessionId={id} />;
}

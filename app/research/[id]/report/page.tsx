import React, { Suspense } from 'react';
import { ReportClient } from './ReportClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReportPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-[#8994A8]">Loading report...</div>}>
      <ReportInner params={params} />
    </Suspense>
  );
}

async function ReportInner({ params }: Props) {
  const { id } = await params;
  return <ReportClient sessionId={id} />;
}

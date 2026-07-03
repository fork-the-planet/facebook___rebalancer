'use client';

import {use} from 'react';

import EntityView from '@/app/components/EntityView';

export default function EntityPage({
  params,
}: {
  params: Promise<{runId: string; entityName: string}>;
}) {
  const {entityName} = use(params);
  const decoded = decodeURIComponent(entityName);

  return <EntityView key={decoded} entityName={decoded} />;
}

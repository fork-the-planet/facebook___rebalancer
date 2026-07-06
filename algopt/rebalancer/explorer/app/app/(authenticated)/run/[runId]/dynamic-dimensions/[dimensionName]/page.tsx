'use client';

import {use} from 'react';

import EntityView from '@/app/components/EntityView';

export default function DynamicDimensionsPage({
  params,
}: {
  params: Promise<{runId: string; dimensionName: string}>;
}) {
  const {dimensionName} = use(params);
  const decodedDimensionName = decodeURIComponent(dimensionName);

  return (
    <EntityView key={decodedDimensionName} entityName={decodedDimensionName} />
  );
}

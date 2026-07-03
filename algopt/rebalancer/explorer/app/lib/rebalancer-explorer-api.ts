/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  Assignment,
  ConstraintSpecResponse,
  DataResponse,
  EvaluateResponse,
  GoalSpecResponse,
  Handle,
  HandleResponse,
  LocalSearchProfilesResponse,
  MetricDistributionRequest,
  MetricDistributionResponse,
  MovesBetweenAssignmentsResponse,
  MoveSetsRequest,
  MoveSetsResponse,
  ProblemMetadataResponse,
  Query,
  Result,
  SandboxStatusResponse,
  TreeNodeRequest,
  TreeNodeResponse,
  TypeaheadResponse,
} from './rebalancer-explorer-types';

export async function fetchHandle(manifoldId: string): Promise<HandleResponse> {
  const response = await fetch('/api/rebalancer/handle', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({manifoldId}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch handle');
  }

  return response.json();
}

export async function fetchSandboxStatus(
  handle: Handle,
): Promise<SandboxStatusResponse> {
  const response = await fetch('/api/rebalancer/sandbox-status', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({handle}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch sandbox status');
  }

  return response.json();
}

export async function fetchProblemMetadata(
  handle: Handle,
): Promise<ProblemMetadataResponse> {
  const response = await fetch('/api/rebalancer/problem-metadata', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({handle}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch problem metadata');
  }

  return response.json();
}

export async function fetchEvaluation(
  handle: Handle,
  assignment: Assignment,
): Promise<EvaluateResponse> {
  const response = await fetch('/api/rebalancer/evaluate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, assignment}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch evaluation');
  }

  return response.json();
}

export async function fetchEntityData(
  handle: Handle,
  query: Query,
): Promise<DataResponse> {
  const response = await fetch('/api/rebalancer/entity-data', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, query}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch entity data');
  }

  return response.json();
}

export async function fetchMetricDistribution(
  handle: Handle,
  requests: MetricDistributionRequest[],
): Promise<MetricDistributionResponse[]> {
  const response = await fetch('/api/rebalancer/metric-distribution', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, requests}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch metric distribution');
  }

  const body: {responses: MetricDistributionResponse[]} = await response.json();
  return body.responses;
}

export async function fetchTypeahead(
  handle: Handle,
  entity: string,
  query: string,
  limit: number,
): Promise<TypeaheadResponse> {
  const response = await fetch('/api/rebalancer/typeahead', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, entity, query, limit}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch typeahead results');
  }

  return response.json();
}

export async function fetchGoalSpec(
  handle: Handle,
  name: string,
): Promise<GoalSpecResponse> {
  const response = await fetch('/api/rebalancer/goal-spec', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, name}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch goal spec');
  }

  return response.json();
}

export async function fetchConstraintSpec(
  handle: Handle,
  name: string,
): Promise<ConstraintSpecResponse> {
  const response = await fetch('/api/rebalancer/constraint-spec', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, name}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch constraint spec');
  }

  return response.json();
}

export async function fetchTreeNode(
  handle: Handle,
  request: TreeNodeRequest,
): Promise<TreeNodeResponse> {
  const response = await fetch('/api/rebalancer/tree-node', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, request}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch tree node');
  }

  return response.json();
}

export async function fetchMovesBetween(
  handle: Handle,
  source: Assignment,
  destination: Assignment,
): Promise<MovesBetweenAssignmentsResponse> {
  const response = await fetch('/api/rebalancer/moves-between', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, source, destination}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch moves between assignments');
  }

  return response.json();
}

export async function fetchMoveSets(
  handle: Handle,
  request: MoveSetsRequest,
): Promise<MoveSetsResponse> {
  const response = await fetch('/api/rebalancer/move-sets', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, request}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch move sets');
  }

  return response.json();
}

export async function fetchLocalSearchProfiles(
  handle: Handle,
): Promise<LocalSearchProfilesResponse> {
  const response = await fetch('/api/rebalancer/local-search-profiles', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch local search profiles');
  }

  return response.json();
}

export async function fetchMetricCollection(
  handle: Handle,
  query: Query,
  assignmentA: Assignment,
  assignmentB: Assignment,
): Promise<Result> {
  const response = await fetch('/api/rebalancer/evaluate-metric-collection', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({handle, query, assignmentA, assignmentB}),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? 'Failed to fetch metric collection');
  }

  return response.json();
}

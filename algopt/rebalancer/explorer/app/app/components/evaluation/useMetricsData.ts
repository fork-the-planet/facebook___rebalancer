'use client';

import {useEffect, useMemo, useRef, useState} from 'react';

import type {Assignments} from '@/app/components/evaluation/AssignmentCard';
import type {MetricsViewState} from '@/app/components/evaluation/MetricsTable.state';
import {toThriftAssignment} from '@/lib/assignment';
import {useProblemMetadata} from '@/lib/contexts/ProblemMetadataContext';
import {useRebalancerHandle} from '@/lib/contexts/RebalancerHandleContext';
import {isTypeaheadColumn} from '@/lib/format';
import {fetchMetricCollection} from '@/lib/rebalancer-explorer-api';
import type {Query, Result} from '@/lib/rebalancer-explorer-types';

interface UseMetricsDataParams {
  metricName: string;
  viewState: MetricsViewState;
  assignments: Assignments;
}

interface UseMetricsDataResult {
  result: Result | null;
  originalResult: Result | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  isValid: boolean;
  columnTypeaheadEntities: Record<string, string> | undefined;
}

export function useMetricsData({
  metricName,
  viewState,
  assignments,
}: UseMetricsDataParams): UseMetricsDataResult {
  const {handle} = useRebalancerHandle();
  const {metadata} = useProblemMetadata();

  const {offset, pageSize, orderBy, filters, groupBy} = viewState;

  const [result, setResult] = useState<Result | null>(null);
  const [originalResult, setOriginalResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    metricName !== '' &&
    (metadata?.metricCollectionNames ?? []).includes(metricName);

  // Live fetch (re-fires on view-state changes)
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (handle == null || !isValid) {
      setResult(null);
      setLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const query: Query = {
      entity: metricName,
      page: {offset, limit: pageSize},
      ...(orderBy != null
        ? {
            order: {
              columns: [{name: orderBy.column, direction: orderBy.direction}],
            },
          }
        : {}),
      ...(groupBy.length > 0 ? {group: {columns: groupBy}} : {}),
      ...(filters.length > 0
        ? {filter: {rules: filters.flatMap(f => f.rules)}}
        : {}),
    };
    const assignmentA = toThriftAssignment(assignments.src);
    const assignmentB = toThriftAssignment(assignments.dst);

    fetchMetricCollection(handle, query, assignmentA, assignmentB)
      .then(table => {
        if (fetchId !== fetchIdRef.current) return;
        setResult(table);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (fetchId !== fetchIdRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch metric collection',
        );
        setLoading(false);
      });
  }, [
    handle,
    isValid,
    metricName,
    offset,
    pageSize,
    orderBy,
    filters,
    groupBy,
    assignments,
  ]);

  // Original-descriptions fetch (column descriptions for filter/group config).
  // Refires when metric name or assignments change. Uses page.limit=0 so the
  // backend returns column descriptions without row data.
  useEffect(() => {
    if (handle == null || !isValid) {
      setOriginalResult(null);
      return;
    }

    let cancelled = false;
    setOriginalResult(null);

    const query: Query = {
      entity: metricName,
      page: {offset: 0, limit: 0},
    };
    const assignmentA = toThriftAssignment(assignments.src);
    const assignmentB = toThriftAssignment(assignments.dst);

    fetchMetricCollection(handle, query, assignmentA, assignmentB)
      .then(table => {
        if (!cancelled) setOriginalResult(table);
      })
      .catch(() => {
        // Filter UI is best-effort — silently skip on error.
      });

    return () => {
      cancelled = true;
    };
  }, [handle, isValid, metricName, assignments]);

  // Map column names to known backend entity names for typeahead lookups.
  // Without this, EntityFilter falls back to using the column display name as
  // the entity name, which makes the backend reject the getTypeahead RPC for
  // metric columns whose names don't correspond to known entities.
  const columnTypeaheadEntities = useMemo(() => {
    if (metadata == null || originalResult == null) return undefined;

    const knownEntities = new Set<string>();
    knownEntities.add(metadata.objectName);
    knownEntities.add(metadata.containerName);
    for (const scope of metadata.scopeNames) {
      knownEntities.add(scope);
    }
    for (const partition of metadata.partitionNames) {
      knownEntities.add(partition);
    }

    const entities: Record<string, string> = {};
    for (const col of originalResult.columns) {
      if (!isTypeaheadColumn(col.type)) continue;

      if (knownEntities.has(col.name)) {
        entities[col.name] = col.name;
        continue;
      }

      const dotIndex = col.name.indexOf('.');
      if (dotIndex >= 0) {
        const suffix = col.name.substring(dotIndex + 1);
        if (knownEntities.has(suffix)) {
          entities[col.name] = suffix;
        }
      }
    }

    return entities;
  }, [metadata, originalResult]);

  return {
    result,
    originalResult,
    loading,
    error,
    setError,
    isValid,
    columnTypeaheadEntities,
  };
}

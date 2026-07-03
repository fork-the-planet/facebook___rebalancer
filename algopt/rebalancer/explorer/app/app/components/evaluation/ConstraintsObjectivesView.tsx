'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

import {Alert, Box, CircularProgress} from '@mui/material';
import {useSearchParams} from 'next/navigation';

import {toThriftAssignment} from '@/lib/assignment';
import {mergeOverrides} from '@/lib/move-selection-utils';
import {useUrlStateSync} from '@/lib/url-state';

import AssignmentCard from '@/app/components/evaluation/AssignmentCard';
import type {Assignments} from '@/app/components/evaluation/AssignmentCard';
import {buildTableDescriptors} from '@/app/components/evaluation/ConstraintsObjectivesView.tables';
import {
  buildCOSearchParams,
  parseCOSearchParams,
} from '@/app/components/evaluation/ConstraintsObjectivesView.url';
import EvaluationSection from '@/app/components/evaluation/EvaluationSection';
import {
  getFilterRuleColumn,
  pruneFiltersByColumns,
} from '@/app/components/evaluation/MoveSetsTable.filters';
import MoveSetsTable, {
  type MoveSetsViewState,
} from '@/app/components/evaluation/MoveSetsTable';
import {useProblemMetadata} from '@/lib/contexts/ProblemMetadataContext';
import {useRebalancerHandle} from '@/lib/contexts/RebalancerHandleContext';
import {fetchEvaluation} from '@/lib/rebalancer-explorer-api';
import type {EvaluationResult, Filter} from '@/lib/rebalancer-explorer-types';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ConstraintsObjectivesView() {
  const {handle} = useRebalancerHandle();
  const {metadata} = useProblemMetadata();
  const searchParams = useSearchParams();

  // Parse URL state once on mount
  const urlState = useMemo(
    () => parseCOSearchParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Track whether URL explicitly specified dstBase
  const urlSpecifiedDstBase = useMemo(
    () => searchParams.has('dstBase'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Assignments state — initialized from URL or metadata defaults
  const [assignments, setAssignments] = useState<Assignments>(() => ({
    src: {
      base: urlState.srcBase,
      overrides: urlState.srcOverrides,
      step: urlState.srcStep,
    },
    dst: {
      base:
        urlState.dstBase ??
        (metadata?.hasFinalAssignment ? 'FINAL' : 'INITIAL'),
      overrides: urlState.dstOverrides,
      step: urlState.dstStep,
    },
  }));

  // Re-initialize dst when metadata loads, unless URL explicitly specified dstBase
  const [hasInitializedDst, setHasInitializedDst] = useState(metadata != null);
  if (!hasInitializedDst && metadata != null) {
    setHasInitializedDst(true);
    if (!urlSpecifiedDstBase && metadata.hasFinalAssignment) {
      setAssignments(prev =>
        prev.dst.base === 'INITIAL' && prev.dst.overrides.length === 0
          ? {...prev, dst: {base: 'FINAL', overrides: [], step: null}}
          : prev,
      );
    }
  }

  // Evaluation results
  const [srcEvaluation, setSrcEvaluation] = useState<EvaluationResult | null>(
    null,
  );
  const [dstEvaluation, setDstEvaluation] = useState<EvaluationResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hide unchanged — URL-synced state; per-table control lives in EvaluationSection
  const [hideAllUnchanged, setHideAllUnchanged] = useState(
    urlState.hideAllUnchanged,
  );

  // Evaluation filters — URL-synced, passed down to EvaluationSection
  const [evalFilters, setEvalFilters] = useState<Filter[]>(
    urlState.evalFilters,
  );

  // MoveSets table view state — initialized from URL
  const [moveSetsState, setMoveSetsState] = useState<MoveSetsViewState>(() => ({
    partition: urlState.msPartition,
    scope: urlState.msScope,
    objectives: urlState.msObjectives,
    filters: urlState.msFilters,
    offset: urlState.msOffset,
    pageSize: urlState.msPageSize,
    orderColumn: urlState.msOrderColumn,
    orderDirection: urlState.msOrderDirection,
    isMinimized: urlState.msMinimized,
  }));

  // ---- Pin to Initial → Final ----
  const [pinToInitialFinal, setPinToInitialFinal] = useState(false);

  // ---- Add moves to assignment callback ----
  const handleAddMovesToAssignment = useCallback(
    (
      moves: Array<{variable: string; container: string}>,
      target: 'src' | 'dst',
    ) => {
      setAssignments(prev => {
        const assignment = prev[target];
        const merged = mergeOverrides(assignment.overrides, moves);
        if (merged.length === assignment.overrides.length) {
          return prev;
        }
        const updated = {...assignment, overrides: merged};
        if (target === 'src') {
          return {src: updated, dst: prev.dst};
        }
        return {src: prev.src, dst: updated};
      });
    },
    [],
  );

  // Stable reference for pinned assignments — never changes, so downstream
  // consumers (MoveSetsTable) won't re-fetch when the user adds overrides.
  const pinnedAssignments: Assignments = useMemo(
    () => ({
      src: {base: 'INITIAL' as const, overrides: [], step: null},
      dst: {base: 'FINAL' as const, overrides: [], step: null},
    }),
    [],
  );

  // Compute effective assignments for the MoveSets table query.
  // When pinned, always show Initial→Final. Otherwise strip overrides
  // (the moves table shows base moves, not override-affected ones).
  const moveSetsQueryAssignments: Assignments = useMemo(() => {
    if (pinToInitialFinal) {
      return pinnedAssignments;
    }
    return {
      src: {...assignments.src, overrides: []},
      dst: {...assignments.dst, overrides: []},
    };
  }, [pinToInitialFinal, pinnedAssignments, assignments]);

  // When metadata loads, validate URL-derived moveSetsState. If the loaded
  // problem doesn't support per-move objective changes, wipe any URL-provided
  // objectives and prune filters referencing now-defunct objective columns.
  const [hasValidatedMoveSets, setHasValidatedMoveSets] = useState(false);
  if (!hasValidatedMoveSets && metadata != null) {
    setHasValidatedMoveSets(true);
    const isObjSelectorEnabled =
      metadata.canDisplayObjChangesInMoveSetsTable ?? false;
    if (!isObjSelectorEnabled && moveSetsState.objectives.length > 0) {
      setMoveSetsState(prev => {
        const colsToRemove = new Set<string>();
        for (const f of prev.filters) {
          for (const rule of f.rules) {
            const col = getFilterRuleColumn(rule);
            if (col != null && prev.objectives.some(obj => col.includes(obj))) {
              colsToRemove.add(col);
            }
          }
        }
        return {
          ...prev,
          objectives: [],
          offset: 0,
          filters:
            colsToRemove.size > 0
              ? pruneFiltersByColumns(prev.filters, colsToRemove)
              : prev.filters,
        };
      });
    }
  }

  // Sync all state to URL search params
  useUrlStateSync(
    () =>
      buildCOSearchParams(
        assignments,
        hideAllUnchanged,
        evalFilters,
        moveSetsState,
      ),
    [assignments, hideAllUnchanged, evalFilters, moveSetsState],
  );

  // Fetch evaluations when assignments or handle change
  const doFetch = useCallback(async () => {
    if (handle == null) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [srcResp, dstResp] = await Promise.all([
        fetchEvaluation(handle, toThriftAssignment(assignments.src)),
        fetchEvaluation(handle, toThriftAssignment(assignments.dst)),
      ]);
      setSrcEvaluation(srcResp.result);
      setDstEvaluation(dstResp.result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch evaluation',
      );
      setSrcEvaluation(null);
      setDstEvaluation(null);
    } finally {
      setLoading(false);
    }
  }, [handle, assignments]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  // Build table descriptors from src expressions
  const tableDescriptors = useMemo(
    () => buildTableDescriptors(srcEvaluation?.expressions ?? []),
    [srcEvaluation],
  );

  // Memoize thrift-format assignments so EvaluationTable receives stable
  // object references (prevents unnecessary column recalculations).
  const sourceAssignment = useMemo(
    () => toThriftAssignment(assignments.src),
    [assignments.src],
  );
  const destinationAssignment = useMemo(
    () => toThriftAssignment(assignments.dst),
    [assignments.dst],
  );

  return (
    <div className="p-4 space-y-4">
      <AssignmentCard
        assignments={assignments}
        onAssignmentsChange={setAssignments}
      />

      {/* Move Sets table */}
      {handle != null && (
        <MoveSetsTable
          assignments={moveSetsQueryAssignments}
          viewState={moveSetsState}
          onViewStateChange={setMoveSetsState}
          enableRowSelection
          onAddMovesToAssignment={handleAddMovesToAssignment}
          pinToInitialFinal={pinToInitialFinal}
          onPinToInitialFinalChange={setPinToInitialFinal}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 6,
          }}>
          <CircularProgress size={40} />
          <Box sx={{ml: 2, color: 'text.secondary'}}>
            Evaluating assignments...
          </Box>
        </Box>
      )}

      {/* Error alert */}
      {error != null && (
        <Alert severity="error" sx={{mt: 2}}>
          {error}
        </Alert>
      )}

      {/* Constraints & Objectives section */}
      {!loading &&
        error == null &&
        handle != null &&
        srcEvaluation != null &&
        dstEvaluation != null && (
          <EvaluationSection
            srcEvaluation={srcEvaluation}
            dstEvaluation={dstEvaluation}
            tableDescriptors={tableDescriptors}
            handle={handle}
            sourceAssignment={sourceAssignment}
            destinationAssignment={destinationAssignment}
            hideAllUnchanged={hideAllUnchanged}
            onHideAllUnchangedChange={setHideAllUnchanged}
            evalFilters={evalFilters}
            onEvalFiltersChange={setEvalFilters}
          />
        )}
    </div>
  );
}

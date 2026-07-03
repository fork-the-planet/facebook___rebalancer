'use client';

import {startTransition, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';

import EntityFilter from '@/app/components/EntityFilter';
import {filterExpressions, type TableDescriptor} from '@/app/components/evaluation/ConstraintsObjectivesView.tables';
import EvaluationTable from '@/app/components/evaluation/EvaluationTable';
import type {
  Assignment,
  ColumnDescription,
  EvaluationResult,
  Filter,
  Handle,
} from '@/lib/rebalancer-explorer-types';
import {ColumnType} from '@/lib/rebalancer-explorer-types';

const EVAL_COLUMN_DESCRIPTIONS: ColumnDescription[] = [
  {name: 'Name', type: ColumnType.STRING, primaryKey: false, description: ''},
  {name: 'A', type: ColumnType.DOUBLE, primaryKey: false, description: ''},
  {name: 'B', type: ColumnType.DOUBLE, primaryKey: false, description: ''},
  {name: 'B - A', type: ColumnType.DOUBLE, primaryKey: false, description: ''},
  {name: '%', type: ColumnType.DOUBLE, primaryKey: false, description: ''},
];

interface EvaluationSectionProps {
  srcEvaluation: EvaluationResult;
  dstEvaluation: EvaluationResult;
  tableDescriptors: TableDescriptor[];
  handle: Handle;
  sourceAssignment: Assignment;
  destinationAssignment: Assignment;
  hideAllUnchanged: boolean;
  onHideAllUnchangedChange: (v: boolean) => void;
  evalFilters: Filter[];
  onEvalFiltersChange: (filters: Filter[]) => void;
}

export default function EvaluationSection({
  srcEvaluation,
  dstEvaluation,
  tableDescriptors,
  handle,
  sourceAssignment,
  destinationAssignment,
  hideAllUnchanged,
  onHideAllUnchangedChange,
  evalFilters,
  onEvalFiltersChange,
}: EvaluationSectionProps) {
  const [uncheckedByTable, setUncheckedByTable] = useState<number | null>(null);

  // Debounce filter applied to tables — prevents re-rendering all rows on every keystroke.
  const [appliedFilters, setAppliedFilters] = useState(evalFilters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current != null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => setAppliedFilters(evalFilters));
    }, 300);
    return () => {
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
    };
  }, [evalFilters]);

  const handleHideAllToggle = useCallback(
    (newState: boolean) => {
      onHideAllUnchangedChange(newState);
      if (newState) {
        setUncheckedByTable(null);
      }
    },
    [onHideAllUnchangedChange],
  );

  // Stable per-table objects so React.memo on EvaluationTable can bail out during filter keystrokes.
  const hideAllUnchangedControls = useMemo(
    () =>
      tableDescriptors.map((_, index) => ({
        hideAllUnchanged,
        setHideAllUnchanged: handleHideAllToggle,
        uncheckedByTable,
        setUncheckedByTable,
        tableIndex: index,
      })),
    [
      tableDescriptors,
      hideAllUnchanged,
      handleHideAllToggle,
      uncheckedByTable,
      setUncheckedByTable,
    ],
  );

  // Stable per-table expression slices — avoids new array literals in JSX on every render.
  const splitExpressions = useMemo(
    () =>
      tableDescriptors.map(desc => ({
        src: filterExpressions(
          srcEvaluation.expressions,
          desc.expressionType,
          desc.tupleIndex,
        ),
        dst: filterExpressions(
          dstEvaluation.expressions,
          desc.expressionType,
          desc.tupleIndex,
        ),
      })),
    [tableDescriptors, srcEvaluation, dstEvaluation],
  );

  const nameOptions = useMemo(() => {
    const names = new Set<string>();
    for (const expr of srcEvaluation.expressions) {
      names.add(expr.name);
    }
    for (const expr of dstEvaluation.expressions) {
      names.add(expr.name);
    }
    return {Name: Array.from(names).sort()};
  }, [srcEvaluation, dstEvaluation]);

  return (
    <Paper variant="outlined" sx={{overflow: 'hidden'}}>
      {/* Section header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Typography variant="subtitle1" sx={{fontWeight: 600}}>
          Constraints & Objectives
        </Typography>
        <Tooltip title="Hide all rows across all tables where the two assignments have the same value">
          <FormControlLabel
            sx={{mr: 0}}
            control={
              <Checkbox
                size="small"
                checked={hideAllUnchanged}
                onChange={(_e, checked) => handleHideAllToggle(checked)}
              />
            }
            label={
              <Typography variant="body2" sx={{fontSize: '0.8125rem'}}>
                Hide unchanged Constraints & Objectives
              </Typography>
            }
          />
        </Tooltip>
      </Box>

      {/* Filter */}
      <Box sx={{px: 2, py: 1, borderBottom: '1px solid #e0e0e0'}}>
        <EntityFilter
          columnDescriptions={EVAL_COLUMN_DESCRIPTIONS}
          filters={evalFilters}
          onFiltersChange={onEvalFiltersChange}
          entityName="expression"
          localOptions={nameOptions}
        />
      </Box>

      {/* Evaluation tables */}
      {tableDescriptors.map((desc, index) => (
        <EvaluationTable
          key={desc.label}
          title={desc.label}
          srcExpressions={splitExpressions[index].src}
          dstExpressions={splitExpressions[index].dst}
          expressionType={desc.type}
          hideAllUnchangedControl={hideAllUnchangedControls[index]}
          handle={handle}
          sourceAssignment={sourceAssignment}
          destinationAssignment={destinationAssignment}
          evaluationFilters={appliedFilters}
        />
      ))}
    </Paper>
  );
}

'use client';

import {useCallback, useMemo, useState} from 'react';

import {IconButton, Tooltip} from '@mui/material';
import {QueryBuilderMaterial} from '@react-querybuilder/material';
import {ClipboardPaste, Copy} from 'lucide-react';
import type {
  Field,
  FullOperator,
  OptionGroup,
  RuleGroupType,
} from 'react-querybuilder';
import {QueryBuilder} from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';

import {useRebalancerHandle} from '@/lib/contexts/RebalancerHandleContext';
import {isNumericColumn} from '@/lib/format';
import type {ColumnDescription, Filter} from '@/lib/rebalancer-explorer-types';

import {AddFilterButton, RemoveRuleButton} from './EntityFilter.actions';
import {
  COLUMN_TYPE_GROUP_LABEL,
  GROUP_ORDER,
  NUMERIC_OPERATORS,
  STRING_OPERATORS,
  filtersToQuery,
  queryToFilters,
} from './EntityFilter.transform';
import {TypeaheadValueEditor} from './EntityFilter.TypeaheadValueEditor';

interface EntityFilterProps {
  columnDescriptions: ColumnDescription[];
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  entityName: string;
  /** Optional map from column name to display label (e.g. {"Object": "server"}). */
  columnLabels?: Record<string, string>;
  /** Optional map from column name to the entity name used for typeahead lookups
   *  (e.g. {"Source Container": "Container"}). */
  columnTypeaheadEntities?: Record<string, string>;
  /** Optional map from column name to a static list of autocomplete values.
   *  When provided for a column, local filtering is used instead of the backend
   *  typeahead RPC. */
  localOptions?: Record<string, string[]>;
}

export default function EntityFilter({
  columnDescriptions,
  filters,
  onFiltersChange,
  entityName,
  columnLabels,
  columnTypeaheadEntities,
  localOptions,
}: EntityFilterProps) {
  const {handle} = useRebalancerHandle();

  // Keep QueryBuilder query as internal state so incomplete rules
  // (empty field/value) are preserved in the UI. Only push valid
  // rules to the parent via onFiltersChange.
  const [query, setQuery] = useState<RuleGroupType>(() =>
    filtersToQuery(filters),
  );

  // When filters change externally (e.g. URL reset, entity switch), regenerate
  // the query. Track the last filters reference we observed so we can skip
  // regeneration when the change came from our own handleQueryChange — that
  // would re-issue rule UUIDs and remount rule components mid-edit, killing
  // cursor position.
  const [lastFilters, setLastFilters] = useState(filters);
  if (filters !== lastFilters) {
    setLastFilters(filters);
    setQuery(filtersToQuery(filters));
  }

  const fields: OptionGroup<Field>[] = useMemo(() => {
    const groups = new Map<string, Field[]>();
    for (const col of columnDescriptions) {
      const groupLabel = COLUMN_TYPE_GROUP_LABEL[col.type] ?? 'Other';
      let group = groups.get(groupLabel);
      if (group == null) {
        group = [];
        groups.set(groupLabel, group);
      }
      group.push({
        name: col.name,
        label: columnLabels?.[col.name] ?? col.name,
        inputType: isNumericColumn(col.type) ? 'number' : 'text',
        datatype: isNumericColumn(col.type) ? 'number' : 'text',
      });
    }
    return GROUP_ORDER.filter(label => groups.has(label)).map(label => ({
      label,
      options: groups.get(label)!,
    }));
  }, [columnDescriptions, columnLabels]);

  const getOperators = useCallback(
    (fieldName: string): FullOperator[] => {
      const col = columnDescriptions.find(c => c.name === fieldName);
      if (col != null && isNumericColumn(col.type)) {
        return NUMERIC_OPERATORS;
      }
      return STRING_OPERATORS;
    },
    [columnDescriptions],
  );

  const handleQueryChange = useCallback(
    (q: RuleGroupType) => {
      setQuery(q);
      const newFilters = queryToFilters(q, columnDescriptions);
      // Stamp the ref we'll receive back via onFiltersChange so the render-time
      // sync above sees filters === lastFilters and skips regeneration.
      setLastFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [onFiltersChange, columnDescriptions],
  );

  const context = useMemo(
    () => ({handle, entityName, columnTypeaheadEntities, localOptions}),
    [handle, entityName, columnTypeaheadEntities, localOptions],
  );

  const [copyTooltip, setCopyTooltip] = useState('Copy filters as JSON');

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(JSON.stringify(filters));
    setCopyTooltip('Copied!');
    setTimeout(() => setCopyTooltip('Copy filters as JSON'), 1500);
  }, [filters]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) return;
      for (const filter of parsed) {
        if (
          filter == null ||
          typeof filter !== 'object' ||
          !Array.isArray((filter as Record<string, unknown>).rules)
        ) {
          return;
        }
        for (const rule of (filter as Filter).rules) {
          if (rule == null || typeof rule !== 'object') return;
          const hasValidVariant =
            ('regex' in rule &&
              typeof rule.regex?.column === 'string' &&
              typeof rule.regex?.regex === 'string') ||
            ('numeric' in rule &&
              typeof rule.numeric?.column === 'string' &&
              typeof rule.numeric?.comparator === 'number' &&
              typeof rule.numeric?.doubleValue === 'number') ||
            ('stringAny' in rule &&
              typeof rule.stringAny?.column === 'string' &&
              Array.isArray(rule.stringAny?.values)) ||
            ('stringNe' in rule &&
              typeof rule.stringNe?.column === 'string' &&
              typeof rule.stringNe?.value === 'string');
          if (!hasValidVariant) return;
        }
      }
      onFiltersChange(parsed as Filter[]);
    } catch {
      // Ignore invalid JSON
    }
  }, [onFiltersChange]);

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <QueryBuilderMaterial>
          <QueryBuilder
            fields={fields}
            query={query}
            onQueryChange={handleQueryChange}
            getOperators={getOperators}
            controlElements={{
              valueEditor: TypeaheadValueEditor,
              addRuleAction: AddFilterButton,
              removeRuleAction: RemoveRuleButton,
              addGroupAction: () => null,
              combinatorSelector: () => null,
            }}
            context={context}
            combinators={[{name: 'and', value: 'and', label: 'AND'}]}
            addRuleToNewGroups
            disabled={columnDescriptions.length === 0}
          />
        </QueryBuilderMaterial>
      </div>
      <div className="flex gap-0.5 pt-0.5">
        <Tooltip title={copyTooltip}>
          <span>
            <IconButton
              size="small"
              onClick={handleCopy}
              disabled={filters.length === 0}>
              <Copy className="size-5" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Paste filters from text">
          <span>
            <IconButton
              size="small"
              onClick={handlePaste}
              disabled={columnDescriptions.length === 0}>
              <ClipboardPaste className="size-5" />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

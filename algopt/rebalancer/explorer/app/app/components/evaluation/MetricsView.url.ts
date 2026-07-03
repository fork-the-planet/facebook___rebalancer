import type {
  Assignments,
  UIAssignment,
} from '@/app/components/evaluation/AssignmentCard';
import {MS_DEFAULT_PAGE_SIZE} from '@/app/components/evaluation/ConstraintsObjectivesView.url';
import {
  DEFAULT_METRICS_PAGE_SIZE,
  type MetricsViewState,
} from '@/app/components/evaluation/MetricsTable.state';
import type {MoveSetsViewState} from '@/app/components/evaluation/MoveSetsTable';
import type {Filter} from '@/lib/rebalancer-explorer-types';
import {OrderDirection} from '@/lib/rebalancer-explorer-types';
import {
  asArray,
  asString,
  normalizeFilters,
  parseQs,
  safeInt,
  stringifyQs,
} from '@/lib/url-state';

export const VALID_BASES = new Set(['INITIAL', 'FINAL', 'INTERMEDIATE']);

// Skip serializing overrides to URL when there are too many — the URL becomes
// enormous and router.replace() bogs down the UI.
export const MAX_URL_OVERRIDES = 100;

export interface ParsedMetricsURLState {
  srcBase: UIAssignment['base'];
  srcStep: number | null;
  srcOverrides: Array<{variable: string; container: string}>;
  dstBase: UIAssignment['base'] | null;
  dstStep: number | null;
  dstOverrides: Array<{variable: string; container: string}>;
  offset: number;
  pageSize: number;
  orderColumn: string | null;
  orderDirection: OrderDirection;
  filters: Filter[];
  groupBy: string[];
  showColumns: string[];
  msPartition: string | null;
  msScope: string | null;
  msObjectives: string[];
  msFilters: Filter[];
  msOffset: number;
  msPageSize: number;
  msOrderColumn: string | null;
  msOrderDirection: OrderDirection;
  msMinimized: boolean;
}

export function parseMetricsSearchParams(
  searchParams: URLSearchParams,
): ParsedMetricsURLState {
  const parsed = parseQs(searchParams);

  const srcBaseRaw = asString(parsed.srcBase);
  const srcBase = (
    VALID_BASES.has(srcBaseRaw ?? '') ? srcBaseRaw : 'INITIAL'
  ) as UIAssignment['base'];

  const srcStep = parsed.srcStep != null ? safeInt(parsed.srcStep, 0) : null;

  const dstBaseRaw = asString(parsed.dstBase);
  const dstBase =
    dstBaseRaw != null && VALID_BASES.has(dstBaseRaw)
      ? (dstBaseRaw as UIAssignment['base'])
      : null;

  const dstStep = parsed.dstStep != null ? safeInt(parsed.dstStep, 0) : null;

  return {
    srcBase,
    srcStep,
    srcOverrides: asArray<{variable: string; container: string}>(
      parsed.srcOverrides,
      [],
    ),
    dstBase,
    dstStep,
    dstOverrides: asArray<{variable: string; container: string}>(
      parsed.dstOverrides,
      [],
    ),
    offset: safeInt(parsed.offset, 0),
    pageSize: safeInt(parsed.pageSize, DEFAULT_METRICS_PAGE_SIZE),
    orderColumn: asString(parsed.orderCol),
    orderDirection: safeInt(parsed.orderDir, 0) as OrderDirection,
    filters: normalizeFilters(parsed.filters),
    groupBy: asArray<string>(parsed.groupBy, []),
    showColumns: asArray<string>(parsed.showCols, []),
    msPartition: asString(parsed.msPartition),
    msScope: asString(parsed.msScope),
    msObjectives: asArray<string>(parsed.msObjectives, []),
    msFilters: normalizeFilters(parsed.msFilters),
    msOffset: safeInt(parsed.msOffset, 0),
    msPageSize: safeInt(parsed.msPageSize, MS_DEFAULT_PAGE_SIZE),
    msOrderColumn: asString(parsed.msOrderCol),
    msOrderDirection: safeInt(parsed.msOrderDir, 0) as OrderDirection,
    msMinimized: parsed.msMinimized !== '0',
  };
}

export function buildMetricsSearchParams(
  assignments: Assignments,
  viewState: MetricsViewState,
  ms: MoveSetsViewState,
): string {
  const obj: Record<string, unknown> = {};

  // Assignment A
  if (assignments.src.base !== 'INITIAL') {
    obj.srcBase = assignments.src.base;
  }
  if (assignments.src.step != null) {
    obj.srcStep = assignments.src.step;
  }
  if (
    assignments.src.overrides.length > 0 &&
    assignments.src.overrides.length <= MAX_URL_OVERRIDES
  ) {
    obj.srcOverrides = assignments.src.overrides;
  }

  // Assignment B — always include base (default is metadata-dependent)
  obj.dstBase = assignments.dst.base;
  if (assignments.dst.step != null) {
    obj.dstStep = assignments.dst.step;
  }
  if (
    assignments.dst.overrides.length > 0 &&
    assignments.dst.overrides.length <= MAX_URL_OVERRIDES
  ) {
    obj.dstOverrides = assignments.dst.overrides;
  }

  // Pagination
  if (viewState.offset !== 0) {
    obj.offset = viewState.offset;
  }
  if (viewState.pageSize !== DEFAULT_METRICS_PAGE_SIZE) {
    obj.pageSize = viewState.pageSize;
  }

  // Sorting
  if (viewState.orderBy != null) {
    obj.orderCol = viewState.orderBy.column;
    if (viewState.orderBy.direction !== 0) {
      obj.orderDir = viewState.orderBy.direction;
    }
  }

  // Filters
  if (viewState.filters.length > 0) {
    obj.filters = viewState.filters;
  }

  // Group by
  if (viewState.groupBy.length > 0) {
    obj.groupBy = viewState.groupBy;
  }

  // Show columns
  if (viewState.showColumns.length > 0) {
    obj.showCols = viewState.showColumns;
  }

  // MoveSets table
  if (ms.partition != null) {
    obj.msPartition = ms.partition;
  }
  if (ms.scope != null) {
    obj.msScope = ms.scope;
  }
  if (ms.objectives.length > 0) {
    obj.msObjectives = ms.objectives;
  }
  if (ms.filters.length > 0) {
    obj.msFilters = ms.filters;
  }
  if (ms.offset !== 0) {
    obj.msOffset = ms.offset;
  }
  if (ms.pageSize !== MS_DEFAULT_PAGE_SIZE) {
    obj.msPageSize = ms.pageSize;
  }
  if (ms.orderColumn != null) {
    obj.msOrderCol = ms.orderColumn;
  }
  if (ms.orderDirection !== 0) {
    obj.msOrderDir = ms.orderDirection;
  }
  if (!ms.isMinimized) {
    obj.msMinimized = '0';
  }

  return stringifyQs(obj);
}

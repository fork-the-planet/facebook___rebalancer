import {isNumericColumn} from '@/lib/format';
import type {ColumnDescription, Filter} from '@/lib/rebalancer-explorer-types';
import {ColumnType, OrderDirection} from '@/lib/rebalancer-explorer-types';

export interface MetricsViewState {
  offset: number;
  pageSize: number;
  orderBy: {column: string; direction: OrderDirection} | null;
  filters: Filter[];
  groupBy: string[];
  showColumns: string[];
}

export const DEFAULT_METRICS_PAGE_SIZE = 50;
export const B_MINUS_A_SUFFIX = '(B-A)';

export function getDefaultMetricsViewState(): MetricsViewState {
  return {
    offset: 0,
    pageSize: DEFAULT_METRICS_PAGE_SIZE,
    orderBy: null,
    filters: [],
    groupBy: [],
    showColumns: [],
  };
}

export function getColumnWidth(col: ColumnDescription): number {
  if (col.primaryKey) return 220;
  return isNumericColumn(col.type) ? 130 : 180;
}

export function isVisibleColumn(
  col: ColumnDescription,
  groupBy: string[],
  showColumns: string[],
): boolean {
  if (groupBy.includes(col.name)) return true;
  if (col.type === ColumnType.ENTITY_NAME) return true;
  if (showColumns.length === 0) return true;
  return showColumns.includes(col.name);
}

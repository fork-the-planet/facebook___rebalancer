import type {
  OrderDirection,
  TreeNodeOrderMetric,
} from '@/lib/rebalancer-explorer-types';

export const SHOW_MORE_PREFIX = 'show-more:';
export const SORT_CONTROLS_PREFIX = 'sort-controls:';
export const CONTROLS_PREFIX = 'controls:';
export const CONTROLS_MORE_PREFIX = 'controls-more:';
export const PLACEHOLDER_SUFFIX = ':placeholder';
export const DEFAULT_SORT = {
  metric: 0 as TreeNodeOrderMetric,
  direction: 1 as OrderDirection,
};

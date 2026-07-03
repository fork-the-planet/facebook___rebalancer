import type {Filter, FilterRule} from '@/lib/rebalancer-explorer-types';

// Column names affected by each selector. When a selector changes, filters
// on these columns are removed because the columns swap or change values.
export const PARTITION_AFFECTED_COLUMNS = new Set([
  'Object',
  'Group',
  'Object Count',
]);
export const SCOPE_AFFECTED_COLUMNS = new Set([
  'Source Container',
  'Destination Container',
  'Source ScopeItem',
  'Destination ScopeItem',
]);

/** Extract the column name from a FilterRule union variant. */
export function getFilterRuleColumn(rule: FilterRule): string | null {
  if ('regex' in rule) return rule.regex.column;
  if ('numeric' in rule) return rule.numeric.column;
  if ('stringAny' in rule) return rule.stringAny.column;
  if ('stringNe' in rule) return rule.stringNe.column;
  return null;
}

/**
 * Return filters with rules on the specified columns removed.
 * Returns the original array reference if nothing was pruned (avoids
 * unnecessary React re-renders).
 */
export function pruneFiltersByColumns(
  filters: Filter[],
  columnsToRemove: Set<string>,
): Filter[] {
  let changed = false;
  const pruned = filters
    .map(f => {
      const remaining = f.rules.filter(rule => {
        const col = getFilterRuleColumn(rule);
        return col == null || !columnsToRemove.has(col);
      });
      if (remaining.length !== f.rules.length) changed = true;
      return {rules: remaining};
    })
    .filter(f => f.rules.length > 0);
  if (!changed && pruned.length === filters.length) return filters;
  return pruned;
}

import type {Filter} from '@/lib/rebalancer-explorer-types';
import {Comparator} from '@/lib/rebalancer-explorer-types';

/**
 * Map from EntityFilter column names (matching EVAL_COLUMN_DESCRIPTIONS)
 * to EvaluationRow field keys.
 */
const COLUMN_TO_ROW_FIELD: Record<string, string> = {
  Name: 'name',
  Description: 'description',
  A: 'srcValue',
  B: 'dstValue',
  'B - A': 'delta',
  '%': 'percentage',
};

function compareNumeric(
  value: number,
  comparator: Comparator,
  target: number,
): boolean {
  switch (comparator) {
    case Comparator.EQ:
      return value === target;
    case Comparator.NE:
      return value !== target;
    case Comparator.LT:
      return value < target;
    case Comparator.LE:
      return value <= target;
    case Comparator.GT:
      return value > target;
    case Comparator.GE:
      return value >= target;
    default:
      return true;
  }
}

function getField(
  row: Record<string, unknown>,
  column: string,
): string | number | undefined {
  const field = COLUMN_TO_ROW_FIELD[column];
  if (field == null) return undefined;
  const val = (row as Record<string, unknown>)[field];
  if (typeof val === 'string' || typeof val === 'number') return val;
  return undefined;
}

type CompiledFilter = {
  rules: Array<
    | {type: 'regex'; column: string; compiled: RegExp}
    | {type: 'numeric'; column: string; comparator: Comparator; doubleValue: number}
    | {type: 'stringAny'; column: string; values: string[]}
    | {type: 'stringNe'; column: string; value: string}
  >;
};

/**
 * Compile regex rules in filters once so they can be reused across rows.
 * Invalid regex patterns are dropped (they would never match).
 */
export function compileEvaluationFilters(filters: Filter[]): CompiledFilter[] {
  return filters.map(filter => {
    const rules: CompiledFilter['rules'] = [];
    for (const rule of filter.rules) {
      if ('regex' in rule) {
        try {
          rules.push({type: 'regex', column: rule.regex.column, compiled: new RegExp(rule.regex.regex, 'i')});
        } catch {
          // invalid regex — drop the rule (it would never match anyway)
        }
      } else if ('numeric' in rule) {
        rules.push({type: 'numeric', column: rule.numeric.column, comparator: rule.numeric.comparator, doubleValue: rule.numeric.doubleValue});
      } else if ('stringAny' in rule) {
        rules.push({type: 'stringAny', column: rule.stringAny.column, values: rule.stringAny.values});
      } else if ('stringNe' in rule) {
        rules.push({type: 'stringNe', column: rule.stringNe.column, value: rule.stringNe.value});
      }
    }
    return {rules};
  });
}

/**
 * Test whether a row matches all filter rules. The row must have fields
 * matching the values in COLUMN_TO_ROW_FIELD (name, description, srcValue,
 * dstValue, delta, percentage).
 *
 * Pass pre-compiled filters from `compileEvaluationFilters` to avoid
 * recompiling regexes on every row.
 */
export function matchesEvaluationFilters(
  row: {
    name: string;
    description: string;
    srcValue: number;
    dstValue: number;
    delta: number;
    percentage: number;
  },
  filters: CompiledFilter[],
): boolean {
  const record = row as unknown as Record<string, unknown>;
  for (const filter of filters) {
    for (const rule of filter.rules) {
      if (rule.type === 'regex') {
        const val = getField(record, rule.column);
        if (val == null) continue;
        if (!rule.compiled.test(String(val))) return false;
      } else if (rule.type === 'numeric') {
        const val = getField(record, rule.column);
        if (typeof val !== 'number') continue;
        if (!compareNumeric(val, rule.comparator, rule.doubleValue)) return false;
      } else if (rule.type === 'stringAny') {
        const val = getField(record, rule.column);
        if (val == null) continue;
        if (!rule.values.includes(String(val))) return false;
      } else if (rule.type === 'stringNe') {
        const val = getField(record, rule.column);
        if (val == null) continue;
        if (String(val) === rule.value) return false;
      }
    }
  }
  return true;
}

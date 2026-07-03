import type {
  ExpressionResult,
  ExpressionType,
} from '@/lib/rebalancer-explorer-types';

export interface TableDescriptor {
  type: 'CONSTRAINT' | 'OBJECTIVE';
  expressionType: ExpressionType;
  label: string;
  tupleIndex: number;
}

export function buildTableDescriptors(
  expressions: ExpressionResult[],
): TableDescriptor[] {
  // ExpressionType enum: OBJECTIVE = 0, CONSTRAINT = 1
  const CONSTRAINT_TYPE = 1 as ExpressionType;
  const OBJECTIVE_TYPE = 0 as ExpressionType;

  let maxTupleIndex = 0;
  for (const expr of expressions) {
    maxTupleIndex = Math.max(maxTupleIndex, expr.tupleIndex ?? 0);
  }

  const tables: TableDescriptor[] = [
    {
      type: 'CONSTRAINT',
      expressionType: CONSTRAINT_TYPE,
      label: 'Constraints',
      tupleIndex: 0,
    },
  ];

  if (maxTupleIndex === 0) {
    tables.push({
      type: 'OBJECTIVE',
      expressionType: OBJECTIVE_TYPE,
      label: 'Objectives',
      tupleIndex: 0,
    });
  } else {
    for (let i = 0; i <= maxTupleIndex; i++) {
      tables.push({
        type: 'OBJECTIVE',
        expressionType: OBJECTIVE_TYPE,
        label: `Objectives at tuple index ${i}`,
        tupleIndex: i,
      });
    }
  }

  return tables;
}

export function filterExpressions(
  expressions: ExpressionResult[],
  type: ExpressionType,
  tupleIndex: number,
): ExpressionResult[] {
  return expressions.filter(
    expr => expr.type === type && (expr.tupleIndex ?? 0) === tupleIndex,
  );
}

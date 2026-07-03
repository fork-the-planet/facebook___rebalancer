'use client';

import {createContext} from 'react';

import type {
  OrderDirection,
  TreeNode,
  TreeNodeOrderMetric,
} from '@/lib/rebalancer-explorer-types';

export interface CachedNode {
  node: TreeNode | null;
  children: TreeNode[];
  fetched: boolean;
  loading: boolean;
  error: string | null;
}

export interface NodeMeta {
  coefficient: number;
  minimizing: boolean;
}

export interface NodeSort {
  metric: TreeNodeOrderMetric;
  direction: OrderDirection;
}

export interface TreeDataContextValue {
  nodeData: Record<string, CachedNode>;
  nodeMeta: Record<string, NodeMeta>;
  expandedItems: string[];
  onShowMore: (parentId: string) => void;
  nodeSearch: Record<string, string>;
  onSearchChange: (nodeId: string, query: string) => void;
  nodeSort: Record<string, NodeSort>;
  onSortChange: (
    nodeId: string,
    metric: TreeNodeOrderMetric,
    direction: OrderDirection,
  ) => void;
}

export const TreeDataContext = createContext<TreeDataContextValue>({
  nodeData: {},
  nodeMeta: {},
  expandedItems: [],
  onShowMore: () => {},
  nodeSearch: {},
  onSearchChange: () => {},
  nodeSort: {},
  onSortChange: () => {},
});

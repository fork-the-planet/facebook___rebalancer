---
sidebar_position: 23
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Fixed Source

Tries moving every object out of one or more specified source containers to every
possible destination. Unlike [Single](single.md), the source containers are pinned in
advance rather than chosen by the common logic. Useful for draining specific
containers.

<img src={useBaseUrl('/img/move-types/fixed-source.png')} alt="Every object in the specified source containers is evaluated for moving to every destination container" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `scopeItemList` | ScopeItemList | Yes | - | The source scope items to move objects out of; moves are attempted in this order |
| `stopEarlyAtScopeItemThatImprovesObjective` | bool | No | false | If true, stops at the first scope item that yields an improving move; if false, tries all scope items |
| `specialContainer` | string | No | - | An alternative single source container; only used when `scopeItemList` is not set |
| `sampleSize` | SampleSize | No | all objects | If set, samples a subset of the source objects rather than considering every one |
| `objectBundleFormationHints` | ObjectBundleFormationHints | No | - | For scope items that require objects to move in bundles, describes how those bundles are formed |

## Behavior

For each specified source container (in the given order), the move type evaluates moving
each of its objects to every candidate destination and applies the best improving move.
With `stopEarlyAtScopeItemThatImprovesObjective` set, it returns as soon as a source
scope item produces an improving move.

## Complexity

Roughly `objects * containers` neighbors are evaluated, restricted to the objects of the
specified source containers.

## Example

Configure local search to use only the fixed source move type, draining one container:

```cpp
SingleFixedSourceMoveTypeSpec fixedSourceSpec;
fixedSourceSpec.specialContainer() = "container1";

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(fixedSourceSpec));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L481-L523))

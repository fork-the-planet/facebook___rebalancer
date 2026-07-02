---
sidebar_position: 7
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Swap Full With Empty Containers

Evaluates moving **all** objects in the hot container into an empty container, for
every possible empty destination. Destination containers are processed in parallel.

<img src={useBaseUrl('/img/move-types/swap-full-with-empty-containers.png')} alt="Swap full with empty containers move: all objects in the hot container move into an empty container" />

## Parameters

`SwapFullWithEmptyContainersMoveTypeSpec` takes no parameters. To bound exploration
time per hot container, set `timePerMove` on the
[`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick a different container that is currently empty (the "other container").
2. Evaluate moving all objects from the hot container into the other container.

Every empty container is tried and the best move is selected.

## Complexity

Roughly `objects * (empty containers)` neighbors are evaluated.

## Example

Configure local search to use only the swap full with empty containers move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SwapFullWithEmptyContainersMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L852-L886))

---
sidebar_position: 6
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Swap Full Containers

Evaluates exchanging **all** objects in the hot container with **all** objects of
another container, for every possible other container. Destination containers are
processed in parallel.

<img src={useBaseUrl('/img/move-types/swap-full-containers.png')} alt="Swap full containers move: all objects in the hot container are exchanged with all objects in another container" />

## Parameters

`SwapFullContainersMoveTypeSpec` takes no parameters. To bound exploration time per
hot container, set `timePerMove` on the [`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick a different container (the "other container").
2. Evaluate exchanging all objects between the hot container and the other container.

Every other container is tried and the best full-container swap is selected.

## Complexity

Roughly `objects * (containers - 1)` neighbors are evaluated.

## Example

Configure local search to use only the swap full containers move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SwapFullContainersMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L816-L851))

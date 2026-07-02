---
sidebar_position: 22
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Fixed Dest

Tries moving every object in the hot container to a single, fixed destination
container. Unlike [Single](single.md), the destination is not explored---it is pinned
in advance---so only the source objects vary. Useful for draining into, or filling, one
specific container.

<img src={useBaseUrl('/img/move-types/fixed-dest.png')} alt="Every object in the source container is evaluated for moving into one fixed destination container" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `specialContainer` | string | No | - | The fixed destination container objects are moved into |
| `sampleSize` | SampleSize | No | all objects | If set, samples a subset of the destination's objects rather than considering every one |
| `objectBundleFormationHints` | ObjectBundleFormationHints | No | - | For scope items that require objects to move in bundles, describes how those bundles are formed |

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic) and a
fixed destination container, the move type evaluates moving each object from the source
into that destination (optionally sampling), and applies the best improving move.

## Complexity

Roughly `objects` neighbors are evaluated---one per candidate object---since the
destination is fixed.

## Example

Configure local search to use only the fixed dest move type, pinning the destination:

```cpp
FixedDestMoveTypeSpec fixedDest;
fixedDest.specialContainer() = "container1";

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(fixedDest));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/FixedDestMoveTypeTest.cpp#L70-L101))

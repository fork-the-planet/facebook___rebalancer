---
sidebar_position: 26
---

# Fixed Dest Swap Multi Move

Evaluates swapping **sets of related objects** between the hot container and a single,
fixed destination container. It supports both traditional 1:1 swaps and adaptive 1:k
uneven swaps based on dimension ratios. All move sets are evaluated in parallel to
benefit from multi-threading.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `greedyOnSrc` | bool | No | false | If true, swaps are attempted greedily per source object, exiting early once a swap succeeds. Required for 1:k swaps |
| `maxSamplesPerEquivSet` | int | No | 5 | Number of object samples selected for each equivalent set |
| `maxSampleSizeOnSrc` | int | No | all | Maximum number of source object bundles considered from the hot container |
| `maxSampleSizeOnDst` | int | No | all | Maximum number of destination object bundles considered from the special container |
| `specialContainer` | string | No | - | The fixed destination container to swap objects with |
| `rasLocalSearchMetadata` | RasLocalSearchMetadata | No | - | RAS local search metadata, including swap-ratio configuration (`swapRatioDimension`, `useAdaptiveAllotments`) |

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic) and a
fixed destination, the move type operates in one of two modes:

- **Traditional swap mode (default):** picks a bundle of related objects from the hot
  container and a bundle from the destination, then evaluates swapping all hot objects
  with all cold objects via a cartesian product of the two bundles.
- **Adaptive 1:k swap mode** (when `swapRatioDimension` is configured and
  `useAdaptiveAllotments` is enabled, with `greedyOnSrc`): picks a single hot object and,
  for each destination equivalent set, computes a swap ratio
  `k = ceil(hotDimensionValue / coldDimensionValue)`, then evaluates swapping the hot
  object for `k` cold objects, stopping as soon as a better move is found.

## Complexity

- **Traditional mode:** roughly
  `maxSampleSizeOnSrc * maxSampleSizeOnDst * (source bundle size) * (destination bundle size)`.
- **Adaptive 1:k mode:** roughly `maxSampleSizeOnSrc * (average swap ratio k)`, typically
  fewer combinations due to greedy termination and no cartesian product.

## Example

Configure local search to use only the fixed dest swap multi move type:

```cpp
FixedDestSwapMultiMoveTypeSpec fixedDestSwap;
fixedDestSwap.specialContainer() = "container1";

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(fixedDestSwap));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L679-L723))

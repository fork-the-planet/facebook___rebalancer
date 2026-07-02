---
sidebar_position: 16
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single Coldest Stratified

Evaluates moving an object to a sample of the **coldest** containers---those with the
lowest "potential", where potential reflects a container's contribution to the goal
values and how many objects it holds---drawn from similarity classes. It is like
[Single Random Stratified](single-random-stratified.md), but picks the coldest
containers in each class instead of a random sample.

:::note Configured by name
Unlike the other move types, Single Coldest Stratified has no dedicated move type spec
yet. It is selected by name via `ProblemSolver::makeMoveTypeSpec("SINGLE_COLDEST_STRATIFIED")`,
and its options are set as fields on the [`LocalSearchSolverSpec`](../local-search.md).
:::

## Parameters

These are fields on the `LocalSearchSolverSpec` (not a move type spec):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `stratifiedSampleSize` | int | No | - | Number of coldest containers sampled (per similarity class) |
| `includeEqualSizeRandomSampleForSingleColdestMoveType` | bool | No | false | Also try an equal-size random sample of containers as candidate destinations (doubling the sample) |

The similarity classes are provided separately via `ProblemSolver::addSimilarContainers`.

## Behavior

For the object being moved, the coldest containers within each similarity class are
chosen as candidate destinations (optionally alongside a random sample), and the best
resulting move is applied. This tends to fill the emptiest containers first.

<img src={useBaseUrl('/img/move-types/single-coldest-stratified-setup.png')} alt="Setup: six tasks in a container that is about to be emptied" />

Draining that container distributes its tasks to the coldest containers:

<img src={useBaseUrl('/img/move-types/single-coldest-stratified-before.png')} alt="Before: containers with varying numbers of objects" />

<img src={useBaseUrl('/img/move-types/single-coldest-stratified-after.png')} alt="After: the drained tasks land on the containers that had the fewest objects" />

## Example

Configure local search to use only the single coldest stratified move type, sampling
the single coldest container per class:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec("SINGLE_COLDEST_STRATIFIED"));
localSearch.stratifiedSampleSize() = 1;

solver.addSolver(localSearch);

// Declare which containers are similar to each other.
solver.addSimilarContainers({{"host0", "host1", "host2", "host3"}});
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/SingleColdestStratifiedTest.cpp#L30-L109))

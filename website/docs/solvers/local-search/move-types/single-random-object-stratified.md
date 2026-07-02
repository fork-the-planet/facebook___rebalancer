---
sidebar_position: 14
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single Random Object Stratified

Evaluates moving a **sample of objects** into a container, rather than every object.
Objects are grouped into similarity classes (via a partition), and the sample is
drawn from those groups, drastically reducing the search space when there are very
many objects.

<img src={useBaseUrl('/img/move-types/single-random-object-stratified.png')} alt="A sample of objects, grouped by similarity, is evaluated for moving into a container" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `objectsToExploreOptions` | ObjectsToExploreOptions | Yes | - | How objects are grouped/selected for sampling (e.g. by the groups of a partition) |
| `stratifiedSampleSize` | SampleSize | Yes | - | Number of objects to sample (spread across the groups) |

For sampling to be meaningful, group objects so that members of the same group have
similar dimensions.

## Behavior

Given a target container, the move type samples objects from each similarity group
and evaluates moving the sampled objects into the container, keeping the best move.
Sampling a fixed number per group keeps the number of evaluated moves small even when
the total object count is huge.

## Example

Configure local search to use only the single random object stratified move type,
sampling 15 objects from the groups of a `"group"` partition:

```cpp
// Group similar objects so the sample is drawn from each group.
solver.addPartition("group", objectToGroup);

SingleRandomObjectStratifiedMoveTypeSpec stratified;

GroupList groupList;
groupList.partitionName() = "group";
ObjectsFromGroupsSpec objectsFromGroups;
objectsFromGroups.groupList() = groupList;
ObjectsToExploreOptions objectsToExplore;
objectsToExplore.set_objectsFromGroupsSpec(objectsFromGroups);
stratified.objectsToExploreOptions() = objectsToExplore;

SampleSize sampleSize;
sampleSize.defaultSampleSize() = 15;
stratified.stratifiedSampleSize() = sampleSize;

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(stratified));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/SingleRandomObjectStratifiedMoveTypeTest.cpp#L60-L97))

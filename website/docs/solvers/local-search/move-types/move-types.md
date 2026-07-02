# Move Types

Move types drive the evaluation of neighbor states when using the
[local search](../local-search.md) solver.

An assignment of objects to containers defines a **state**. The initial state is the
initial assignment, which the user provides and which generally represents the
current state of the world. The search runs in iterations. In each step, the
constraint and objective functions are evaluated on a set of neighboring states (the
exact set is defined by the move types in use). The best neighbor---the one that
minimizes the objective without breaking constraints---is selected and carried into
the next step. When no neighbor improves the objective, the search has reached a
local minimum and stops; it also stops when a timeout is reached. The state in the
last step is returned as the final assignment.

Each move type defines a set of neighbors to evaluate. For example, the **Single**
move type evaluates every state reachable by moving exactly one object to a different
container, while **Swap** exchanges two objects. Multiple move types can be combined,
and they are applied in order: the first is used until it finds no improvement, then
the second, and so on.

## Common logic

The local search solver orders all containers from hot to cold, by how much each
contributes to the overall objective. Moves out of the hottest container are
evaluated first; if the best of them improves the objective, it is applied and the
search moves on. Otherwise the next-hottest container is considered, and so on. Move
types therefore do not control the order in which source containers are selected.

```
function find_best_neighbor(state):
  for source_container in sort_from_hot_to_cold(all_containers):
    for move_type in move_types:
      best_move = move_type.get_best_move_from(source_container)
      new_state = apply(state, best_move)
      if evaluate_objective(new_state) < evaluate_objective(state):
        return new_state
  return null

function get_final_assignment(initial_assignment):
  state = initial_assignment
  while timeout not exceeded:
    best_neighbor = find_best_neighbor(state)
    if best_neighbor == null:
      break
    state = best_neighbor
  return state
```

Every move type implements `get_best_move_from(source_container)`, with the guarantee
that it evaluates all the moves of that type which take some object out of
`source_container` and returns the best one.

## Move types available

Each move type is implemented by a class that inherits from `MoveType`. The summary
below lists the move types; dedicated pages for each will be linked from this table.

| Name | Description |
|------|-------------|
| [Single](single.md) | Tries moving every object in the source container to every possible destination container. |
| [Single Fast](single-fast.md) | Like Single, but stops after fully exploring the first object that improves the objective, so it may not explore all objects in the source container. |
| [Single Greedy](single-greedy.md) | Tries moving every object to every possible destination, prioritizing destinations by how hot they are, and stops as soon as an improving move is found. Single threaded. |
| [Single Random Batches](single-random-batches.md) | Like Single Greedy, but processes multiple containers at a time to benefit from multi-threading, stopping as soon as an improving move is found. |
| Swap | Tries swapping each object in the source container with every other object in every possible destination container. |
| Swap Full Containers | Tries exchanging all objects in the source container with all objects in every possible destination container. |
| Swap Full With Empty Containers | Tries moving all objects in the source container to every possible empty destination container. |
| Swap Sampled | Like Swap, but evaluates only a sampled subset of all possible swaps, controlled by parameters. |
| Triple Loop | Tries moving every triplet of objects in a cycle, where one object is from the source container and the other two are from different destination containers. |
| KL Search | Inspired by the Kernighan–Lin algorithm: sequentially picks the move (in either direction) with the best objective change regardless of improvement, then keeps the point with the minimum objective. |
| Single Chain | Tries all pairs of moves where an object leaves the hot container and a second object from another container takes its place. Prefer Single End Chain. |
| Single End Chain | Tries all pairs of moves where an object moves from the hot container to a destination, and a second object from that destination moves to another destination. |
| Single Chain Fast | Like Single Chain, but evaluates all moves in parallel and returns as soon as an improving move is found. |
| Single Random Object Stratified | Evaluates moving a sample of objects to a pre-defined container. |
| Single Random Stratified | Tries moving every object in the source container to a random sample of destination containers drawn evenly from similarity classes. |
| Single Coldest Stratified | Like Single Random Stratified, but picks the coldest containers within each similarity class instead of a random sample. |
| Group Move With Hint Strategies | Moves a related set of objects together, guided by hint strategies. |
| Group Routing | Routes groups of objects together between scope items. |
| Greedy Group To Scope Item | Greedily moves a group's objects into a scope item. |
| Colocate Groups | Tries moving a related set of objects in a scope item to every possible combination of containers in every different scope item. |
| Replica Drop | Drops replicas of an object when moving it. |
| Fixed Dest | Tries moving every object in the source container to a specified destination container. |
| Fixed Source | Tries moving every object out of one or more specified source containers. |
| Fixed Dest Multi Move | Tries moving every set of related objects from the hot container to a specified destination container. |
| Fixed Source Multi Move | Tries moving every set of related objects from a specified source container to the hot container. |

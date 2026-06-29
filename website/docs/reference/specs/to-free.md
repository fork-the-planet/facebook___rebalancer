# ToFreeSpec

**Type**: [Goal or Constraint](#goal-vs-constraint)

Empty a set of containers, moving their objects elsewhere. For example, drain a
host before taking it down for maintenance so its tasks are reassigned to other
hosts.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | No | `""` | Descriptive name for logging/debugging. |
| `containers` | list of string | Yes | empty | The containers to empty. |
| `dimension` | string | No | object count | The dimension whose utilization is driven to zero in each container. Defaults to object count, fully emptying it (see [Dimension](#dimension)). |
| `formula` | ToFreeSpecFormula | No | `MINIMIZE_TOTAL_UTILIZATION` | What to minimize, for goal use only (see [Formula](#formula)); a constraint must use the default. |

## Example

An example use: two hosts, with `host0` holding three tasks and `host1` holding
one. A ToFreeSpec constraint on `host0` makes Rebalancer move every task off it.

```cpp
solver.setObjectName("task");
solver.setContainerName("host");

solver.setAssignment(std::map<std::string, std::vector<std::string>>{
    {"host0", {"task0", "task1", "task2"}},
    {"host1", {"task3"}},
});

// Empty host0: every task on it must move elsewhere.
ToFreeSpec toFreeSpec;
toFreeSpec.containers() = {"host0"};
solver.addConstraint(toFreeSpec);
```

Rebalancer moves `task0`, `task1`, and `task2` off `host0` (here onto `host1`,
the only other host), leaving `host0` empty.

## Goal vs. constraint

**As a constraint**, every listed container must end up with zero utilization for
the dimension---by default, no objects at all. A container that starts empty
stays empty.

If a listed container starts non-empty, the constraint is initially broken. Under
the default [constraint policy](../constraint-policy), Rebalancer drains it as a
high-priority goal while never letting new objects move in (see
[No new objects move in](#no-new-objects-move-in-constraint-only)). It empties the
container as much as it can without breaking any constraint that held initially.

**As a goal**, the spec just minimizes how full the listed containers are; it
does not require them to be empty, and it does not stop new objects from moving
in (see [Formula](#formula)).

## No new objects move in (constraint only)

As a constraint, ToFreeSpec also keeps new objects out of a container being
freed, even when letting one in would help another goal. So Rebalancer will not
swap two objects between containers that are both being freed.

For example, two hosts hold one task each and both must be freed, with nowhere
else to put the tasks. An affinity goal makes each task prefer the other host, so
swapping them would help that goal---but the swap moves a task into a container
being freed, so Rebalancer makes no change.

With a custom [dimension](#dimension), only that dimension is kept out: an object
whose value for it is zero may still move in.

## Dimension

By default ToFreeSpec drives the container's object count to zero, emptying it
completely. Set `dimension` to free a specific resource instead: the spec then
drives that dimension's utilization (the sum of the dimension over the
container's objects) to zero. Objects with a zero value do not count, so they may
stay or move in.

For example, freeing a host of a `gpu` dimension moves out only the tasks that
use GPUs; tasks with a `gpu` value of 0 can remain.

## Formula

When used as a goal, `formula` chooses what to minimize across the listed
containers:

| Formula | Minimizes |
|---------|-----------|
| `MINIMIZE_TOTAL_UTILIZATION` (default) | The total utilization (e.g. total object count) left in the listed containers. Drains them as much as possible. |
| `MINIMIZE_OCCUPIED_CONTAINERS` | The number of listed containers that are still non-empty. Prefers fully emptying a few containers over partially draining many. |

The two differ only when there is not enough room to fully empty every listed
container. Say two hosts must be freed, each holding two tasks, but there is room
to move only two tasks out. `MINIMIZE_TOTAL_UTILIZATION` leaves two tasks behind
wherever they fall---it might drain one task from each host, leaving both
occupied. `MINIMIZE_OCCUPIED_CONTAINERS` instead concentrates the removals to
empty one host completely, leaving only the other occupied.

As a constraint, `formula` must be the default; Rebalancer throws otherwise.
`MINIMIZE_OCCUPIED_CONTAINERS` also requires a scalar dimension with no negative
values.

## Source

- Thrift definition: [`interface/thrift/ProblemSpecs.thrift`](https://github.com/facebookincubator/rebalancer/blob/main/algopt/rebalancer/interface/thrift/ProblemSpecs.thrift) (`ToFreeSpec`, `ToFreeSpecFormula`)
- SpecBuilder: [`materializer/spec_builder/ToFreeSpecBuilder.cpp`](https://github.com/facebookincubator/rebalancer/blob/main/algopt/rebalancer/materializer/spec_builder/ToFreeSpecBuilder.cpp)---the code that defines this spec's behavior
- Tests and runnable examples: [`interface/tests/ToFreeTest.cpp`](https://github.com/facebookincubator/rebalancer/blob/main/algopt/rebalancer/interface/tests/ToFreeTest.cpp)---the unit tests the snippets on this page are drawn from

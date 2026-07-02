---
sidebar_position: 1
---

# Introduction to Rebalancer

Rebalancer is a framework for **specifying, solving, and debugging assignment
problems**: deciding how to place objects into containers so that the result
satisfies your constraints and optimizes your objectives. Instead of
hand-writing a mathematical model, you describe the problem once with a high-level,
reusable **domain-specific language (DSL)**, let Rebalancer's solvers find an
assignment, and inspect the result to understand why it came out the way it did.

The core of the Rebalancer library is written in C++ and runs in a single process.
[Python bindings](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/examples/sudoku/sudoku.py)
are available for the same API. Rebalancer offers two families of solvers:
[**local search**](solvers/local-search/local-search.md), a fast heuristic that scales to
problems with millions of objects and tens of thousands of containers but is not
guaranteed to be optimal, and an [**optimal solver**](solvers/optimal.md) based on
mixed-integer programming (MIP), which is provably optimal but suited to smaller
problems. See the [Solver Overview](solvers/overview) for how to choose.

## What is an Assignment Problem?

An **assignment problem** is any problem you can phrase as assigning **objects** to
**containers** such that:

- each object is assigned to exactly one container,
- the assignment satisfies a set of **constraints** (requirements that must hold),
  and
- the assignment optimizes one or more **goals** (objectives to make as good as
  possible).

This abstraction covers a lot of ground. "Objects" and "containers" can be tasks and
servers, shards and hosts, deliveries and trucks, or students and classrooms. If you
can express your problem as placing things into buckets under some constraints and
objectives, Rebalancer can likely model it. Some concrete examples:

- **Systems and infrastructure:** balancing load across servers, distributing
  database shards across hosts under capacity limits and across failure domains for
  reliability, routing traffic to clusters to minimize latency.
- **Operations and logistics:** assigning deliveries to vehicles, distributing
  tasks to workers to balance workload.
- **Classic puzzles:** many well-known puzzles are assignment problems in disguise,
  such as [Sudoku](https://github.com/facebook/rebalancer/tree/main/algopt/rebalancer/examples/sudoku)
  and the [eight queens problem](https://github.com/facebook/rebalancer/tree/main/algopt/rebalancer/examples/eightqueens).

Across all of these, the building blocks are the same; only the goals and constraints
change.

## Why Rebalancer?

Assignment problems pose two challenges. First, translating real-world policies into
the precise formulas that formal optimization requires is tedious and error-prone.
Second, they are non-trivial to solve at scale: assignment problems are NP-hard in
general, so general-purpose solvers struggle on large instances. Rebalancer tackles
the first with a high-level DSL---you describe policies as reusable specs rather than
formulas---and the second with local search. It also makes solutions **debuggable**,
so you can understand and fix a model that is not behaving as expected. Because
specification, solving, and debugging are kept separate, you set up the model once,
try different solvers to weigh solution quality against speed, and investigate the
results to refine your model.

### An expressive DSL

Rebalancer lets you describe a problem in intuitive terms rather than low-level math.
You compose the model from reusable building blocks called **specs** with names like
`BalanceSpec`, `CapacitySpec`, and `MinimizeMovementSpec`, instead of writing linear
constraints by hand. There is a library of 25+ built-in goals and constraints,
covering capacity limits, balancing, packing, placement, movement, and affinities.
See the [Goals and Constraints Reference](reference/) for the full catalog.

### A choice of solvers

The model you build is **independent of how it gets solved**. The problem
specification---the objects, containers, dimensions, goals, and constraints---stays
the same across solvers; switching solvers only changes which solver you hand it to:

- **Local search** starts from an assignment and repeatedly applies small improving
  moves (moving an object, swapping two objects, and so on) until it can no longer
  improve, or hits a time or move limit. It does not guarantee a global optimum, but
  it scales to very large problems.
- **Optimal (MIP) solver** expresses the problem as a mixed-integer program and hands
  it to a MIP backend. It finds provably optimal solutions given enough time, but
  does not scale to very large problems. Rebalancer supports the open-source solver
  [HiGHS](https://highs.dev/) and commercial solvers
  [Gurobi](https://www.gurobi.com/) and
  [FICO XPRESS](https://www.fico.com/en/products/fico-xpress-optimization).

The scaling difference is structural: local search works over an *expression graph*
whose size grows with the number of objects plus containers, while the equivalent MIP
model can grow much larger. See the [Solver Overview](solvers/overview) for the
trade-offs and guidance on choosing between them.

### Tools to debug your model

When a solution is not what you expected, **Rebalancer Explorer** helps you
understand why. It is a visual tool for exploring a solved problem and answering
"what if" questions about it---what if this object moved to another container? would
that break a constraint, or improve a goal? Explorer lets you:

- **Inspect the inputs and the solution** in interactive tables of objects,
  containers, and scopes---filter, sort, and group by any attribute, such as
  dimensions, assignments, and utilization.
- **Compare two assignments** side by side---for example the initial versus the final
  one---and see how each goal and constraint changes between them.
- **Try a hypothetical move** and see its exact effect: whether it breaks a
  constraint, or improves or worsens a goal. This is often the fastest way to explain
  why the solver settled where it did.

With local search, you can also step through the moves the solver made and watch the
objectives and constraints evolve move by move.

### Extensibility

The built-in specs cover the most common goals and constraints. When they are not
enough, the library can be extended to support new goals, constraints, and solving
strategies by adding to the collection.

## Next Steps

- **New to Rebalancer?** Start with the [Installation Guide](getting-started/installation)
  and the [tutorial: Build Your First Model](getting-started/first-model).
- **Want to understand the concepts?** Read the [Core Concepts](core-concepts/overview)
  section.
- **Looking for what goals and constraints are supported?** Browse the
  [Goals and Constraints Reference](reference/) for the full catalog of specs you can
  model.
- **Choosing how to solve?** See the [Solver Overview](solvers/overview).

## Research Paper

Rebalancer's design and algorithms are described in a
[paper published at OSDI 2024](research).

## License

Rebalancer is licensed under the Apache 2.0 License.

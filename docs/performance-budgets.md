# Runtime Performance Budgets

These are correctness and workload budgets, not frame-rate guarantees. Throughput depends on the host browser and hardware.

## Tilemap occupancy

- Supported validation workload: a 100 × 100 tilemap with 10,000 occupied cells.
- `occupy`, `moveOccupant`, and `vacate` use indexed cell/actor lookups and must not scan all occupied actors; each mutation is expected O(1).
- The occupancy regression test fills all 10,000 cells, then exercises relocation, single-step movement, and removal while actor-map iteration is disabled.

## Navigation and rendering

- `findPath` uses four-way breadth-first search; worst-case traversal is O(V + E), where V is the number of reachable cells and E is their cardinal adjacency edges. It allocates per-search queue and predecessor state, so callers should avoid requesting a new route every render frame.
- Tilemap drawing currently visits every cell in each rendered layer (O(width × height)); viewport culling is not part of this budget and should be considered before substantially increasing map dimensions or layer count.

The 10,000-actor test protects the occupancy complexity contract without imposing a machine-dependent wall-clock threshold. It is part of `npm test`.

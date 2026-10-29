/**
 * NAV GRID — a tiny A* pathfinder over the Room's floor, so the avatar
 * walks around the furniture instead of through it. The floor is split
 * into square cells; a cell is blocked when its centre is within `radius`
 * of an obstacle footprint, so the avatar's whole body clears it, not
 * just its centre. Paths are string-pulled into a few straight segments.
 */

const NEIGHBORS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

function blocks(o, x, z, radius) {
  if (o.type === 'circle') return Math.hypot(x - o.x, z - o.z) < o.r + radius;
  const dx = Math.max(o.minX - x, 0, x - o.maxX);
  const dz = Math.max(o.minZ - z, 0, z - o.maxZ);
  return Math.hypot(dx, dz) < radius;
}

function createHeap() {
  const items = [];
  const prio = [];
  const swap = (a, b) => {
    [items[a], items[b]] = [items[b], items[a]];
    [prio[a], prio[b]] = [prio[b], prio[a]];
  };
  return {
    get size() {
      return items.length;
    },
    push(item, p) {
      items.push(item);
      prio.push(p);
      let i = items.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (prio[parent] <= prio[i]) break;
        swap(i, parent);
        i = parent;
      }
    },
    pop() {
      const top = items[0];
      const lastItem = items.pop();
      const lastPrio = prio.pop();
      if (items.length) {
        items[0] = lastItem;
        prio[0] = lastPrio;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < items.length && prio[l] < prio[m]) m = l;
          if (r < items.length && prio[r] < prio[m]) m = r;
          if (m === i) break;
          swap(i, m);
          i = m;
        }
      }
      return top;
    },
  };
}

/**
 * @param bounds   walkable rectangle { minX, maxX, minZ, maxZ } in world units
 * @param obstacles  [{ type: 'rect', minX, maxX, minZ, maxZ } | { type: 'circle', x, z, r }]
 */
export function createNavGrid({ bounds, cell = 0.2, radius = 0.2, obstacles = [] }) {
  const { minX, maxX, minZ, maxZ } = bounds;
  const cols = Math.max(1, Math.floor((maxX - minX) / cell));
  const rows = Math.max(1, Math.floor((maxZ - minZ) / cell));
  const blocked = new Uint8Array(cols * rows);

  const cx = (i) => minX + (i + 0.5) * cell;
  const cz = (j) => minZ + (j + 0.5) * cell;
  const toI = (x) => Math.min(cols - 1, Math.max(0, Math.floor((x - minX) / cell)));
  const toJ = (z) => Math.min(rows - 1, Math.max(0, Math.floor((z - minZ) / cell)));

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      blocked[j * cols + i] = obstacles.some((o) => blocks(o, cx(i), cz(j), radius)) ? 1 : 0;
    }
  }

  const free = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows && !blocked[j * cols + i];

  // Closest walkable cell, searching outward ring by ring.
  function nearestFree(i, j) {
    if (free(i, j)) return [i, j];
    for (let r = 1; r < Math.max(cols, rows); r++) {
      let best = null;
      let bestD = Infinity;
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r || !free(i + di, j + dj)) continue;
          const d = di * di + dj * dj;
          if (d < bestD) {
            bestD = d;
            best = [i + di, j + dj];
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  // Straight-line walkability, sampled at half-cell steps.
  function clear(ax, az, bx, bz) {
    const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / (cell * 0.5));
    for (let s = 0; s <= steps; s++) {
      const t = steps ? s / steps : 0;
      if (!free(toI(ax + (bx - ax) * t), toJ(az + (bz - az) * t))) return false;
    }
    return true;
  }

  /** Returns waypoints [[x, z], ...] ending at (or as near as possible to) the target. */
  function findPath(fromX, fromZ, toX, toZ) {
    const start = nearestFree(toI(fromX), toJ(fromZ));
    const goalCell = nearestFree(toI(toX), toJ(toZ));
    if (!start || !goalCell) return [];

    // Keep the exact clicked point when it's walkable; otherwise stop at the
    // nearest free cell (e.g. clicking the couch walks you up to the couch).
    const inside = toX >= minX && toX <= maxX && toZ >= minZ && toZ <= maxZ;
    const goal =
      inside && free(toI(toX), toJ(toZ)) ? [toX, toZ] : [cx(goalCell[0]), cz(goalCell[1])];
    if (clear(fromX, fromZ, goal[0], goal[1])) return [goal];

    const n = cols * rows;
    const g = new Float32Array(n).fill(Infinity);
    const came = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const s = start[1] * cols + start[0];
    const e = goalCell[1] * cols + goalCell[0];
    const h = (idx) => {
      const di = Math.abs((idx % cols) - goalCell[0]);
      const dj = Math.abs(((idx / cols) | 0) - goalCell[1]);
      return Math.max(di, dj) + (Math.SQRT2 - 1) * Math.min(di, dj); // octile distance
    };

    const heap = createHeap();
    g[s] = 0;
    heap.push(s, h(s));
    while (heap.size) {
      const cur = heap.pop();
      if (cur === e) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const ci = cur % cols;
      const cj = (cur / cols) | 0;
      for (const [di, dj, cost] of NEIGHBORS) {
        const ni = ci + di;
        const nj = cj + dj;
        if (!free(ni, nj)) continue;
        if (di && dj && (!free(ci + di, cj) || !free(ci, cj + dj))) continue; // no corner cutting
        const next = nj * cols + ni;
        const ng = g[cur] + cost;
        if (ng < g[next]) {
          g[next] = ng;
          came[next] = cur;
          heap.push(next, ng + h(next));
        }
      }
    }
    if (e !== s && came[e] === -1) return [];

    const cells = [];
    for (let c = e; c !== -1; c = came[c]) cells.push([cx(c % cols), cz((c / cols) | 0)]);
    cells.reverse();
    cells[cells.length - 1] = goal;

    // String-pull: from each anchor, jump to the farthest waypoint in sight.
    const out = [];
    let ax = fromX;
    let az = fromZ;
    let k = 0;
    while (k < cells.length) {
      let far = k;
      for (let m = cells.length - 1; m > k; m--) {
        if (clear(ax, az, cells[m][0], cells[m][1])) {
          far = m;
          break;
        }
      }
      out.push(cells[far]);
      [ax, az] = cells[far];
      k = far + 1;
    }
    return out;
  }

  return { findPath };
}

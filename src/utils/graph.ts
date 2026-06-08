import type { WebGraph } from "../types";

export function neighbors(graph: WebGraph, nodeId: string): string[] {
  const n: string[] = [];
  for (const e of graph.edges) {
    if (e.from === nodeId) n.push(e.to);
    else if (e.to === nodeId) n.push(e.from);
  }
  return n;
}

export function bfsShortestPath(
  graph: WebGraph,
  start: string,
  goal: string,
): string[] {
  if (start === goal) return [start];
  const q: string[] = [start];
  const prev = new Map<string, string | null>([[start, null]]);

  while (q.length) {
    const cur = q.shift()!;
    for (const next of neighbors(graph, cur)) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      if (next === goal) {
        const path: string[] = [];
        let p: string | null = goal;
        while (p) {
          path.push(p);
          p = prev.get(p) ?? null;
        }
        return path.reverse();
      }
      q.push(next);
    }
  }

  return [];
}


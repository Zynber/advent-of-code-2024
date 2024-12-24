const graph = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .reduce(
    (acc, line) => {
      const verts = line.split("-").toSorted();
      acc.verts.add(verts[0]).add(verts[1]);

      for (const [a, b] of [verts, verts.toReversed()]) {
        const connectedVerts = acc.edges.get(a) ?? new Set();
        connectedVerts.add(b);
        acc.edges.set(a, connectedVerts);
      }

      return acc;
    },
    { verts: new Set<string>(), edges: new Map<string, Set<string>>() },
  );

const largestKn = graph.verts
  .values()
  .reduce((acc, vert) => {
    const connectedVerts = graph.edges.get(vert)?.values().toArray();

    if (!connectedVerts) throw new Error();

    let set = new Set([vert, ...connectedVerts]);

    for (const vert of connectedVerts) {
      if (!set.has(vert)) continue;

      const otherConnectedVerts = graph.edges.get(vert)?.union(new Set([vert]));

      if (!otherConnectedVerts) throw new Error();

      set = set.intersection(otherConnectedVerts);
    }

    acc.set(JSON.stringify(set.values().toArray().toSorted()), set);
    return acc;
  }, new Map<string, Set<string>>())
  .values()
  .reduce((acc, verts) => {
    const max = acc[0]?.size ?? 0;

    if (verts.size > max) return [verts];

    if (verts.size === max) acc.push(verts);

    return acc;
  }, [] as Set<string>[]);

if (largestKn.length > 1) {
  console.log("Found multiple largest K_n:", largestKn);
  throw new Error();
}

console.log(largestKn[0].values().toArray().toSorted().join(","));

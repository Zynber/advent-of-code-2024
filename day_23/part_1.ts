const graph = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .reduce(
    (acc, line) => {
      const verts = line.split("-").toSorted();
      acc.verts.add(verts[0]);
      acc.verts.add(verts[1]);

      let connectedVerts = acc.edges.get(verts[0]) ?? new Set();
      connectedVerts.add(verts[1]);
      acc.edges.set(verts[0], connectedVerts);

      connectedVerts = acc.edges.get(verts[1]) ?? new Set();
      connectedVerts.add(verts[0]);
      acc.edges.set(verts[1], connectedVerts);

      return acc;
    },
    { verts: new Set<string>(), edges: new Map<string, Set<string>>() },
  );

const count = graph.verts
  .values()
  .reduce((acc, vert) => {
    const connectedVerts = graph.edges.get(vert)?.values().toArray();

    if (!connectedVerts) throw new Error();

    if (connectedVerts.length < 2) return acc;

    for (let i = 0; i < connectedVerts.length - 1; i++) {
      for (let j = i + 1; j < connectedVerts.length; j++) {
        if (graph.edges.get(connectedVerts[i])?.has(connectedVerts[j])) {
          const verts = [vert, connectedVerts[i], connectedVerts[j]].toSorted();
          acc.set(JSON.stringify(verts), verts);
        }
      }
    }

    return acc;
  }, new Map<string, string[]>())
  .values()
  .reduce(
    (acc, verts) =>
      verts.some((vert) => vert.startsWith("t")) ? acc + 1 : acc,
    0,
  );

console.log(count);

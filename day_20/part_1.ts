class Coords {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(other: Coords) {
    return new Coords(this.x + other.x, this.y + other.y);
  }

  dist(other: Coords) {
    if (this.x === other.x) return Math.abs(this.y - other.y);

    if (this.y === other.y) return Math.abs(this.x - other.x);

    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

class Direction extends Coords {
  static UP = new Direction(0, -1);
  static RIGHT = new Direction(1, 0);
  static DOWN = new Direction(0, 1);
  static LEFT = new Direction(-1, 0);

  static *values() {
    yield Direction.UP;
    yield Direction.RIGHT;
    yield Direction.DOWN;
    yield Direction.LEFT;
  }

  private constructor(x: number, y: number) {
    super(x, y);
  }
}

class Node {
  readonly position: Coords;
  heuristic: number;

  getNeighbors(mapNodes: Map<string, Node>) {
    return Direction.values().reduce((acc, dir) => {
      const n = mapNodes.get(this.position.add(dir).toString());

      if (n) acc.push(n);

      return acc;
    }, [] as Node[]);
  }

  constructor(position: Coords, heuristic = Number.POSITIVE_INFINITY) {
    this.position = position;
    this.heuristic = heuristic;
  }

  toString() {
    return this.position.toString();
  }
}

const mapStr = await Bun.file(`${import.meta.dir}/input.txt`).text();
const map = mapStr.split("\n").map((line) => line.split(""));

const WIDTH = map[0].length;

const [startPos, endPos] = [mapStr.indexOf("S"), mapStr.indexOf("E")].map(
  (idx) => new Coords(idx % (WIDTH + 1), Math.trunc(idx / (WIDTH + 1))),
);

const mapNodes = map.reduce((acc, row, y) => {
  for (const coords of row.reduce((acc, cell, x) => {
    if (cell === "#") return acc;

    acc.push(new Coords(x, y));
    return acc;
  }, [] as Coords[]))
    acc.set(coords.toString(), new Node(coords, coords.dist(endPos)));

  return acc;
}, new Map<string, Node>());

const startNode = mapNodes.get(startPos.toString());
const endNode = mapNodes.get(endPos.toString());

if (!startNode || !endNode) throw new Error();

function findPath(mapNodes: Map<string, Node>, startNode: Node, endNode: Node) {
  const openedNodes = [startNode];
  const fromNodes = new Map<Node, Node>();
  const gScores = new Map(
    mapNodes.values().map((node) => [node, Number.POSITIVE_INFINITY]),
  );
  const fScores = new Map(
    mapNodes.values().map((node) => [node, Number.POSITIVE_INFINITY]),
  );

  gScores.set(startNode, 0);
  fScores.set(startNode, startNode.heuristic);

  while (openedNodes.length) {
    // biome-ignore lint/style/noNonNullAssertion:
    openedNodes.sort((a, b) => fScores.get(a)! - fScores.get(b)!);
    // biome-ignore lint/style/noNonNullAssertion:
    const currentNode = openedNodes.shift()!;

    if (currentNode === endNode) {
      let prevNode = currentNode;
      const path = [prevNode];

      while (fromNodes.has(prevNode)) {
        // biome-ignore lint/style/noNonNullAssertion:
        prevNode = fromNodes.get(prevNode)!;
        path.unshift(prevNode);
      }

      return path;
    }

    for (const neighbor of currentNode.getNeighbors(mapNodes)) {
      // biome-ignore lint/style/noNonNullAssertion:
      const g = gScores.get(currentNode)! + 1;

      // biome-ignore lint/style/noNonNullAssertion:
      if (g < gScores.get(neighbor)!) {
        fromNodes.set(neighbor, currentNode);
        gScores.set(neighbor, g);
        fScores.set(neighbor, g + neighbor.heuristic);

        if (!openedNodes.includes(neighbor)) openedNodes.push(neighbor);
      }
    }
  }

  return false;
}

const basePath = findPath(mapNodes, startNode, endNode);

if (!basePath) {
  console.log("No path");
  process.exit();
}

console.log(`Base path length is ${basePath.length}`);

const shortcutMap = basePath.reduce(
  (acc, node) => {
    for (const direction of Direction.values()) {
      const [shortcutStartPos, shortcutEndPos] = [
        node.position.add(direction),
        node.position.add(direction).add(direction),
      ].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

      const [shortcutStartPosHash, shortcutEndPosHash] = [
        shortcutStartPos,
        shortcutEndPos,
      ].map((pos) => pos.toString());

      const hash = `${shortcutStartPosHash}-${shortcutEndPosHash}`;

      if (acc.testedShortcuts.has(hash)) continue;

      if (
        mapNodes.has(shortcutStartPosHash) ||
        !mapNodes.has(shortcutEndPosHash)
      )
        continue;

      acc.testedShortcuts.add(hash);

      const testMapNodes = new Map(mapNodes.entries());

      testMapNodes.set(
        shortcutStartPosHash,
        new Node(shortcutStartPos, shortcutStartPos.dist(endNode.position)),
      );

      const path = findPath(testMapNodes, startNode, endNode);

      if (!path) throw new Error();

      const timeSaved = basePath.length - path.length;

      if (timeSaved <= 0) continue;

      acc.value.set(timeSaved, (acc.value.get(timeSaved) ?? 0) + 1);
    }

    return acc;
  },
  { value: new Map<number, number>(), testedShortcuts: new Set<string>() },
).value;

console.log(
  shortcutMap
    .entries()
    .toArray()
    .toSorted((a, b) => a[0] - b[0])
    .map(
      ([saving, count]) =>
        `- There are ${count} cheat(s) that save ${saving} picosecond(s).`,
    )
    .join("\n"),
);

console.log(
  `There are ${shortcutMap
    .entries()
    .reduce(
      (acc, [saving, count]) => (saving < 100 ? acc : acc + count),
      0,
    )} cheats that save at least 100 picoseconds.`,
);

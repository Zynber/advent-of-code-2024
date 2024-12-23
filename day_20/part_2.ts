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

  mul(other: number) {
    return new Coords(this.x * other, this.y * other);
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

  public rotateCw() {
    switch (this) {
      case Direction.UP:
        return Direction.RIGHT;
      case Direction.RIGHT:
        return Direction.DOWN;
      case Direction.DOWN:
        return Direction.LEFT;
      case Direction.LEFT:
        return Direction.UP;
      default:
        throw new Error();
    }
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

const SHORTCUT_LIMIT = 20;
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
        path.push(prevNode);
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

const basePathMap = new Map(
  basePath.map((node, idx) => [node.toString(), idx]),
);

const shortcutMap = new Map<number, number>();

for (
  let currentDistance = 2;
  currentDistance < basePath.length;
  currentDistance++
) {
  const pathNode = basePath[currentDistance];

  for (const dir of Direction.values()) {
    for (
      let shortcutLength = 2;
      shortcutLength <= SHORTCUT_LIMIT;
      shortcutLength++
    ) {
      for (
        let mainMagnitude = 1, orthoMagnitude = shortcutLength - 1;
        mainMagnitude <= shortcutLength;
        mainMagnitude++, orthoMagnitude--
      ) {
        const coords = pathNode.position.add(
          dir.mul(mainMagnitude).add(dir.rotateCw().mul(orthoMagnitude)),
        );
        const remainingDistance = basePathMap.get(coords.toString());

        if (
          remainingDistance === undefined ||
          remainingDistance > currentDistance
        )
          continue;

        const saving = currentDistance - remainingDistance - shortcutLength;

        if (saving) shortcutMap.set(saving, (shortcutMap.get(saving) ?? 0) + 1);
      }
    }
  }
}

console.log(
  `There are ${shortcutMap
    .entries()
    .reduce(
      (acc, [saving, count]) => (saving < 100 ? acc : acc + count),
      0,
    )} cheats that save at least 100 picoseconds.`,
);

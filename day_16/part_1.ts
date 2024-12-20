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

  access<T>(arr: T[][]): T {
    return arr[this.y][this.x];
  }

  eq(other: Coords) {
    return this.x === other.x && this.y === other.y;
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

const DIRECTION = Object.freeze({
  UP: new Coords(0, -1),
  RIGHT: new Coords(1, 0),
  DOWN: new Coords(0, 1),
  LEFT: new Coords(-1, 0),
});

class Node {
  private static dirToHeuristicKey = new Map([
    [DIRECTION.UP, "fromDown"],
    [DIRECTION.RIGHT, "fromLeft"],
    [DIRECTION.DOWN, "fromUp"],
    [DIRECTION.LEFT, "fromRight"],
  ] as const);

  position: Coords;
  heuristic: {
    fromUp: number;
    fromRight: number;
    fromDown: number;
    fromLeft: number;
  };

  constructor(
    position: Coords,
    heuristic: (typeof this)["heuristic"] = {
      fromUp: Number.POSITIVE_INFINITY,
      fromRight: Number.POSITIVE_INFINITY,
      fromDown: Number.POSITIVE_INFINITY,
      fromLeft: Number.POSITIVE_INFINITY,
    },
  ) {
    this.position = position;
    this.heuristic = heuristic;
  }

  getHeuristicByDirection(dir: Coords) {
    const key = Node.dirToHeuristicKey.get(dir);

    if (!key) throw new Error();

    return this.heuristic[key];
  }

  setHeuristicByDirection(dir: Coords, val: number) {
    const key = Node.dirToHeuristicKey.get(dir);

    if (!key) throw new Error();

    const curVal = this.heuristic[key];

    if (val >= curVal) return false;

    this.heuristic[key] = val;
    return true;
  }
}

const mapStr = await Bun.file(`${import.meta.dir}/input.txt`).text();
const startIdx = mapStr.indexOf("S");
const endIdx = mapStr.indexOf("E");
const map = mapStr.split("\n").map((line) => line.split(""));
const width = map[0].length;

// +1 for \n
const startPos = new Coords(
  startIdx % (width + 1),
  Math.trunc(startIdx / (width + 1)),
);
const endPos = new Coords(
  endIdx % (width + 1),
  Math.trunc(endIdx / (width + 1)),
);

const startNode = new Node(startPos, {
  fromUp: 0,
  fromRight: 0,
  fromDown: 0,
  fromLeft: 0,
});
const endNode = new Node(endPos);
const graphNodes = new Map([
  [startNode.position.toString(), startNode],
  [endNode.position.toString(), endNode],
]);

function getAvailableDirections(pos: Coords) {
  return new Set(
    Object.values(DIRECTION).filter((dir) => pos.add(dir).access(map) !== "#"),
  );
}

function traverseToAdjacentIntersections(node: Node, startDir: Coords) {
  const newNodes = new Map<Coords, Node[]>();

  for (const dir of Object.values(DIRECTION)) {
    // Don't turn around
    if (dir.mul(-1).eq(startDir)) continue;

    let currentPos = node.position;
    let nextPos = currentPos.add(dir);

    while (nextPos.access(map) !== "#") {
      const availableDirs = getAvailableDirections(nextPos);

      // If not dead-end or corridor
      if (
        availableDirs.size > 1 &&
        !availableDirs.isSubsetOf(new Set([DIRECTION.LEFT, DIRECTION.RIGHT])) &&
        !availableDirs.isSubsetOf(new Set([DIRECTION.UP, DIRECTION.DOWN]))
      ) {
        const heuristic =
          node.getHeuristicByDirection(startDir) +
          node.position.dist(nextPos) +
          (dir === startDir ? 0 : 1000);
        const discoveredNode =
          graphNodes.get(nextPos.toString()) ?? new Node(nextPos);

        const isNewPath = discoveredNode.setHeuristicByDirection(
          dir,
          heuristic,
        );

        graphNodes.set(nextPos.toString(), discoveredNode);

        if (isNewPath) {
          const arr = newNodes.get(dir) ?? [];
          arr.push(discoveredNode);
          newNodes.set(dir, arr);
        }

        break;
      }

      currentPos = nextPos;
      nextPos = currentPos.add(dir);
    }
  }

  return newNodes;
}

let nodesToExplore = new Map([[DIRECTION.RIGHT, [startNode]]]);

do {
  nodesToExplore = nodesToExplore
    .entries()
    .flatMap(([dir, nodes]) =>
      nodes.map((node) => traverseToAdjacentIntersections(node, dir)),
    )
    .reduce((acc, map) => {
      for (const [key, nodes] of map.entries()) {
        const arr = acc.get(key) ?? [];
        arr.push(...nodes);

        if (arr.length) acc.set(key, arr);
      }

      return acc;
    }, new Map<Coords, Node[]>());
} while (nodesToExplore.size);

console.log(graphNodes.get(endPos.toString())?.heuristic);

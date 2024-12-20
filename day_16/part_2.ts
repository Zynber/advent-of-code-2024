// Bruh

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

  flip() {
    switch (this) {
      case Direction.UP:
        return Direction.DOWN;
      case Direction.RIGHT:
        return Direction.LEFT;
      case Direction.DOWN:
        return Direction.UP;
      case Direction.LEFT:
        return Direction.RIGHT;
      default:
        throw new Error();
    }
  }
}

class Node {
  private static dirToHeuristicKey = new Map([
    [Direction.UP, "fromDown"],
    [Direction.RIGHT, "fromLeft"],
    [Direction.DOWN, "fromUp"],
    [Direction.LEFT, "fromRight"],
  ] as const);

  private static heuristicKeyToDir = new Map([
    ["fromDown", Direction.DOWN],
    ["fromLeft", Direction.LEFT],
    ["fromUp", Direction.UP],
    ["fromRight", Direction.RIGHT],
  ] as const);

  position: Coords;
  heuristic: {
    fromUp: number;
    fromRight: number;
    fromDown: number;
    fromLeft: number;
  };
  private up?: Node;
  private right?: Node;
  private down?: Node;
  private left?: Node;

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

  getNeighborByDirection(dir: Coords) {
    switch (dir) {
      case Direction.UP:
        return this.up;
      case Direction.RIGHT:
        return this.right;
      case Direction.DOWN:
        return this.down;
      case Direction.LEFT:
        return this.left;
    }
  }

  setNeighborByDirection(dir: Coords, val: Node) {
    switch (dir) {
      case Direction.UP: {
        this.up = val;
        val.down = this;
        break;
      }

      case Direction.RIGHT: {
        this.right = val;
        val.left = this;
        break;
      }

      case Direction.DOWN: {
        this.down = val;
        val.up = this;
        break;
      }

      case Direction.LEFT: {
        this.left = val;
        val.right = this;
        break;
      }
    }
  }

  getHeuristicByDirection(dir: Direction) {
    const key = Node.dirToHeuristicKey.get(dir);

    if (!key) throw new Error();

    return this.heuristic[key];
  }

  setHeuristicByDirection(dir: Direction, val: number) {
    const key = Node.dirToHeuristicKey.get(dir);

    if (!key) throw new Error();

    const curVal = this.heuristic[key];

    if (val >= curVal) return false;

    this.heuristic[key] = val;
    return true;
  }

  getDirectionsOfLowestHeuristic() {
    const val = Object.entries(this.heuristic)
      .reduce(
        (acc, [key, h]) => {
          if (h === acc.lowest) acc.value.push(key);
          else if (h < acc.lowest) {
            acc.value = [key];
            acc.lowest = h;
          }

          return acc;
        },
        { lowest: Number.POSITIVE_INFINITY, value: [] as string[] },
      )
      // @ts-expect-error
      // biome-ignore lint/style/noNonNullAssertion:
      .value.map((key) => Node.heuristicKeyToDir.get(key)!);
    return val;
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
    Object.values(Direction).filter((dir) => pos.add(dir).access(map) !== "#"),
  );
}

function traverseToAdjacentIntersections(node: Node, startDir: Direction) {
  const newNodes = new Map<Direction, Node[]>();

  for (const dir of Direction.values()) {
    // Don't turn around
    if (dir.flip() === startDir) continue;

    let currentPos = node.position;
    let nextPos = currentPos.add(dir);

    while (nextPos.access(map) !== "#") {
      const availableDirs = getAvailableDirections(nextPos);

      // If not dead-end or corridor
      if (
        (availableDirs.size > 1 &&
          !availableDirs.isSubsetOf(
            new Set([Direction.LEFT, Direction.RIGHT]),
          ) &&
          !availableDirs.isSubsetOf(new Set([Direction.UP, Direction.DOWN]))) ||
        nextPos.eq(endPos)
      ) {
        const heuristic =
          node.getHeuristicByDirection(startDir) +
          node.position.dist(nextPos) +
          (dir === startDir ? 0 : 1000);
        const discoveredNode =
          graphNodes.get(nextPos.toString()) ?? new Node(nextPos);

        node.setNeighborByDirection(dir, discoveredNode);
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

let nodesToExplore = new Map([[Direction.RIGHT, [startNode]]]);

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
    }, new Map<Direction, Node[]>());
} while (nodesToExplore.size);

for (const node of graphNodes.values()) {
  for (const dir of Direction.values()) {
    const neighbor = node.getNeighborByDirection(dir);

    if (!neighbor) continue;

    const h = node.getHeuristicByDirection(dir.flip());

    if (!Number.isFinite(h)) continue;
  }
}

const filledCells = new Set<string>();

function drawLine(a: Node, b: Node) {
  let { x: xa, y: ya } = a.position;
  let { x: xb, y: yb } = b.position;

  if (xa === xb) {
    [ya, yb] = [ya, yb].sort((a, b) => a - b);

    for (let i = ya; i <= yb; i++) {
      map[i][xa] = "O";
      filledCells.add(`(${xa}, ${i})`);
    }
  } else {
    [xa, xb] = [xa, xb].sort((a, b) => a - b);

    for (let i = xa; i <= xb; i++) {
      map[ya][i] = "O";
      filledCells.add(`(${i}, ${ya})`);
    }
  }
}

let nodesToTraverse: [Direction, Node][] | null = null;

do {
  if (!nodesToTraverse) {
    nodesToTraverse = endNode.getDirectionsOfLowestHeuristic().map((dir) => {
      const n = endNode.getNeighborByDirection(dir);

      if (!n) throw new Error();

      return [dir, n];
    });

    for (const [_, nodeToTraverse] of nodesToTraverse)
      drawLine(endNode, nodeToTraverse);

    continue;
  }

  const nextNodesToTraverse: [Direction, Node][] = [];

  for (const [dir, nodeToTraverse] of nodesToTraverse) {
    if (nodeToTraverse === startNode) continue;

    const dirFlipped = dir.flip();
    let potentialNextNodes: [Direction, Node][] = [];
    let minH = Number.POSITIVE_INFINITY;

    for (const nextDir of Direction.values()) {
      if (nextDir === dirFlipped) continue;

      const nextNode = nodeToTraverse.getNeighborByDirection(nextDir);

      if (!nextNode) continue;

      const h =
        nodeToTraverse.getHeuristicByDirection(nextDir.flip()) -
        (dir === nextDir ? 1000 : 0);

      if (h < minH) {
        potentialNextNodes = [[nextDir, nextNode]];
        minH = h;
      } else if (h <= minH) potentialNextNodes.push([nextDir, nextNode]);
    }

    for (const potentialNextNode of potentialNextNodes)
      drawLine(nodeToTraverse, potentialNextNode[1]);

    nextNodesToTraverse.push(...potentialNextNodes);
  }

  nodesToTraverse = nextNodesToTraverse;
} while (nodesToTraverse.length);

console.log(map.map((row) => row.join("")).join("\n"));
console.log(filledCells.size);

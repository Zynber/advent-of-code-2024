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

  sub(other: Coords) {
    return new Coords(this.x - other.x, this.y - other.y);
  }

  assign<T>(arr: T[][], value: T) {
    arr[this.y][this.x] = value;
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

  get heuristic() {
    const d = endPos.sub(this.position);
    return Math.sqrt(d.x ** 2 + d.y ** 2);
  }

  get neighbors() {
    return Direction.values().reduce((acc, dir) => {
      const n = mapNodes.get(this.position.add(dir).toString());

      if (n) acc.push(n);

      return acc;
    }, [] as Node[]);
  }

  constructor(position: Coords) {
    this.position = position;
  }
}

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

function showMap() {
  console.log(
    map
      .map((row) =>
        row
          .map(
            (cell) =>
              `${Bun.color(cell === "#" ? "red" : cell === "O" ? "green" : "gray", "ansi")}${cell}`,
          )
          .join(""),
      )
      .join("\n"),
  );
}

const width = 71;
const height = 71;
const endPos = new Coords(width - 1, height - 1);
const limit = 1024;
const filledCells = new Set<string>();
const map: string[][] = Array(height)
  .fill(0)
  .map(() => Array(width).fill("."));

for (const coords of (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .slice(0, limit)
  .map((line) => {
    const [x, y] = line.split(",").map((n) => Number.parseInt(n));
    return new Coords(x, y);
  })) {
  coords.assign(map, "#");
}

const mapNodes = map.reduce((acc, row, y) => {
  for (const coords of row.reduce((acc, cell, x) => {
    if (cell === "#") return acc;

    acc.push(new Coords(x, y));
    return acc;
  }, [] as Coords[]))
    acc.set(coords.toString(), new Node(coords));

  return acc;
}, new Map<string, Node>());

const startNode = mapNodes.get("(0, 0)");
const endNode = mapNodes.get(`(${width - 1}, ${height - 1})`);

if (!(startNode && endNode)) throw new Error();

// Yes I just looked up A* on Wikipedia

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

    while (fromNodes.has(prevNode)) {
      // biome-ignore lint/style/noNonNullAssertion:
      const nextPrevNode = fromNodes.get(prevNode)!;
      drawLine(prevNode, nextPrevNode);
      prevNode = nextPrevNode;
    }

    showMap();
    console.log(`${filledCells.size - 1} steps`);
    process.exit();
  }

  for (const neighbor of currentNode.neighbors) {
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

console.log("Didn't find a path");

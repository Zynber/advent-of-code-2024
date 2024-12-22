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

  getNeighbors(mapNodes: Map<string, Node>) {
    return Direction.values().reduce((acc, dir) => {
      const n = mapNodes.get(this.position.add(dir).toString());

      if (n) acc.push(n);

      return acc;
    }, [] as Node[]);
  }

  constructor(position: Coords) {
    this.position = position;
  }

  toString() {
    return this.position.toString();
  }
}

function drawLine(map: string[][], a: Node, b: Node) {
  let { x: xa, y: ya } = a.position;
  let { x: xb, y: yb } = b.position;

  if (xa === xb) {
    [ya, yb] = [ya, yb].sort((a, b) => a - b);

    for (let i = ya; i <= yb; i++) map[i][xa] = "O";
  } else {
    [xa, xb] = [xa, xb].sort((a, b) => a - b);

    for (let i = xa; i <= xb; i++) map[ya][i] = "O";
  }
}

function showMap(map: string[][]) {
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
const corruptedCoords = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((line) => {
    const [x, y] = line.split(",").map((n) => Number.parseInt(n));
    return new Coords(x, y);
  });

// Yes I just looked up A* on Wikipedia
function findPath(map: string[][]) {
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

for (let i = corruptedCoords.length; i > 0; i--) {
  const map: string[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill("."));

  for (const coords of corruptedCoords.slice(0, i)) coords.assign(map, "#");

  const path = findPath(map);

  if (path) {
    for (let i = 1; i < path.length; i++) drawLine(map, path[i - 1], path[i]);
    map[corruptedCoords[i].y][corruptedCoords[i].x] =
      `${Bun.color("magenta", "ansi")}O`;
    console.log("Last traversable map:");
    showMap(map);
    console.log(
      `${Bun.color("white", "ansi")}Blocker: ${corruptedCoords[i].toString()}`,
    );
    break;
  }
}

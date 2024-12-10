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
    return arr[this.y]?.[this.x];
  }

  safeAccess<T>(arr: T[][]): T | undefined {
    return arr[this.y]?.[this.x];
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

const DIRECTIONS = [
  new Coords(0, -1),
  new Coords(1, 0),
  new Coords(0, 1),
  new Coords(-1, 0),
] as const;

function traverse(startPos: Coords): Set<string> {
  let currentPos = startPos;
  let currentHeight = currentPos.access(map);

  while (currentHeight !== 9) {
    const accessibleAdjacentCellPos = DIRECTIONS.map((dir) =>
      currentPos.add(dir),
    ).filter((checkPos) => checkPos.safeAccess(map) === currentHeight + 1);

    switch (accessibleAdjacentCellPos.length) {
      case 0:
        return new Set();

      case 1:
        currentPos = accessibleAdjacentCellPos[0];
        currentHeight = currentPos.access(map);
        break;

      default:
        return accessibleAdjacentCellPos
          .map((pos) => traverse(pos))
          .reduce((acc, curr) => acc.union(curr));
    }
  }

  return new Set([currentPos.toString()]);
}

const map = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((row) => row.split("").map((cell) => Number.parseInt(cell)));

const width = map[0].length;
const height = map.length;

let sum = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (map[y][x]) continue;

    sum += traverse(new Coords(x, y)).size;
  }
}

console.log(sum);

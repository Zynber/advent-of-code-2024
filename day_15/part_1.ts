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

  assign<T>(arr: T[][], value: T) {
    arr[this.y][this.x] = value;
  }
}

const DIRECTION = Object.freeze({
  UP: new Coords(0, -1),
  RIGHT: new Coords(1, 0),
  DOWN: new Coords(0, 1),
  LEFT: new Coords(-1, 0),
});

const OBJECT = Object.freeze({
  WALL: "#",
  BOX: "O",
  EMPTY: ".",
});

const [mapStr, movesStr] = (
  await Bun.file(`${import.meta.dir}/input.txt`).text()
).split("\n\n");

const map = mapStr.split("\n").map((line) => line.split(""));
const moves = movesStr
  .replaceAll("\n", "")
  .split("")
  .map((char) => {
    switch (char) {
      case "^":
        return DIRECTION.UP;
      case ">":
        return DIRECTION.RIGHT;
      case "v":
        return DIRECTION.DOWN;
      case "<":
        return DIRECTION.LEFT;
      default:
        throw new Error();
    }
  });

const width = map[0].length;
const startIdx = map.flat().indexOf("@");
let currentPos = new Coords(startIdx % width, Math.trunc(startIdx / width));

function moveIfValid(from: Coords, dir: Coords): boolean {
  const targetPos = from.add(dir);
  const targetCell = targetPos.access(map);
  const isValidMove =
    targetCell === OBJECT.EMPTY ||
    (targetCell === OBJECT.BOX && moveIfValid(targetPos, dir));

  if (isValidMove) {
    targetPos.assign(map, from.access(map));
    from.assign(map, OBJECT.EMPTY);
  }

  return isValidMove;
}

for (const move of moves) {
  const moved = moveIfValid(currentPos, move);

  if (moved) currentPos = currentPos.add(move);
}

const sum = map.reduce(
  (acc, row, y) =>
    row.reduce(
      (acc, cell, x) => acc + (cell === OBJECT.BOX ? 100 * y + x : 0),
      0,
    ) + acc,
  0,
);

console.log(map.map((row) => row.join("")).join("\n"));
console.log(sum);

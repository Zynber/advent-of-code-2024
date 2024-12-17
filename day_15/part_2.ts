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

  eq(other: Coords) {
    return this.x === other.x && this.y === other.y;
  }
}

const DIRECTION = Object.freeze({
  UP: new Coords(0, -1),
  RIGHT: new Coords(1, 0),
  DOWN: new Coords(0, 1),
  LEFT: new Coords(-1, 0),
});

const OBJECT = Object.freeze({
  ROBOT: "@",
  WALL: "#",
  BOX_L: "[",
  BOX_R: "]",
  EMPTY: ".",
});

const [mapStr, movesStr] = (
  await Bun.file(`${import.meta.dir}/input.txt`).text()
).split("\n\n");

const map = mapStr
  .split("\n")
  .map((line) =>
    line
      .replaceAll("#", "##")
      .replaceAll("O", "[]")
      .replaceAll(".", "..")
      .replaceAll("@", "@.")
      .split(""),
  );
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

function checkCanMove(
  from: Coords,
  dir: Coords,
  moveQueue: Coords[],
  checkedOtherHalf = false,
): boolean {
  let isValidMove = true;
  const fromCell = from.access(map);

  if (
    !checkedOtherHalf &&
    (fromCell === OBJECT.BOX_L || fromCell === OBJECT.BOX_R) &&
    (dir === DIRECTION.UP || dir === DIRECTION.DOWN)
  ) {
    const otherHalfPos = from.add(
      fromCell === OBJECT.BOX_L ? DIRECTION.RIGHT : DIRECTION.LEFT,
    );
    isValidMove = checkCanMove(otherHalfPos, dir, moveQueue, true);

    if (!isValidMove) return false;
  }

  const targetPos = from.add(dir);
  const targetCell = targetPos.access(map);

  // This is not great :/
  if (
    moveQueue.some((pos) => pos.eq(targetPos)) ||
    (isValidMove =
      targetCell === OBJECT.EMPTY ||
      ((targetCell === OBJECT.BOX_L || targetCell === OBJECT.BOX_R) &&
        checkCanMove(targetPos, dir, moveQueue)))
  )
    moveQueue.push(from);

  return isValidMove;
}

for (const move of moves) {
  const moveQueue = [] as Coords[];
  const canMove = checkCanMove(currentPos, move, moveQueue);

  if (!canMove) continue;

  for (const moveSubject of moveQueue) {
    moveSubject.add(move).assign(map, moveSubject.access(map));
    moveSubject.assign(map, OBJECT.EMPTY);
  }

  currentPos = currentPos.add(move);
}

const sum = map.reduce(
  (acc, row, y) =>
    row.reduce(
      (acc, cell, x) => acc + (cell === OBJECT.BOX_L ? 100 * y + x : 0),
      0,
    ) + acc,
  0,
);

console.log(map.map((row) => row.join("")).join("\n"));
console.log(sum);

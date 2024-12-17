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
}

const width = 101;
const height = 103;
const dt = 100;

const robots = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .matchAll(/p=(-?\d+),(-?\d+) v=(-?\d+),(-?\d+)/g)
  .map((match) => {
    const vals = match.slice(1, 5).map((n) => Number.parseInt(n));

    const startPosition = new Coords(vals[0], vals[1]);
    const velocity = new Coords(vals[2], vals[3]);

    const finalPosition = startPosition.add(velocity.mul(dt));

    let correctedX = finalPosition.x % width;
    let correctedY = finalPosition.y % height;

    if (correctedX < 0) correctedX = (correctedX + width) % width;
    if (correctedY < 0) correctedY = (correctedY + height) % height;

    return new Coords(correctedX, correctedY);
  });

const map = Array(height)
  .fill(0)
  .map(() => Array<number>(width).fill(0));

for (const robot of robots) map[robot.y][robot.x]++;

console.log(
  map.map((row) => row.map((cell) => cell || ".").join("")).join("\n"),
);

const center = new Coords(Math.floor(width / 2), Math.floor(height / 2));
const sliceRangesY = [[0, center.y], [center.y + 1]];
const sliceRangesX = [[0, center.x], [center.x + 1]];
const safetyFactor = Array(4)
  .fill(0)
  .reduce<number>(
    (acc, _, idx) =>
      acc *
      map
        .slice(...sliceRangesY[idx >> 1])
        .flatMap((row) => row.slice(...sliceRangesX[idx & 1]))
        .reduce((acc, cell) => acc + cell),
    1,
  );

console.log(safetyFactor);

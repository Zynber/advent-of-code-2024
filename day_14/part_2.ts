// I had to search for hints for this part :[

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

const robots = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .matchAll(/p=(-?\d+),(-?\d+) v=(-?\d+),(-?\d+)/g)
  .map((match) => {
    const vals = match.slice(1, 5).map((n) => Number.parseInt(n));

    return {
      position: new Coords(vals[0], vals[1]),
      velocity: new Coords(vals[2], vals[3]),
    };
  })
  .toArray();

const width = 101;
const height = 103;
let dt = 7132;

// 101 * 103 = 10403
// Found patterns at 25 and 62, 128 and 163

// ?? = 25 (mod 103)
// ?? = 62 (mod 101)

// From calculator, ?? = 7132 (mod 10403)

for await (const _ of console) {
  const futureRobots = robots.map((robot) => {
    const finalPosition = robot.position.add(robot.velocity.mul(dt));

    let correctedX = finalPosition.x % width;
    let correctedY = finalPosition.y % height;

    if (correctedX < 0) correctedX = (correctedX + width) % width;
    if (correctedY < 0) correctedY = (correctedY + height) % height;

    return new Coords(correctedX, correctedY);
  });

  const map = Array(height)
    .fill(0)
    .map(() => Array<number>(width).fill(0));

  for (const robot of futureRobots) map[robot.y][robot.x]++;

  console.log(`Elapsed time: ${dt}`);
  console.log(
    map.map((row) => row.map((cell) => cell || " ").join("")).join("\n"),
  );
  dt += 1;
}

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
}

const bigNum = new Coords(10_000_000_000_000, 10_000_000_000_000);

// a = 3, b = 1
// maximize b, minimize a

const result = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .matchAll(/.+X\+(\d+), Y\+(\d+)\n.+X\+(\d+), Y\+(\d+)\n.+X=(\d+), Y=(\d+)/g)
  .map((match) => {
    // Let Z = prize, a = btn A, b = btn B, _1 for x amount, _2 for y amount
    // Solving for x,
    // (Z_1 - a_1x) / b_1 = (Z_2 - a_2x) / b_2
    // Z_1 / b_1 - a_1x / b_1 = Z_2 / b_2 - a_2x / b_2
    // a_2x / b_2 - a_1x / b_1 = Z_2 / b_2 - Z_1 / b_1
    // (a_2 * b_1 * x - a_1 * b_2 * x) / (b_1 * b_2) = Z_2 / b_2 - Z_1 / b_1
    // x(a_2 * b_1 - a_1 * b_2) = (Z_2 / b_2 - Z_1 / b_1)(b_1 * b_2)
    // x = ((Z_2 / b_2 - Z_1 / b_1)(b_1 * b_2)) / (a_2 * b_1 - a_1 * b_2)
    // Simplify to below because floating point screwed me
    // x = (Z_2 * b_1 - Z_1 * b_2) / (a_2 * b_1 - a_1 * b_2)

    // If x is not integer, discard, else substitute x
    // y = (Z_1 - a_1x) / b_1

    const nums = match.slice(1, 7).map((n) => Number.parseInt(n));
    const a = new Coords(nums[0], nums[1]);
    const b = new Coords(nums[2], nums[3]);
    const target = new Coords(nums[4], nums[5]).add(bigNum);

    const x = (target.y * b.x - target.x * b.y) / (a.y * b.x - a.x * b.y);

    if (x % 1) return null;

    const y = (target.x - a.x * x) / b.x;

    if (y % 1) return null;

    return x * 3 + y;
  })
  .reduce<number>((acc, tokenCount) => acc + (tokenCount ?? 0), 0);

console.log(result);

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

  mul(other: number) {
    return new Coords(this.x * other, this.y * other);
  }

  div(other: Coords) {
    return new Coords(this.x / other.x, this.y / other.y);
  }

  trunc() {
    return new Coords(Math.trunc(this.x), Math.trunc(this.y));
  }

  eq(other: Coords) {
    return this.x === other.x && this.y === other.y;
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

// a = 3, b = 1
// maximize b, minimize a

const result = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .matchAll(/.+X\+(\d+), Y\+(\d+)\n.+X\+(\d+), Y\+(\d+)\n.+X=(\d+), Y=(\d+)/g)
  .map((match) => {
    const nums = match.slice(1, 7).map((n) => Number.parseInt(n));
    const a = new Coords(nums[0], nums[1]);
    const b = new Coords(nums[2], nums[3]);
    const target = new Coords(nums[4], nums[5]);

    for (let aCount = 0; aCount < 100; aCount++) {
      // mA + nB = P
      // n = (P - mA) / B
      const bCounts = target.sub(a.mul(aCount)).div(b);

      if (bCounts.x === bCounts.y && bCounts.eq(bCounts.trunc())) {
        console.log(a.toString(), b.toString(), target.toString());
        console.log();
        return aCount * 3 + bCounts.x;
      }
    }

    return null;
  })
  .reduce<number>((acc, tokenCount) => acc + (tokenCount ?? 0), 0);

console.log(result);

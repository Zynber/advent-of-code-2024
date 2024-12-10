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

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

const map = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((row) => row.split(""));

const height = map.length;
const width = map[0].length;

const result = map
  .flat()
  .reduce((acc, cell, idx) => {
    if (cell === ".") return acc;

    const coords = acc.get(cell) ?? [];
    coords.push(new Coords(idx % width, Math.trunc(idx / width)));

    acc.set(cell, coords);
    return acc;
  }, new Map<string, Coords[]>())
  .values()
  .reduce((acc, antennaPos) => {
    for (const a of antennaPos) {
      for (const b of antennaPos) {
        if (a === b) continue;

        for (const coords of [a.add(a).sub(b), b.add(b).sub(a)]) {
          if (
            coords.x >= 0 &&
            coords.x < width &&
            coords.y >= 0 &&
            coords.y < height
          )
            acc.add(coords.toString());
        }
      }
    }
    return acc;
  }, new Set<string>());

console.log(result);
console.log(result.size);

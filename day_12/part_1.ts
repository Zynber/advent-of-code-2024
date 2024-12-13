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

const map = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((row) => row.split(""));

const checkedCoords = new Set<string>();

const result = map
  .flatMap((row, rowIdx) => row.map((_, colIdx) => new Coords(colIdx, rowIdx)))
  .reduce((acc, coords) => {
    if (checkedCoords.has(coords.toString())) return acc;

    const plantType = coords.access(map);
    let cellCount = 0;
    let borderCount = 0;
    let currentCoords = new Map<string, Coords>([
      [coords.toString(), coords],
    ] as const);

    do {
      const iterResult = currentCoords.values().reduce(
        (acc, coords) => {
          cellCount++;
          checkedCoords.add(coords.toString());

          const adjacentCoordsOfSameType = DIRECTIONS.reduce((acc, dir) => {
            const adjacentCoords = coords.add(dir);

            if (plantType === adjacentCoords.safeAccess(map))
              acc.set(adjacentCoords.toString(), adjacentCoords);

            return acc;
          }, new Map<string, Coords>());

          acc.borderCount += DIRECTIONS.length - adjacentCoordsOfSameType.size;

          for (const entry of adjacentCoordsOfSameType
            .entries()
            .filter(
              ([_, coords]) => checkedCoords.has(coords.toString()) === false,
            ))
            acc.nextCoords.set(...entry);

          return acc;
        },
        { borderCount: 0, nextCoords: new Map<string, Coords>() },
      );

      borderCount += iterResult.borderCount;
      currentCoords = iterResult.nextCoords;
    } while (currentCoords.size);

    return acc + borderCount * cellCount;
  }, 0);

console.log(result);

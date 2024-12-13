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
    const edgeGraph = {
      rows: [] as Coords[][],
      cols: [] as Coords[][],
    };
    let currentCoords = new Map<string, Coords>([
      [coords.toString(), coords],
    ] as const);

    do {
      currentCoords = currentCoords.values().reduce((acc, coords) => {
        cellCount++;
        checkedCoords.add(coords.toString());

        const adjacentCoordsOfSameType = DIRECTIONS.reduce(
          (adjacentCoordsOfSameType, dir) => {
            const adjacentCoords = coords.add(dir);

            if (plantType === adjacentCoords.safeAccess(map))
              adjacentCoordsOfSameType.set(
                adjacentCoords.toString(),
                adjacentCoords,
              );
            else {
              const orientation = dir.x ? "cols" : "rows";
              const lineIdx =
                coords[dir.x ? "x" : "y"] + // HORIZONTAL ? "x" : "y"
                Math.max(dir.x, dir.y); //     RIGHT || DOWN ? 1 : 0
              const line = edgeGraph[orientation].at(lineIdx) ?? [];

              line[coords[dir.x ? "y" : "x"]] = dir;
              edgeGraph[orientation][lineIdx] = line;
            }

            return adjacentCoordsOfSameType;
          },
          new Map<string, Coords>(),
        );

        for (const entry of adjacentCoordsOfSameType
          .entries()
          .filter(
            ([_, coords]) => checkedCoords.has(coords.toString()) === false,
          ))
          acc.set(...entry);

        return acc;
      }, new Map<string, Coords>());
    } while (currentCoords.size);

    const edgeCount = Object.values(edgeGraph)
      .flat()
      .reduce(
        (acc, line) =>
          acc +
          line.reduce(
            (acc, side, idx) => {
              // Haha sparse array go brr
              if (idx - 1 !== acc.lastIdx || line[acc.lastIdx] !== side)
                acc.value++;

              acc.lastIdx = idx;
              return acc;
            },
            { value: 0, lastIdx: Number.NEGATIVE_INFINITY },
          ).value,
        0,
      );

    return acc + edgeCount * cellCount;
  }, 0);

console.log(result);

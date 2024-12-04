function range(start: number, end?: number) {
  if (!end) {
    // biome-ignore lint/style/noParameterAssign:
    end = start;
    // biome-ignore lint/style/noParameterAssign:
    start = 0;
  }

  const arr = [...Array(Math.abs(end - start)).keys()].map((i) => i + start);

  return end < start ? arr.reverse() : arr;
}

function getSearchSpace(rowIdx: number, colIdx: number) {
  const rowDirs = [-1, 1];
  const colDirs = [-1, 1];

  return rowDirs.flatMap((rowDir) =>
    colDirs.map((colDir) =>
      range(3).map((i) => [
        rowIdx - rowDir + i * rowDir,
        colIdx - colDir + i * colDir,
      ]),
    ),
  );
}

const searchGrid = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((row) => row.split(""));

const height = searchGrid.length;
const width = searchGrid[0].length;

const result = range(height)
  .flatMap((rowIdx) => range(width).map((colIdx) => [rowIdx, colIdx] as const))
  .reduce((acc, [rowIdx, colIdx]) => {
    if (
      !rowIdx ||
      !colIdx ||
      rowIdx === height - 1 ||
      colIdx === width - 1 ||
      searchGrid[rowIdx][colIdx] !== "A"
    )
      return acc;

    return (
      acc +
      Number(
        getSearchSpace(rowIdx, colIdx).reduce((acc, line) => {
          return (
            acc +
            Number(
              Bun.deepEquals(
                line.map(([rowIdx, colIdx]) => searchGrid[rowIdx][colIdx]),
                ["M", "A", "S"],
              ),
            )
          );
        }, 0) === 2,
      )
    );
  }, 0);

console.log(result);

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
  const dists = range(1, 4);

  const rowDirs = range(-1, 2);
  const colDirs = range(-1, 2);

  return rowDirs
    .flatMap((rowDir) =>
      colDirs.map((colDir) =>
        dists.map((i) => [rowIdx + i * rowDir, colIdx + i * colDir] as const),
      ),
    )
    .toSpliced(4, 1); // Remove 0, 0
}

const searchGrid = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((row) => row.split(""));

const height = searchGrid.length;
const width = searchGrid[0].length;

const result = range(height)
  .flatMap((rowIdx) => range(width).map((colIdx) => [rowIdx, colIdx] as const))
  .reduce((acc, [rowIdx, colIdx]) => {
    if (searchGrid[rowIdx][colIdx] !== "X") return acc;

    return (
      acc +
      getSearchSpace(rowIdx, colIdx)
        .filter((line) =>
          line.every(([i, j]) => i >= 0 && j >= 0 && i < height && j < width),
        )
        .reduce(
          (acc, line) =>
            acc +
            Number(
              Bun.deepEquals(
                line.map(([rowIdx, colIdx]) => searchGrid[rowIdx][colIdx]),
                ["M", "A", "S"],
              ),
            ),
          0,
        )
    );
  }, 0);

console.log(result);

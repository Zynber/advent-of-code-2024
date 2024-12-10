const numTxt = await Bun.file(`${import.meta.dir}/input.txt`).text();
const diff = numTxt
  .split("\n")
  .map((row) => row.split(/ +/g).map((numStr) => Number.parseInt(numStr)))
  .reduce(
    (acc, curr, idx) => {
      acc[0][idx] = curr[0];
      acc[1][idx] = curr[1];
      return acc;
    },
    [[], []] as [number[], number[]],
  )
  .map((col) => col.sort())
  .reduce(
    (acc, curr, colIdx) => {
      curr.forEach((num, rowIdx) =>
        acc.at(rowIdx) === undefined
          ? (acc[rowIdx] = [num, Number.NaN])
          : (acc[rowIdx][colIdx] = num),
      );
      return acc;
    },
    [] as [number, number][],
  )
  .map((pair) => Math.abs(pair[0] - pair[1]))
  .reduce((acc, curr) => acc + curr, 0);

console.log(diff);

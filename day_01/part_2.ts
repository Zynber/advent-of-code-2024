const numTxt = await Bun.file(`${import.meta.dir}/input.txt`).text();
const sim = numTxt
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
  .map((col, idx) => {
    if (!idx) return col;

    return col.reduce((acc, curr) => {
      const count = acc.get(curr);
      acc.set(curr, count ? count + 1 : 1);
      return acc;
    }, new Map<number, number>());
  })
  .reduce(
    (acc, curr) => {
      acc[0].push(curr);
      return acc;
    },
    [[]] as [(number[] | Map<number, number>)[]],
  )
  .reduce((_, curr) => {
    const left = curr[0] as number[];
    const right = curr[1] as Map<number, number>;
    return left.reduce((acc, curr) => acc + (right.get(curr) ?? 0) * curr, 0);
  }, 0);

console.log(sim);

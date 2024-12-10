const fileBlocks = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("")
  .map((d) => Number.parseInt(d))
  .reduce(
    (acc, digit, idx) => {
      acc.value.push(...Array(digit).fill(idx % 2 ? -1 : acc.id++));
      return acc;
    },
    { value: [] as number[], id: 0 },
  ).value;

while (true) {
  const firstEmptyIdx = fileBlocks.findIndex((block) => block === -1);
  const lastFileIdx = fileBlocks.findLastIndex((block) => block !== -1);

  if (firstEmptyIdx > lastFileIdx) {
    fileBlocks.splice(firstEmptyIdx, fileBlocks.length - firstEmptyIdx);
    break;
  }

  [fileBlocks[firstEmptyIdx], fileBlocks[lastFileIdx]] = [
    fileBlocks[lastFileIdx],
    fileBlocks[firstEmptyIdx],
  ];
}

console.log(fileBlocks.reduce((acc, block, idx) => acc + block * idx));

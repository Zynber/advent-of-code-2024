const {
  value: fileBlocks,
  mapping,
  id: maxId,
} = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("")
  .map((d) => Number.parseInt(d))
  .reduce(
    (acc, digit, idx) => {
      const isEmpty = idx % 2;
      const start = acc.value.length;

      acc.value.push(...Array(digit).fill(isEmpty ? -1 : acc.id));

      if (!isEmpty) {
        acc.mapping.set(acc.id, [start, acc.value.length]);
        acc.id++;
      }

      return acc;
    },
    {
      value: [] as number[],
      mapping: new Map<number, [number, number]>(),
      id: 0,
    },
  );

for (let id = maxId - 1; id >= 0; id--) {
  const m = mapping.get(id);

  if (!m) throw new Error();

  const [startIdx, endIdx] = m;
  const fileLength = endIdx - startIdx;

  const freeIdx = fileBlocks.slice(0, startIdx).findIndex((_, idx) => {
    const segment = fileBlocks.slice(idx, idx + fileLength);
    return (
      segment.length === fileLength && segment.every((block) => block === -1)
    );
  });

  if (freeIdx === -1) continue;

  fileBlocks.fill(id, freeIdx, freeIdx + fileLength);
  fileBlocks.fill(-1, startIdx, endIdx);
}

console.log(fileBlocks);
console.log(
  fileBlocks.reduce((acc, block, idx) =>
    block === -1 ? acc : acc + block * idx,
  ),
);

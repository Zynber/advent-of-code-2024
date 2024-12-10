const corruptedMemoryTxt = await Bun.file(
  `${import.meta.dir}/input.txt`,
).text();

const mulSum = corruptedMemoryTxt
  .matchAll(/mul\((\d+),(\d+)\)/g)
  .reduce(
    (acc, match) => acc + Number.parseInt(match[1]) * Number.parseInt(match[2]),
    0,
  );

console.log(mulSum);

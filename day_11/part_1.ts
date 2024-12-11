let stones = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split(" ")
  .map((n) => Number.parseInt(n));

const iterCount = 25;

const start = performance.now();

for (let i = 0; i < iterCount; i++) {
  stones = stones.reduce((acc, stone) => {
    if (!stone) {
      acc.push(1);
      return acc;
    }

    const digitCount = Math.floor(Math.log10(stone)) + 1;

    if (!(digitCount % 2)) {
      const half = digitCount / 2;
      acc.push(Math.floor(stone / 10 ** half), stone % 10 ** half);
    } else acc.push(stone * 2024);

    return acc;
  }, [] as number[]);
}

const time = performance.now() - start;

console.log(`${stones.length} (${time} ms)`);

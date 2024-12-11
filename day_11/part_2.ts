const stones = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split(" ")
  .map((n) => Number.parseInt(n));

const iterCount = 75;

function parseStone(stone: number) {
  if (!stone) return [1];

  const digitCount = Math.floor(Math.log10(stone)) + 1;

  if (!(digitCount % 2)) {
    const half = digitCount / 2;
    return [Math.floor(stone / 10 ** half), stone % 10 ** half];
  }

  return [stone * 2024];
}

const cache = new Map<string, number>();

function depthFirstParse(stones: number[], depth = 0): number {
  if (depth >= iterCount) return stones.length;

  let length = 0;

  for (const stone of stones) {
    const hash = `${depth}-${stone}`;
    const cachedLength = cache.get(hash);

    if (cachedLength !== undefined) length += cachedLength;
    else {
      const newLength = depthFirstParse(parseStone(stone), depth + 1);
      cache.set(hash, newLength);
      length += newLength;
    }
  }

  return length;
}
const start = performance.now();
const result = depthFirstParse(stones);
const time = performance.now() - start;

console.log(`${result} (${time} ms)`);
process.exit();

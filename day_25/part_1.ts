const HEIGHT = 5;

const { locks, keys } = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n\n")
  .map((schematic) => schematic.split("\n"))
  .reduce(
    (acc, schematic) => {
      acc[schematic[0] === "#####" ? "locks" : "keys"].push(
        Array(schematic[0].length)
          .fill(0)
          .map(
            (_, idx) =>
              schematic.filter((line) => line[idx] === "#").length - 1,
          ),
      );
      return acc;
    },
    { locks: [] as number[][], keys: [] as number[][] },
  );

const count = locks.reduce(
  (acc, lock) =>
    acc +
    keys.filter((key) =>
      key.every((keyCol, idx) => keyCol + lock[idx] <= HEIGHT),
    ).length,
  0,
);

console.log(count);

// This was really fun. Kept me sane(-ish) while preparing for my finals.
// I totally f- up my finals, by the way.

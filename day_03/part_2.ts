const corruptedMemoryTxt = await Bun.file(
  `${import.meta.dir}/input.txt`,
).text();

const mulSum = corruptedMemoryTxt
  .matchAll(/mul\((\d+),(\d+)\)|do\(\)|don't\(\)/g)
  .reduce(
    (acc, match) => {
      switch (match[0]) {
        case "do()":
          acc.do = true;
          break;

        case "don't()":
          acc.do = false;
          break;

        default:
          if (!acc.do) break;

          acc.value += Number.parseInt(match[1]) * Number.parseInt(match[2]);
      }

      return acc;
    },
    { do: true, value: 0 },
  ).value;

console.log(mulSum);

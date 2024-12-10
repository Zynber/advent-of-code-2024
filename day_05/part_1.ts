const [rulesStr, updatesStr] = (
  await Bun.file(`${import.meta.dir}/input.txt`).text()
).split("\n\n");

// A mapping of number to numbers that need to be before it
const rules = rulesStr
  .matchAll(/(\d+)\|(\d+)/g)
  .map(
    (match) => [Number.parseInt(match[1]), Number.parseInt(match[2])] as const,
  )
  .reduce((acc, [source, target]) => {
    let sources = acc.get(target);

    if (!sources) {
      sources = new Set();
      acc.set(target, sources);
    }

    sources.add(source);
    return acc;
  }, new Map<number, Set<number>>());

const sum = updatesStr
  .split("\n")
  .map((pageNumbers) =>
    pageNumbers.split(",").map((pageNumbers) => Number.parseInt(pageNumbers)),
  )
  .reduce((acc, pageNumbers) => {
    if (
      pageNumbers.every((pageNumber, idx) => {
        const rule = rules.get(pageNumber);
        return (
          !rule ||
          pageNumbers
            .slice(idx + 1)
            .every((afterPageNumber) => !rule.has(afterPageNumber))
        );
      })
    )
      return acc + pageNumbers[Math.floor(pageNumbers.length / 2)];

    return acc;
  }, 0);

console.log(sum);

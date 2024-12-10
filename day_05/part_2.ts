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

function checkIsSorted(pageNumbers: number[]) {
  for (let idx = 0; idx < pageNumbers.length; idx++) {
    const pageNumber = pageNumbers[idx];
    const rule = rules.get(pageNumber);

    if (!rule) continue;

    const violation = pageNumbers
      .slice(idx + 1)
      .findIndex((afterPageNumber) => rule.has(afterPageNumber));

    if (violation === -1) continue;

    return {
      isSorted: false,
      violationIndices: [idx, violation + idx + 1],
    } as const;
  }

  return { isSorted: true, violationIndices: [] as number[] } as const;
}

const sum = updatesStr
  .split("\n")
  .map((pageNumbers) =>
    pageNumbers.split(",").map((pageNumbers) => Number.parseInt(pageNumbers)),
  )
  .reduce((acc, pageNumbers) => {
    let { isSorted, violationIndices } = checkIsSorted(pageNumbers);
    let [l, r] = violationIndices;

    if (isSorted) return acc;

    do {
      [pageNumbers[l], pageNumbers[r]] = [pageNumbers[r], pageNumbers[l]];
      ({ isSorted, violationIndices } = checkIsSorted(pageNumbers));
      [l, r] = violationIndices;
    } while (!isSorted);

    return acc + pageNumbers[Math.floor(pageNumbers.length / 2)];
  }, 0);

console.log(sum);

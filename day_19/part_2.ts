const [patterns, designs] = await (async () => {
  const [p, d] = (await Bun.file(`${import.meta.dir}/input.txt`).text()).split(
    "\n\n",
  );
  return [p.split(", "), d.split("\n")];
})();

// Caching is overpowered :]

function countDesignArrangements(
  design: string,
  cache = new Map<string, number>(),
): number {
  return patterns.reduce((acc, pattern) => {
    const hash = `${pattern}|${design}`;
    let count = cache.get(hash);

    if (count !== undefined) return acc + count;

    if (!design.startsWith(pattern)) {
      cache.set(hash, 0);
      return acc;
    }

    count =
      design.length === pattern.length
        ? 1
        : countDesignArrangements(design.slice(pattern.length), cache);

    cache.set(hash, count);
    return acc + count;
  }, 0);
}

const count = designs.reduce(
  (acc, design) => acc + countDesignArrangements(design),
  0,
);

console.log(count);

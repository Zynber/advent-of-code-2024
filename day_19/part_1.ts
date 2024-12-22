const [patterns, designs] = await (async () => {
  const [p, d] = (await Bun.file(`${import.meta.dir}/input.txt`).text()).split(
    "\n\n",
  );
  return [p.split(", "), d.split("\n")];
})();

// Caching is overpowered :]

function validateDesign(design: string, cache = new Set<string>()): boolean {
  return patterns.some((pattern) => {
    const hash = `${pattern}|${design}`;

    if (cache.has(hash)) return false;

    const ret =
      design.startsWith(pattern) &&
      (design.length === pattern.length ||
        validateDesign(design.slice(pattern.length), cache));

    if (ret) return true;

    cache.add(hash);
  });
}

const count = designs.reduce(
  (acc, design) => acc + Number(validateDesign(design)),
  0,
);

console.log(count);

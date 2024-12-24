function mix(val: number, secret: number) {
  return val ^ secret;
}

function prune(secret: number) {
  return secret & (2 ** 24 - 1);
}

const secretSequences = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((line) => {
    const secrets: number[] = [];
    let secret = Number.parseInt(line);

    for (let i = 0; i < 2000; i++) {
      secret = prune(mix(secret << 6, secret));
      secret = prune(mix(secret >> 5, secret));
      secret = prune(mix(secret << 11, secret));
      secrets.push(secret % 10);
    }

    return secrets;
  });

const result = secretSequences
  .reduce((acc, secrets) => {
    const changeSequence = secrets.reduce((acc, val, idx) => {
      if (!idx) return acc;

      acc.push(val - secrets[idx - 1]);
      return acc;
    }, [] as number[]);
    const map = new Map<string, number>();

    for (let i = 0; i < changeSequence.length - 3; i++) {
      const hash = JSON.stringify(changeSequence.slice(i, i + 4));

      if (map.has(hash)) continue;

      map.set(hash, secrets[i + 4]);
    }

    for (const [hash, profit] of map)
      acc.set(hash, (acc.get(hash) ?? 0) + profit);

    return acc;
  }, new Map<string, number>())
  .entries()
  .reduce(
    (acc, [sequence, profit]) => (profit > acc[1] ? [sequence, profit] : acc),
    ["", 0],
  );

console.log(result);

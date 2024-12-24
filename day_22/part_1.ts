function mix(val: number, secret: number) {
  return val ^ secret;
}

function prune(secret: number) {
  return secret & (2 ** 24 - 1);
}

const sum = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .split("\n")
  .map((line) => {
    let secret = Number.parseInt(line);

    for (let i = 0; i < 2000; i++) {
      secret = prune(mix(secret << 6, secret));
      secret = prune(mix(secret >> 5, secret));
      secret = prune(mix(secret << 11, secret));
    }

    return secret;
  })
  .reduce((acc, secret) => acc + secret, 0);

console.log(sum);

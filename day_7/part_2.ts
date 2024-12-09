const operators: ((a: number, b: number) => number)[] = [
  (a, b) => a + b,
  (a, b) => a * b,
  (a, b) => Number.parseInt(a.toString() + b.toString()), // Well I'm glad I did it this way
];

const result = (await Bun.file(`${import.meta.dir}/input.txt`).text())
  .matchAll(/(\d+): (\d+(?: \d+)+)/g)
  .map(
    (match) =>
      [
        Number.parseInt(match[1]),
        match[2].split(" ").map((el) => Number.parseInt(el)),
      ] as const,
  )
  .reduce((acc, [target, elements]) => {
    const operationCount = elements.length - 1;

    for (let i = 0; i < operators.length ** operationCount; i++) {
      const bitRep = i
        .toString(operators.length)
        .padStart(operationCount, "0")
        .split("")
        .map((bit) => Number.parseInt(bit));

      const testResult = bitRep.reduce(
        (acc, bit, idx) => operators[bit](acc, elements[idx + 1]),
        elements[0],
      );

      if (target === testResult) return acc + target;
    }

    return acc;
  }, 0);

console.log(result);

function AND(x: boolean, y: boolean) {
  return x && y;
}

function OR(x: boolean, y: boolean) {
  return x || y;
}

function XOR(x: boolean, y: boolean) {
  return (x && !y) || (!x && y);
}

function getGateFn(gate: string) {
  switch (gate) {
    case "AND":
      return AND;
    case "OR":
      return OR;
    case "XOR":
      return XOR;
    default:
      throw new Error();
  }
}

const [wires, gates] = await (async () => {
  const [wires, gates] = (
    await Bun.file(`${import.meta.dir}/input.txt`).text()
  ).split("\n\n");

  return [
    new Map(
      wires.split("\n").map((line) => {
        const [gate, value] = line.split(": ");
        return [gate, Boolean(Number.parseInt(value))];
      }),
    ),
    gates.matchAll(/(.+) (AND|OR|XOR) (.+) -> (.+)/g).reduce((acc, match) => {
      acc.set(match[4], {
        inputs: [match[1], match[3]],
        gateFn: getGateFn(match[2]),
      });
      return acc;
    }, new Map<
      string,
      { inputs: [string, string]; gateFn: (x: boolean, y: boolean) => boolean }
    >()),
  ];
})();

while (gates.size) {
  for (const [outputWire, gate] of gates) {
    const [x, y] = gate.inputs.map((input) => wires.get(input));

    if (x === undefined || y === undefined) continue;

    wires.set(outputWire, gate.gateFn(x, y));
    gates.delete(outputWire);
  }
}

console.log(
  wires
    .entries()
    .filter(([wire]) => wire.startsWith("z"))
    .toArray()
    .toSorted((a, b) => a[0].localeCompare(b[0]))
    .reduce((acc, [_, value], idx) => acc + Number(value) * 2 ** idx, 0),
);

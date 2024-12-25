type Gate = "AND" | "XOR" | "OR";

const GATES: { [key in Gate]: (x: boolean, y: boolean) => boolean } = {
  AND: (x, y) => x && y,
  XOR: (x, y) => (x && !y) || (!x && y),
  OR: (x, y) => x || y,
};

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
        inputs: [match[1], match[3]].toSorted() as [string, string],
        type: match[2] as Gate,
      });
      return acc;
    }, new Map<string, { inputs: [string, string]; type: Gate }>()),
  ];
})();

function generateInputGatesMap(
  gates: Map<string, { inputs: [string, string]; type: Gate }>,
) {
  return gates.entries().reduce((acc, [id, { inputs, type }]) => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const connectedGates = acc.get(input) ?? {};
      connectedGates[type] = {
        out: id,
        other: inputs[(i + 1) % inputs.length],
      };
      acc.set(input, connectedGates);
    }

    return acc;
  }, new Map<string, { [key in Gate]?: { out: string; other: string } }>());
}

function regenerateInputGatesMap(
  gates: Map<string, { inputs: [string, string]; type: Gate }>,
) {
  inputGatesMap = generateInputGatesMap(gates);
}

let inputGatesMap = generateInputGatesMap(gates);

const inputCount = wires
  .keys()
  .filter((wire) => wire[0] === "x")
  .toArray().length;

const invalidWires = new Set<string>();

function numToId(num: number, prefix = "") {
  return `${prefix}${num.toString().padStart(2, "0")}`;
}

function run(
  wires: Map<string, boolean>,
  gates: Map<
    string,
    {
      inputs: [string, string];
      type: Gate;
    }
  >,
) {
  while (gates.size) {
    for (const [outputWire, gate] of gates) {
      const [x, y] = gate.inputs.map((input) => wires.get(input));

      if (x === undefined || y === undefined) continue;

      wires.set(outputWire, GATES[gate.type](x, y));
      gates.delete(outputWire);
    }
  }
}

function testAdder(id: number) {
  const idStr = numToId(id);

  const getTestObjs = (testInput: number) => {
    const testGates = new Map(gates.entries());
    const testWires = new Map(wires.keys().map((key) => [key, false]));
    testWires.set(`x${idStr}`, Boolean((testInput >> 1) & 1));
    testWires.set(`y${idStr}`, Boolean(testInput & 1));
    return { testGates, testWires };
  };

  const getOutputs = (wires: Map<string, boolean>) => {
    const [mainBit, carryBit] = [idStr, numToId(id + 1)].map((num) =>
      wires.get(`z${num}`),
    );

    if (mainBit === undefined || carryBit === undefined) throw new Error();

    return { mainBit, carryBit };
  };

  {
    const { testGates, testWires } = getTestObjs(0b01);

    run(testWires, testGates);

    const { mainBit, carryBit } = getOutputs(testWires);

    if (!(mainBit && !carryBit)) {
      console.log(`Something wrong with ${idStr}`);
      return false;
    }
  }

  {
    const { testGates, testWires } = getTestObjs(0b11);

    run(testWires, testGates);

    const { mainBit, carryBit } = getOutputs(testWires);

    if (!(!mainBit && carryBit)) {
      console.log(`Something is wrong with ${idStr}`);
      return false;
    }
  }

  return true;
}

function swapGateOutputs(a: string, b: string, temporary: true): () => void;
function swapGateOutputs(a: string, b: string, reason: string): undefined;
function swapGateOutputs(
  a: string,
  b: string,
  reason: string | true,
): (() => void) | undefined {
  invalidWires.add(a).add(b);

  if (reason !== true) console.log(`Found ${a} (${reason}), should be ${b}`);

  const gateA = gates.get(a);
  const gateB = gates.get(b);

  if (!gateA || !gateB) throw new Error();

  gates.set(a, gateB);
  gates.set(b, gateA);
  regenerateInputGatesMap(gates);

  if (reason === true)
    return () => {
      gates.set(a, gateA);
      gates.set(b, gateB);
      regenerateInputGatesMap(gates);
    };
}

function validateOR(num: number, output: string) {
  const XOR = inputGatesMap.get(output)?.XOR;

  if (!XOR) return { value: false, reason: { type: "XOR" } } as const;

  const id = numToId(num + 1, "z");
  const value = XOR.out === id;
  return value
    ? ({ value, reason: null } as const)
    : ({
        value,
        reason: { type: "out", expected: id, found: XOR.out },
      } as const);
}

while (true) {
  let hadFailure = false;

  for (let i = 1; i < inputCount - 1; i++) {
    testLoop: while (!testAdder(i)) {
      hadFailure = true;

      const { XOR: xyXOR, AND: xyAND } =
        inputGatesMap.get(numToId(i, "x")) ?? {};
      const { AND: prevXyAND } = inputGatesMap.get(numToId(i - 1, "x")) ?? {};

      if (!xyXOR || !xyAND || !prevXyAND) throw new Error();

      const prevCOut = inputGatesMap.get(prevXyAND.out)?.OR?.out;

      if (!prevCOut) throw new Error();

      const { XOR: prevCXOR, AND: prevCAND } =
        inputGatesMap.get(prevCOut) ?? {};

      if (!prevCXOR || !prevCAND) throw new Error();

      if (prevCXOR.other !== xyXOR.out) {
        swapGateOutputs(xyXOR.out, prevCXOR.other, "incorrect x XOR y output");
        continue;
      }

      const mainOut = inputGatesMap.get(xyXOR.out)?.XOR?.out;
      const correctMainOut = numToId(i, "z");

      if (!mainOut) throw new Error();

      if (mainOut !== correctMainOut) {
        swapGateOutputs(mainOut, correctMainOut, "incorrect main output");
        continue;
      }

      const { OR: fromPrevCarryOR } = inputGatesMap.get(prevCAND.out) ?? {};
      const { OR: fromXyOR } = inputGatesMap.get(xyAND.out) ?? {};

      if (!fromPrevCarryOR && !fromXyOR)
        throw new Error("Uh oh, carry wire is completely disconnected");

      const fault = fromPrevCarryOR
        ? fromXyOR
          ? null
          : xyAND.out
        : prevCAND.out;
      const connected = fromPrevCarryOR ?? fromXyOR;

      if (!connected) throw new Error();

      if (fault) {
        if (!validateOR(i, connected.out))
          throw new Error(
            "Uh oh, one side is disconnected while other side could not connect to correct output",
          );

        swapGateOutputs(fault, connected.other, "not connected to carry OR");
        continue;
      }

      if (!(fromPrevCarryOR && fromXyOR)) throw new Error();

      if (fromPrevCarryOR.out !== fromXyOR.out) {
        const isFromPrevCarry = validateOR(i, fromPrevCarryOR.out).value;
        const isFromXy = validateOR(i, fromXyOR.out).value;

        if (isFromPrevCarry && !isFromXy)
          swapGateOutputs(
            xyAND.out,
            fromPrevCarryOR.other,
            "connected to incorrect carry wire",
          );
        else if (!isFromPrevCarry && isFromXy)
          swapGateOutputs(
            prevCAND.out,
            fromXyOR.other,
            "connected to incorrect carry wire",
          );
        else if (!isFromPrevCarry && !isFromXy)
          throw new Error(
            "Uh oh, both carry inputs connected to wrong carry wire",
          );
        else throw new Error("Should not have reached here");
      }

      const result = validateOR(i, fromXyOR.out);

      if (!result.value) {
        switch (result.reason.type) {
          case "out":
            swapGateOutputs(
              result.reason.found,
              result.reason.expected,
              "carry wire not connected to correct output",
            );
            break;
          case "XOR": {
            const inputs = gates.get(numToId(i + 1, "z"))?.inputs;

            if (!inputs) throw new Error();

            for (const input of inputs) {
              const undo = swapGateOutputs(fromXyOR.out, input, true);
              const adderResult = testAdder(i);

              if (adderResult) continue testLoop;

              undo();
            }

            throw new Error("Uh oh, neither swaps worked");
          }
        }
      }
    }
  }

  if (!hadFailure) {
    console.log("Everything is fixed!");
    break;
  }
}

console.log(invalidWires.values().toArray().toSorted().join(","));

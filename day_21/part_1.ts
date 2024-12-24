class Coords {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  sub(other: Coords) {
    return new Coords(this.x - other.x, this.y - other.y);
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

type NumericKeypadButton =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "0"
  | "A";

type DirectionalKeypadButton = "^" | "v" | "<" | ">" | "A";

type Decision = [string] | [string, string];

const [NUMERIC_KEYPAD, NUMERIC_KEYPAD_BY_COORDS] = (() => {
  const m = [
    ["A", new Coords(2, 0)],
    ["0", new Coords(1, 0)],
    ["1", new Coords(0, 1)],
    ["2", new Coords(1, 1)],
    ["3", new Coords(2, 1)],
    ["4", new Coords(0, 2)],
    ["5", new Coords(1, 2)],
    ["6", new Coords(2, 2)],
    ["7", new Coords(0, 3)],
    ["8", new Coords(1, 3)],
    ["9", new Coords(2, 3)],
  ] as const;

  return [
    new Map<NumericKeypadButton, Coords>(m),
    new Map<string, NumericKeypadButton>(m.map(([a, b]) => [b.toString(), a])),
  ];
})();

const [DIRECTIONAL_KEYPAD, DIRECTIONAL_KEYPAD_BY_COORDS] = (() => {
  const m = [
    ["A", new Coords(2, 1)],
    ["^", new Coords(1, 1)],
    ["<", new Coords(0, 0)],
    ["v", new Coords(1, 0)],
    [">", new Coords(2, 0)],
  ] as const;
  return [
    new Map<DirectionalKeypadButton, Coords>(m),
    new Map<string, DirectionalKeypadButton>(
      m.map(([a, b]) => [b.toString(), a]),
    ),
  ];
})();

const CODES = (await Bun.file(`${import.meta.dir}/input.txt`).text()).split(
  "\n",
);

function getSegment(move: Coords): Decision {
  const xDir = move.x > 0 ? ">" : "<";
  const yDir = move.y > 0 ? "^" : "v";

  const ret: [string, string] = [
    `${xDir.repeat(Math.abs(move.x))}${yDir.repeat(Math.abs(move.y))}A`,
    `${yDir.repeat(Math.abs(move.y))}${xDir.repeat(Math.abs(move.x))}A`,
  ];

  return ret[0] === ret[1] ? [ret[0]] : ret;
}

function computeDecisions(
  output: string,
  keypad: Map<string, Coords> = DIRECTIONAL_KEYPAD,
  keypadByCoords: Map<string, string> = DIRECTIONAL_KEYPAD_BY_COORDS,
) {
  const sequence: Decision[] = [];
  let currentCoords = keypad.get("A");

  if (!currentCoords) throw new Error();

  for (const nextKey of output) {
    const nextCoords = keypad.get(nextKey);

    if (!nextCoords) throw new Error();

    const move = nextCoords.sub(currentCoords);
    const segment = getSegment(move);

    if (segment.length !== 1) {
      if (
        !keypadByCoords.has(`(${currentCoords.x + move.x}, ${currentCoords.y})`)
      )
        segment.shift();
      else if (
        !keypadByCoords.has(`(${currentCoords.x}, ${currentCoords.y + move.y})`)
      )
        segment.pop();
    }

    currentCoords = nextCoords;

    if (segment.length === 1) {
      const last = sequence.at(-1);

      if (last && last.length === 1) {
        sequence[sequence.length - 1] = [`${last}${segment}`];
        continue;
      }
    }

    sequence.push(segment);
  }

  return sequence;
}

function quantizeDecisions(sequence: Decision[]) {
  const sequences: string[][] = [[]];
  let decisionCount = 0;

  for (const segment of sequence) {
    sequences[0].push(segment[0]);

    if (segment.length !== 1) decisionCount++;
  }

  decisionCount = 2 ** decisionCount;

  for (let decision = 1; decision < decisionCount; decision++) {
    let decisionIdx = 0;
    sequences[decision] = [];

    for (const segment of sequence) {
      sequences[decision].push(
        segment[segment.length === 1 ? 0 : (decision >> decisionIdx++) & 1],
      );
    }
  }

  return sequences.map((seq) => seq.join(""));
}

const complexitySum = CODES.reduce((acc, code) => {
  const seq_1 = quantizeDecisions(
    computeDecisions(code, NUMERIC_KEYPAD, NUMERIC_KEYPAD_BY_COORDS),
  );

  const seq_2 = seq_1.flatMap((seq) =>
    quantizeDecisions(computeDecisions(seq)),
  );

  const seq_3 = seq_2.flatMap((seq) =>
    quantizeDecisions(computeDecisions(seq)),
  );

  const length = seq_3.reduce(
    (acc, seq) => (seq.length < acc ? seq.length : acc),
    Number.POSITIVE_INFINITY,
  );

  console.log(`${code}:`, length);

  return acc + length * Number.parseInt(code.slice(0, 3));
}, 0);

console.log(complexitySum);

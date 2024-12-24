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

const ITER_COUNT = 25;

const CODES = (await Bun.file(`${import.meta.dir}/input.txt`).text()).split(
  "\n",
);

function getDecision(move: Coords): Decision {
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
  startKey = "A",
  keypad: Map<string, Coords> = DIRECTIONAL_KEYPAD,
  keypadByCoords: Map<string, string> = DIRECTIONAL_KEYPAD_BY_COORDS,
) {
  const sequence: Decision[] = [];
  let currentCoords = keypad.get(startKey);

  if (!currentCoords) throw new Error();

  for (const nextKey of output) {
    const nextCoords = keypad.get(nextKey);

    if (!nextCoords) throw new Error();

    const move = nextCoords.sub(currentCoords);
    const decision = getDecision(move);

    if (decision.length !== 1) {
      if (
        !keypadByCoords.has(`(${currentCoords.x + move.x}, ${currentCoords.y})`)
      )
        decision.shift();
      else if (
        !keypadByCoords.has(`(${currentCoords.x}, ${currentCoords.y + move.y})`)
      )
        decision.pop();
    }

    currentCoords = nextCoords;
    sequence.push(decision);
  }

  return sequence;
}

function findMinSequenceLength(
  decision: Decision,
  currentDepth = 0,
  cache = new Map<string, number>(),
): number {
  const hash = `${currentDepth}|${decision.join("/")}`;
  const isMaxDepth = currentDepth >= ITER_COUNT;
  let length = cache.get(hash);

  if (length) return length;

  length = isMaxDepth
    ? decision.reduce(
        (acc, option) => (option.length < acc ? option.length : acc),
        Number.POSITIVE_INFINITY,
      )
    : decision
        .map((option) => computeDecisions(option))
        .reduce(
          (acc, sequence) => {
            if (sequence.length < acc.min) {
              acc.value = [sequence];
              acc.min = sequence.length;
            } else if (sequence.length === acc.min) acc.value.push(sequence);

            return acc;
          },
          { value: [] as Decision[][], min: Number.POSITIVE_INFINITY },
        )
        .value.reduce((acc, sequence) => {
          const length = sequence
            .map((decision) =>
              findMinSequenceLength(decision, currentDepth + 1, cache),
            )
            .reduce((acc, length) => acc + length, 0);

          return length < acc ? length : acc;
        }, Number.POSITIVE_INFINITY);

  cache.set(hash, length);
  return length;
}

const complexitySum = CODES.reduce((acc, code) => {
  const sequence = computeDecisions(
    code,
    "A",
    NUMERIC_KEYPAD,
    NUMERIC_KEYPAD_BY_COORDS,
  );

  const length = sequence.reduce(
    (acc, decision) => acc + findMinSequenceLength(decision),
    0,
  );

  console.log(`${code}:`, length);

  return acc + length * Number.parseInt(code.slice(0, 3));
}, 0);

console.log(complexitySum);

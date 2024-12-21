type ComputerState = {
  ax: bigint;
  bx: bigint;
  cx: bigint;
  pointer: number;
  out: number[];
};

const match = (await Bun.file(`${import.meta.dir}/input.txt`).text()).match(
  /.+?(\d+)\n.+?(\d+)\n.+?(\d+)\n\n[^\d,]+?((?:\d,)+\d)/,
);

if (!match) throw new Error();

const PROGRAM = match[4].split(",").map((n) => Number.parseInt(n));

function parseCombo(operand: number, state: ComputerState) {
  switch (operand) {
    case 4:
      return state.ax;
    case 5:
      return state.bx;
    case 6:
      return state.cx;
    default:
      return BigInt(operand);
  }
}

const INSTRUCTIONS: ((operand: number, state: ComputerState) => void)[] = [
  (operand, state) => void (state.ax >>= parseCombo(operand, state)), //           adv (0)
  (operand, state) => void (state.bx ^= BigInt(operand)), //                       bxl (1)
  (operand, state) => void (state.bx = parseCombo(operand, state) & 0b111n), //    bst (2)
  (operand, state) =>
    void (state.pointer = state.ax ? operand - 2 : state.pointer), //              jnz (3)
  (_, state) => void (state.bx ^= state.cx), //                                    bxc (4)
  (operand, state) =>
    void state.out.push(Number(parseCombo(operand, state) & 0b111n)), //           out (5)
  (operand, state) => void (state.bx = state.ax >> parseCombo(operand, state)), // bdv (6)
  (operand, state) => void (state.cx = state.ax >> parseCombo(operand, state)), // cdv (7)
];

function getNewComputer(ax: bigint): ComputerState {
  return { ax, bx: 0n, cx: 0n, pointer: 0, out: [] };
}

function runComputerWithoutJnz(state: ComputerState) {
  let instruction = PROGRAM[state.pointer];

  do {
    INSTRUCTIONS[PROGRAM[state.pointer]](PROGRAM[state.pointer + 1], state);
    instruction = PROGRAM[(state.pointer += 2)];
  } while (instruction !== 3);

  return state.out;
}

// 00 | bst a: bx = last 3 bits of ax
// 02 | bxl 7: bx = bx ⊕ 0b111         ; flip bx, or 7 - bx
// 04 | cdv 5: cx = ax >> bx           ; shift by 7 - bx bits, then get last 3 bits
// 06 | adv 3: ax = ax >> 3
// 08 | bxc _: bx = bx ⊕ cx            ; can just consider last 3 bits because of print
// 10 | bxl 7: bx = bx ⊕ 0b111         ; flip bx again
// 12 | out 5: print last 3 bits of bx
// 14 | jnz 0: goto 0 if ax is not 0

// ax determines how many times the program outputs.
// Output has 16 elements, and a is bitshifted by 3 every iteration,
// so ax has 3 * 16 = 48 bits.
// bx is initialized with the last 3 bits of ax,
// cx is initialized with ax >> ~bx,
// so carried over values of previous iterations do not matter for bx and cx.
// After initialization, bx = last 3 bits of (~bx ⊕ cx).
// Therefore, for each number in the program in reverse order, find all
// possible three bits that can end up printing the number.
// Then, try appending 3 bits to the end and see if the next number can be
// printed.
// Repeat above until solution is found.

function recursiveSolve(
  ax: bigint,
  progress: number[],
  target: number[],
): bigint | false {
  const goal = target.at(-progress.length - 1);

  if (goal === undefined) throw new Error();

  for (let i = 0b000n; i <= 0b111n; i++) {
    const testAx = (ax << 3n) | i;
    const computer: ComputerState = getNewComputer(testAx);
    const out = runComputerWithoutJnz(computer);

    if (out[0] === goal) {
      if (progress.length === target.length - 1) return testAx;

      const ret = recursiveSolve(testAx, [goal, ...progress], target);

      if (ret !== false) return ret;
    }
  }

  return false;
}

console.log(recursiveSolve(0n, [], PROGRAM));

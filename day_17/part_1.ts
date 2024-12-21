const match = (await Bun.file(`${import.meta.dir}/input.txt`).text()).match(
  /.+?(\d+)\n.+?(\d+)\n.+?(\d+)\n\n[^\d,]+?((?:\d,)+\d)/,
);

if (!match) throw new Error();

let [a, b, c] = match.slice(1, 4).map((n) => Number.parseInt(n));
const program = match[4].split(",").map((n) => Number.parseInt(n));
let pointer = 0;
const out: number[] = [];

function parseCombo(operand: number) {
  switch (operand) {
    case 4:
      return a;
    case 5:
      return b;
    case 6:
      return c;
    default:
      return operand;
  }
}

const INSTRUCTIONS = Object.freeze([
  (operand: number) => void (a >>= parseCombo(operand)), // adv
  (operand: number) => void (b ^= operand), // bxl
  (operand: number) => void (b = parseCombo(operand) & 0b111), // bst
  (operand: number) => void (pointer = a ? operand - 2 : pointer), // jnz
  (_: number) => void (b ^= c), // bxc
  (operand: number) => void out.push(parseCombo(operand) & 0b111), // out
  (operand: number) => void (b = a >> parseCombo(operand)), // bdv
  (operand: number) => void (c = a >> parseCombo(operand)), // cdv
] as const);

do {
  INSTRUCTIONS[program[pointer]](program[pointer + 1]);
  pointer += 2;
} while (pointer < program.length);

console.log(out.join(","));

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
] as const;

const mapStr = await Bun.file(`${import.meta.dir}/input.txt`).text();
const map = mapStr.split("\n").map((row) => row.split(""));

const startIdx = mapStr.replaceAll("\n", "").indexOf("^");
const height = map.length;
const width = map[0].length;

let x = startIdx % width;
let y = Math.trunc(startIdx / width);
let dirIdx = 0;

outer: while (true) {
  const dir = DIRECTIONS[dirIdx++ % 4];

  while (map[y + dir.y]?.[x + dir.x] !== "#") {
    map[y][x] = "X";
    x += dir.x;
    y += dir.y;

    if (x < 0 || x >= width || y < 0 || y >= height) break outer;
  }
}

console.log(map.map((row) => row.join("")).join("\n"));
console.log("Count:", map.flat().filter((cell) => cell === "X").length);

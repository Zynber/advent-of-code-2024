const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
] as const;

const mapStr = await Bun.file(`${import.meta.dir}/input.txt`).text();
const map = mapStr.split("\n").map((row) => row.split(""));
const originalMap = structuredClone(map);

const startIdx = mapStr.replaceAll("\n", "").indexOf("^");
const height = map.length;
const width = map[0].length;
const startPos = { x: startIdx % width, y: Math.trunc(startIdx / width) };

function traverseMap(map: string[][], startPos: { x: number; y: number }) {
  let { x, y } = startPos;
  let dirIdx = 0;
  const turnRecords = new Set<string>();

  outer: while (true) {
    const dir = DIRECTIONS[dirIdx];

    while (map[y + dir.y]?.[x + dir.x] !== "#") {
      map[y][x] = "X";
      x += dir.x;
      y += dir.y;

      if (x < 0 || x >= width || y < 0 || y >= height) break outer;
    }

    const record = `(${x}, ${y}) from dir=${dirIdx}`;

    if (turnRecords.has(record)) return { reason: "loop" } as const;

    turnRecords.add(record);
    dirIdx = (dirIdx + 1) % 4;
  }

  return { reason: "oob" } as const;
}

traverseMap(map, startPos);

// Fisher Price's My First Brute-force Solver

let possibleObstacleCount = 0;

for (let i = 0; i < height; i++) {
  for (let j = 0; j < width; j++) {
    if (map[i][j] !== "X" || (i === startPos.y && j === startPos.x)) continue;

    const testMap = structuredClone(originalMap);
    testMap[i][j] = "#";

    const { reason } = traverseMap(testMap, startPos);

    if (reason === "loop") {
      possibleObstacleCount++;
    }
  }
}

console.log("Possible obstacle count:", possibleObstacleCount);

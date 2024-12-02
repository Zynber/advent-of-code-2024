const numTxt = await Bun.file(`${import.meta.dir}/input.txt`).text();

const safeCount = numTxt
  .split("\n")
  .map((report) => report.split(" ").map((level) => Number.parseInt(level)))
  .reduce((count, report) => {
    const isSafe = (() => {
      const diffs: number[] = [];

      for (let idx = 1; idx < report.length; idx++) {
        const prevDiff = diffs.at(diffs.length - 1);
        const currDiff = report[idx] - report[idx - 1];
        diffs.push(currDiff);

        if (!currDiff || Math.abs(currDiff) > 3) return false;

        if (prevDiff === undefined) continue;

        if (prevDiff > 0 !== currDiff > 0) return false;
      }

      return true;
    })();

    return isSafe ? count + 1 : count;
  }, 0);

console.log(safeCount);

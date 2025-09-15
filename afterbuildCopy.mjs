import path from "path";

import fsPromise from "node:fs/promises";
const { writeFile, readFile, stat } = fsPromise;

const main = async () => {
  await Promise.all(
    ["common.mjs", "setup.mjs"].map(async (file) => {
      const filePath = path.join(path.resolve(), file);
      try {
        await stat(filePath);
        const dest = path.join(path.resolve(), ".next", "standalone", file);
        await writeFile(dest, await readFile(filePath));
      } catch (error) {
        console.log(`not exists: ${filePath}`);
      }
    })
  );
};

main();

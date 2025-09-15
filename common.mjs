import path from "path";
import fsPromise from "node:fs/promises";
const { writeFile, readFile, stat, mkdir, readdir } = fsPromise;

export const copyDir = async (src, dest) => {
  try {
    await mkdir(dest, { recursive: true });
    const files = await readdir(src);
    for (const file of files) {
      const current = await stat(path.join(src, file));
      if (current.isDirectory()) {
        await copyDir(path.join(src, file), path.join(dest, file));
      } else {
        await writeFile(
          path.join(dest, file),
          await readFile(path.join(src, file))
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const replaceEnv = async (src, envs) => {
  try {
    const files = await readdir(src);
    for (const file of files) {
      const current = await stat(path.join(src, file));
      if (current.isDirectory()) {
        await replaceEnv(path.join(src, file), envs);
      } else if (
        file.endsWith(".html") ||
        file.endsWith(".rsc") ||
        file.endsWith(".xml.body")
      ) {
        let readString = await readFile(path.join(src, file), "utf-8");
        envs.forEach(({ key, value }) => {
          if (readString.includes(key)) {
            readString = readString.replace(new RegExp(key, "g"), value);
          }
        });
        await writeFile(path.join(src, file), readString);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

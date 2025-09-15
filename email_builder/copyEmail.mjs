import path from "path";
import fsPromise from "node:fs/promises";
const { readdir, readFile, writeFile } = fsPromise;
import child_process from "child_process";

const main = async () => {
  const targetFile = path.join(
    path.resolve(),
    "..",
    "src",
    "helpers",
    "emailFormat.ts",
  );

  const files = await readdir(path.join(path.resolve(), "build_production"));

  let writeString = "";
  const readResults = await Promise.all(
    files.map(async (file) => {
      console.log(file);
      if (file !== "images") {
        let convertFunction = `export const ${file.split(".")[0]} = ({\n`;
        const sourceFile = path.join(path.resolve(), "build_production", file);
        const data = await readFile(sourceFile, "utf-8");
        const columns = [];
        const emptyColumns = [];

        const getColumns = async (column, index) => {
          if (index !== 0) {
            const columnName = column.split("}")[0];
            if (!/^[a-zA-Z0-9]+$/g.test(columnName)) {
              await Promise.all(column.split("${").map(getColumns));
              const [first, second] = column.split(" ");
              if (second === "?") {
                emptyColumns.push(first);
              }
            } else {
              if (columnName && columns.indexOf(columnName) === -1) {
                convertFunction += `  ${columnName},\n`;
                columns.push(columnName);
              }
            }
          }
        };
        await Promise.all(data.split("${").map(getColumns));
        convertFunction += `}: {\n`;
        columns.forEach((column) => {
          convertFunction += `  ${column}`;
          if (emptyColumns.includes(column)) {
            convertFunction += `?`;
          }
          convertFunction += `: string;\n`;
        });
        convertFunction += `}) => \`\n`;
        convertFunction += data;
        convertFunction += `\n\`;`;
        console.log(`${file} complete`);
        return convertFunction;
      }
    }),
  );

  readResults.forEach((result) => {
    if (result) {
      writeString += result;
    }
  });

  await writeFile(targetFile, writeString);

  await child_process.execSync(`cd.. && eslint src/helpers --fix`);
};
main();

import path from "path";

import fsPromise from "node:fs/promises";
import { replaceEnv } from "./common.mjs";
const { unlink, writeFile, readFile, stat, mkdir } = fsPromise;

const deleteFile = async (pathString) => {
  try {
    const isExist = await stat(pathString);
    if (isExist) {
      await unlink(pathString);
    }
  } catch (error) {
    console.log(`not exists: ${pathString}`);
  }
};

const createClientEnv = async (basicPath, client) => {
  try {
    await stat(path.join(basicPath, "public"));
  } catch (_) {
    await mkdir(path.join(basicPath, "public"));
  }

  const clientEnv = path.join(basicPath, "public", "__ENV.js");
  await deleteFile(clientEnv);

  let clientData = "";
  client.forEach(({ key, value }) => {
    clientData += `window.${key} = "${value}";\n`;
  });

  await writeFile(clientEnv, clientData);
};

const main = async () => {
  const mainEnv = path.join(path.resolve(), ".config_env");
  try {
    await stat(mainEnv);
    const data = await readFile(mainEnv, "utf-8");

    const client = [];
    const server = [];

    let currentKey = "";
    let currentValue = [];
    let isReadingMultiline = false;

    data.split("\n").forEach((line) => {
      const trimedLine = line.trim();
      if (trimedLine !== "" && !trimedLine.startsWith("#")) {
        // PEM 키 시작 확인
        if (trimedLine.includes("-----BEGIN")) {
          isReadingMultiline = true;
          const keyValue = trimedLine.split("=");
          currentKey = keyValue[0];
          currentValue = [keyValue[1].replace(/^'/, "")]; // 시작 따옴표 제거
          return;
        }

        // PEM 키 끝 확인
        if (trimedLine.includes("-----END")) {
          isReadingMultiline = false;
          currentValue.push(trimedLine.replace(/'$/, "")); // 끝 따옴표 제거

          const value = currentValue.join("\n");
          if (currentKey.startsWith("CLIENT")) {
            client.push({ key: currentKey, value });
          }
          server.push({ key: currentKey, value });

          currentKey = "";
          currentValue = [];
          return;
        }

        // PEM 키 내용 처리
        if (isReadingMultiline) {
          currentValue.push(trimedLine);
          return;
        }

        // 일반 환경변수 처리
        if (!isReadingMultiline) {
          const splitIndex = trimedLine.indexOf("=");
          let [key, value] = [
            trimedLine.slice(0, splitIndex),
            trimedLine.slice(splitIndex + 1),
          ];

          if (value.endsWith("\r")) {
            value = value.slice(0, -1);
          }

          if (key.startsWith("CLIENT")) {
            client.push({ key, value });
          }
          server.push({ key, value });
        }
      }
    });

    if (client.length > 0) {
      await createClientEnv(path.resolve(), client);
      try {
        const serverjs = path.join(path.resolve(), "server.js");
        await stat(serverjs);
        const staticPath = path.join(path.resolve(), ".next", "server");
        replaceEnv(staticPath, client);
      } catch (_) {}
    }

    if (server.length > 0) {
      await deleteFile(path.join(path.resolve(), ".env"));
      await makeServerEnv(path.resolve(), server);
      try {
        const basicPath = path.join(path.resolve());

        const serverjs = path.join(basicPath, "server.js");
        await stat(serverjs);
        const serverEnv = path.join(basicPath, "env.js");
        await deleteFile(serverEnv);

        let serverData = "";
        server.forEach(({ key, value }) => {
          serverData += `process.env.${key} = "${value}";\n`;
        });

        await writeFile(serverEnv, serverData);

        const data = await readFile(serverjs, "utf-8");
        if (data.startsWith("const path")) {
          const newData = `require('./env.js')\n${data}`;
          await writeFile(serverjs, newData);
        }
      } catch (_) {}
    }
  } catch (_) {}
};

const makeServerEnv = async (basicPath, server) => {
  const serverEnv = path.join(basicPath, ".env");
  await deleteFile(serverEnv);

  let serverData = "";
  server.forEach(({ key, value }) => {
    // PEM 키인 경우
    if (value.includes("-----BEGIN")) {
      serverData += `${key}='${value}'\n`;
    } else {
      serverData += `${key}=${value}\n`;
    }
  });

  await writeFile(serverEnv, serverData);
};

main();

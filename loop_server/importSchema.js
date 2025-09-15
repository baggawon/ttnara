const child_process = require("child_process");
const path = require("path");
const fs = require("node:fs/promises");

const main = async () => {
  const env = await fs.readFile(path.join(__dirname, ".env"), "utf-8");
  let databaseUrl = "";
  env.split("\n").forEach((line) => {
    if (line.startsWith("DATABASE_URL=")) {
      databaseUrl = line.split("DATABASE_URL=")[1];
    }
  });
  const outputDir = path.join(__dirname, "src", "helpers", "tables");
  let command = `sea-orm-cli generate entity -u ${databaseUrl} -s ${databaseUrl.includes("schema") ? databaseUrl.split("schema=")[1].split("&")[0] : "public"} -o ${outputDir} --with-serde both --expanded-format`;
  [
    "settings",
    "user",
    "profile",
    "login_history",
    "message_inbox",
    "message_history",
    "validate",
    "topic",
    "thread",
    "thread_vote",
    "category",
    "thread_image",
    "comment",
    "comment_vote",
    "general_setting",
    "level_setting",
    "user_setting",
    "thread_setting",
    "security_setting",
    "point_setting",
    "chat_setting",
    "chat_notice",
    "dev_notice",
    "banner",
    "tether",
    "tether_category",
    "tether_proposal",
    "tether_rate",
    "trade_rank",
    "_PenaltyUsers",
    "_BlacklistedUsers",
  ].forEach((table, index) => {
    if (index === 0) command += ` --ignore-tables `;
    command += `${table},`;
  });
  command = command.slice(0, -1);
  await child_process.execSync(command);
};

main();

const child_process = require("child_process");
const path = require("path");
const fs = require("node:fs/promises");

// Mirrors loop_server/importSchema.js — pulls only the chat-related tables into
// sea-orm entities. All non-chat tables remain owned by the Next.js Prisma layer.
const main = async () => {
  const env = await fs.readFile(path.join(__dirname, ".env"), "utf-8");
  let databaseUrl = "";
  env.split("\n").forEach((line) => {
    if (line.startsWith("DATABASE_URL=")) {
      databaseUrl = line.split("DATABASE_URL=")[1].trim();
    }
  });

  const schema = databaseUrl.includes("schema=")
    ? databaseUrl.split("schema=")[1].split("&")[0]
    : "public";

  const outputDir = path.join(__dirname, "src", "helpers", "tables");

  // Tables we DO want generated (everything else is ignored).
  const wanted = [
    "chat_message",
    "chat_muted_user",
    "chat_setting",
    "chat_topic",
    "chat_notice",
    "chat_fixed_message",
    "chat_banned_word",
    "chat_report",
    "_PenaltyUsers",
    "_ChatBannedUsers",
    "profile",
  ];

  // sea-orm-cli only supports --ignore-tables, not an allow-list, so we list
  // the unwanted tables explicitly. Update this if the schema grows.
  const ignored = [
    "settings",
    "user",
    "login_history",
    "common",
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
    "dev_notice",
    "banner",
    "tether",
    "tether_category",
    "tether_proposal",
    "tether_rate",
    "trade_rank",
    "kyc",
    "alarm",
    "leaderboard_entry",
    "point_history",
    "push_history",
    "_BlacklistedUsers",
    "_prisma_migrations",
  ].filter((t) => !wanted.includes(t));

  const command =
    `sea-orm-cli generate entity -u "${databaseUrl}" -s ${schema} ` +
    `-o "${outputDir}" --with-serde both --expanded-format ` +
    `--ignore-tables ${ignored.join(",")}`;

  console.log(command);
  child_process.execSync(command, { stdio: "inherit" });
};

main();

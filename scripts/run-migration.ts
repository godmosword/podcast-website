/**
 * 以 @neondatabase/serverless 執行 migration（不需本機 psql）。
 * 用法：DATABASE_URL=... tsx scripts/run-migration.ts 002_zone_wishes_category_message.sql
 * 或：npm run migrate -- 002_zone_wishes_category_message.sql
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const migrationArg = process.argv[2] ?? "002_zone_wishes_category_message.sql";
const migrationPath = resolve(
  process.cwd(),
  "scripts/migrations",
  migrationArg.endsWith(".sql") ? migrationArg : `${migrationArg}.sql`,
);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error(
      "錯誤：未設定 DATABASE_URL。請在 .env.local 加入 Neon 連線字串，或：\n" +
        "  DATABASE_URL=postgresql://... npm run migrate",
    );
    process.exit(1);
  }

  const sqlText = readFileSync(migrationPath, "utf8");
  // 去掉註解行，保留可執行 SQL
  const statements = sqlText
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);

  if (statements.length === 0) {
    console.error(`錯誤：${migrationPath} 無可執行語句`);
    process.exit(1);
  }

  const sql = neon(url);
  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log(`✓ 已執行 ${migrationPath}（${statements.length} 句）`);
}

main().catch((err: unknown) => {
  console.error("migration 失敗：", err instanceof Error ? err.message : err);
  process.exit(1);
});

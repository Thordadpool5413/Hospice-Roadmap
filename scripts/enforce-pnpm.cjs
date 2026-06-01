const fs = require("node:fs");
const path = require("node:path");

for (const file of ["package-lock.json", "yarn.lock"]) {
  try {
    fs.rmSync(path.join(process.cwd(), file), { force: true });
  } catch {
    // Ignore lockfile cleanup errors; the pnpm guard is the important check.
  }
}

const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}

import app from "./app";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"];
if (!rawPort) {
  logger.fatal({ missingEnv: "PORT" }, "Required environment variable PORT is not set — exiting");
  process.exit(1);
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  logger.fatal({ rawPort }, "Invalid PORT value — exiting");
  process.exit(1);
}

if (!process.env["OPENAI_API_KEY"]) {
  logger.warn("OPENAI_API_KEY is not set — voice and TTS features will be unavailable");
}

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

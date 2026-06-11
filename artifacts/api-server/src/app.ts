import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { logger } from "./lib/logger.js";
import router from "./routes";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware.js";

const app: Express = express();

// Required for correct req.ip behind Replit's shared reverse proxy
// (rate limiter, request logging, etc. all depend on this).
app.set("trust proxy", 1);

app.use(pinoHttp({ logger }));

// Clerk proxy must be mounted before body parsers (streams raw bytes)
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({
  origin: true,
  credentials: false,
  allowedHeaders: ["Content-Type", "x_client_id", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hosts for which a fallback to the default publishable key is expected and
// should NOT be warned about: local development and Replit-managed domains.
function isRecognizedHost(host: string): boolean {
  const bare = (host.split(":")[0] ?? "").toLowerCase();
  if (!bare) return true;
  if (bare === "localhost" || bare === "127.0.0.1" || bare === "0.0.0.0") {
    return true;
  }
  if (
    bare.endsWith(".replit.dev") ||
    bare.endsWith(".replit.app") ||
    bare.endsWith(".repl.co") ||
    bare.endsWith(".replit.com")
  ) {
    return true;
  }
  const prodDomains = (process.env.REPLIT_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return prodDomains.includes(bare);
}

// Resolve publishable key from incoming request host so the same server
// can serve multiple Clerk custom domains. Falls back to CLERK_PUBLISHABLE_KEY
// when the host doesn't map to a custom domain. A silent fallback for an
// unrecognized host usually signals an auth misconfiguration, so make it
// visible in the logs.
app.use(
  clerkMiddleware((req) => {
    const host = getClerkProxyHost(req) ?? "";
    const fallback = process.env.CLERK_PUBLISHABLE_KEY;
    const publishableKey = publishableKeyFromHost(host, fallback);

    if (publishableKey === fallback && host && !isRecognizedHost(host)) {
      req.log.warn(
        `Clerk: unrecognized host ${host}, falling back to default publishable key`,
      );
    }

    return { publishableKey };
  }),
);

app.use("/api", router);

export default app;

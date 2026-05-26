import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import router from "./routes";

const app: Express = express();

// Required for correct req.ip behind Replit's shared reverse proxy
// (rate limiter, request logging, etc. all depend on this).
app.set("trust proxy", 1);

app.use(pinoHttp({ logger }));

app.use(cors({
  origin: true,
  credentials: false,
  allowedHeaders: ["Content-Type", "x_client_id"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

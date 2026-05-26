import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import router from "./routes";

const app: Express = express();

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

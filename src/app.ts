import express, { type Express } from "express";
import router from "./routes/index.js";
import session from "express-session";
import cors from "cors";
import {
  sessionOptions,
  verifySession,
} from "./middleware/session.middleware.js";
import config from "./config/config.js";

const app: Express = express();
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  }),
);
app.set("trust proxy", 1);
app.use(express.json());
app.use(session(sessionOptions));
app.use("/api", verifySession, router);
export default app;

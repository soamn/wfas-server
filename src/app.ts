import express, { type Express } from "express";
import router from "./routes/index.js";
import session from "express-session";
import cors from "cors";
import {
  sessionOptions,
  verifySession,
} from "./middleware/session.middleware.js";

const app: Express = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(session(sessionOptions));
app.use("/api", verifySession, router);
export default app;

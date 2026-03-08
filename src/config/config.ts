import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  DISCORD_TOKEN: string;
  SLACK_CLIENT_ID: string;
  BACKEND_URL: string;
  FRONTEND_URL: string;
  SLACK_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ENGINE_INTERNAL_SECRET: string;
  ENCRYPTION_KEY: string;
  ENGINE_URL: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID!,
  BACKEND_URL: process.env.BACKEND_URL!,
  FRONTEND_URL: "http://localhost:3000",
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  ENGINE_INTERNAL_SECRET: process.env.ENGINE_INTERNAL_SECRET!,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
  ENGINE_URL: process.env.ENGINE_URL!,
};

export default config;

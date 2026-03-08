import { Router, type Request, type Response } from "express";
import {
  createCredential,
  deleteCredential,
  provideCredential,
  verifyCredentail,
} from "./credential.controller.js";
import {
  ProviderEnum,
  type CredentialType,
} from "../../validators/credential.schema.js";
import { UserModel } from "../user/user.model.js";
import { checkSession } from "../../validators/validator.js";
import { getSlackData, SlackProvider } from "../../services/slack.service.js";
import config from "../../config/config.js";
import {
  GoogleSheetsProvider,
  SheetData,
} from "../../services/googlesheets.service.js";
import { TelegramProvider } from "../../services/telegram.service.js";

const credentialRouter: Router = Router();

credentialRouter.post("/verify", verifyCredentail);
credentialRouter.post("/provide", provideCredential);
credentialRouter.post("/create", createCredential);
credentialRouter.delete("/delete", deleteCredential);

credentialRouter.post("/telegram/webhook", TelegramProvider.handleWebhook);
credentialRouter.post("/slack/webhook", SlackProvider.handleWebhook);

const cache = new Map();
credentialRouter.get("/slack/channels", async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const email = sessionData.user.email;
    const cacheKey = `${email}:slack`;
    const cachedData = cache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
      return res.json(cachedData.data);
    }
    const userCredentials = await UserModel.getCredentialByname(
      ProviderEnum.Slack,
      sessionData.user.email,
    );
    if (!userCredentials) {
      return res.status(404).json({ error: "Slack credentials not found" });
    }
    const token = userCredentials.credential.key;
    const [channels, users] = await Promise.all([
      getSlackData.channels(token),
      getSlackData.users(token),
    ]);
    const data = [...channels, ...users];
    cache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(data);
  } catch (error) {
    console.error("Workspace Data Route Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

credentialRouter.get(
  "/slack/oauth/callback",
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    try {
      const decodedState = JSON.parse(
        Buffer.from(state as string, "base64").toString(),
      );
      const userEmail = decodedState.email;
      const origin = decodedState.origin;

      const credentialPayload: CredentialType = {
        name: ProviderEnum.Slack,
        credential: {
          key: String(code),
          workflow_id: decodedState.workflow_id,
        },
      };
      await SlackProvider.create(credentialPayload, userEmail);
      if (origin === "profile" || !decodedState.workflow_id) {
        return res.redirect(`${config.FRONTEND_URL}/profile`);
      }
      res.redirect(
        `${config.FRONTEND_URL}/workflow/${decodedState.workflow_id}`,
      );
    } catch (error) {
      console.error("OAuth Callback Error:", error);
      res.redirect(`${config.FRONTEND_URL}/error/`);
    }
  },
);

credentialRouter.get(
  "/google/callback",
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    try {
      const decodedState = JSON.parse(
        Buffer.from(state as string, "base64").toString(),
      );
      const { email, returnUrl } = decodedState;

      if (!code) throw new Error("No code provided");
      const credentialPayload: CredentialType = {
        name: ProviderEnum.GoogleSheets,
        credential: {
          key: String(code),
        },
      };

      await GoogleSheetsProvider.create(credentialPayload, email);
      res.redirect(returnUrl);
    } catch (error) {
      res.redirect(`${config.FRONTEND_URL}/error`);
    }
  },
);
credentialRouter.get(
  "/google/sheets/:id/headers",
  async (req: Request, res: Response) => {
    try {
      const sessionData = checkSession(req.user);
      const { id } = req.params;
      const { sheetName } = req.query; // e.g. ?sheetName=Sheet1

      const headers = await SheetData.getHeaders(
        sessionData.user.email,
        id as string,
        sheetName as string,
      );

      res.json(headers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch headers" });
    }
  },
);
credentialRouter.get(
  "/google/sheets/:id/tabs",
  async (req: Request, res: Response) => {
    try {
      const sessionData = checkSession(req.user);
      const { id } = req.params;

      const tabs = await SheetData.listSheetNames(
        sessionData.user.email,
        id as string,
      );
      res.json(tabs); // Returns ["Sheet1", "Marketing", "Archive"]
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tabs" });
    }
  },
);

credentialRouter.get("/google/sheets", async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const email = sessionData.user.email;
    const cacheKey = `${email}:sheets`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
      return res.json(cachedData.sheetsData);
    }
    const userCredentials = await UserModel.getCredentialByname(
      ProviderEnum.GoogleSheets,
      email,
    );
    if (!userCredentials) {
      return res.status(404).json({ error: "Credentials not found" });
    }
    const sheetsData = await SheetData.listSpreadsheets(email);

    cache.set(cacheKey, { sheetsData, timestamp: Date.now() });
    res.json(sheetsData);
  } catch (error) {
    console.error("Workspace Data Route Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
export default credentialRouter;

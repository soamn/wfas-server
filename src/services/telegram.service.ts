import config from "../config/config.js";
import { AppError } from "../errors/AppError.js";
import {
  addCredential,
  deleteCredential,
} from "../modules/user/user.service.js";
import type { Request, Response } from "express";
import {
  ProviderEnum,
  type CredentialType,
  type ProviderService,
} from "../validators/credential.schema.js";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { UserModel } from "../modules/user/user.model.js";
import {
  executeWorkflowService,
  getWorkflowService,
} from "../modules/workflow/workflow.service.js";
import {
  WorkflowBaseSchema,
  WorkflowSchema,
} from "../validators/workflow.schema.js";
import { WorkflowModel } from "../modules/workflow/workflow.model.js";
import type { Workflow } from "../types/workflow.types.js";
import { decrypt } from "../lib/protect.js";

export const TelegramProvider: ProviderService = {
  async verify(credential: CredentialType) {
    const apiUrl = `https://api.telegram.org/bot${credential.credential.key}/getMe`;
    const response = await fetch(apiUrl);
    return await response.json();
  },

  async create(credential: CredentialType, email: User["email"]) {
    try {
      const token = credential.credential.key;

      const secret = email.replace(/[^a-zA-Z0-9_-]/g, "_");

      const webhookResponse = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `${config.BACKEND_URL}/api/credential/telegram/webhook`,
            secret_token: secret,
            drop_pending_updates: true,
          }),
        },
      );

      const webhookResult = await webhookResponse.json();
      if (!webhookResult.ok) throw new AppError("Webhook setup failed", 400);

      const telegramCreds: CredentialType = {
        name: ProviderEnum.Telegram,
        credential: { key: token, chat_id: null, user_id: null, secret },
      };

      await addCredential(telegramCreds, email);
      return { message: "Webhook configured!" };
    } catch (error) {
      console.error("Telegram Create Error:", error);
      throw error;
    }
  },

  async handleWebhook(req: Request, res: Response) {
    const secretToken = (req.headers["x-telegram-bot-api-secret-token"] ||
      req.headers["X-Telegram-Bot-Api-Secret-Token"]) as string;
    const update = req.body;
    res.sendStatus(200);

    if (update.message?.from?.is_bot) {
      console.log("🤖 Ignoring message from bot");
      return;
    }
    if (!secretToken || !update.message || update.message.from?.is_bot) return;

    try {
      const messageText = update.message.text?.trim();
      const chatId = update.message.chat.id;
      const isSetupCommand =
        messageText === "/setup" || messageText === "/start";

      const credentialRecord = await prisma.credential.findFirst({
        where: {
          name: ProviderEnum.Telegram,
          credential: { path: ["secret"], equals: secretToken },
        },
        include: { user: true },
      });

      if (!credentialRecord) return;

      const rawCreds =
        credentialRecord.credential as CredentialType["credential"];
      const decryptedKey = decrypt(rawCreds.key);

      const safeNotify = async (text: string) => {
        if (!decryptedKey) return;
        try {
          await fetch(
            `https://api.telegram.org/bot${decryptedKey}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "Markdown",
              }),
            },
          );
        } catch (e) {}
      };

      if (isSetupCommand) {
        await UserModel.updateCredential(
          {
            name: ProviderEnum.Telegram,
            credential: {
              ...rawCreds,
              chat_id: chatId,
              user_id: update.message.from?.id,
            },
          },
          credentialRecord.user.email,
        );
        await safeNotify(
          "✅ **Telegram Linked!**\nYou can now trigger workflows or receive messages.",
        );
        return;
      }

      const parsed = WorkflowBaseSchema.shape.id.safeParse(messageText);
      if (parsed.success) {
        if (!rawCreds.chat_id) {
          await UserModel.updateCredential(
            {
              name: ProviderEnum.Telegram,
              credential: {
                ...rawCreds,
                chat_id: chatId,
                user_id: update.message.from?.id,
              },
            },
            credentialRecord.user.email,
          );
        }
        await safeNotify("Execution Started");
        executeWorkflowService(parsed.data, credentialRecord.userId).catch(
          (e) => console.error("Engine Error", e),
        );
        return;
      }
    } catch (error) {
      console.error("🔴 Telegram Webhook Logic Error:", error);
    }
  },

  async provide(name, uid: User["id"]) {
    const credentials = await UserModel.getCredentialByid(name, uid);
    if (!credentials) throw new AppError("Internal Error", 500);
    return credentials;
  },

  async delete(credentialName, email) {
    deleteCredential(credentialName, email);
  },
};

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
import { UserModel } from "../modules/user/user.model.js";
import { executeWorkflowService } from "../modules/workflow/workflow.service.js";
import { WorkflowBaseSchema } from "../validators/workflow.schema.js";
import { prisma } from "../lib/prisma.js";

export const SlackProvider: ProviderService = {
  async verify(credential: CredentialType) {
    const scopes = [
      "channels:history",
      "chat:write",
      "chat:write.public",
      "groups:read",
      "im:history",
      "im:read",
      "im:write",
      "channels:read",
      "users:read",
    ].join(",");
    const stateObj = {
      email: credential.credential.email,
      workflow_id: credential.credential.workflow_id,
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64");

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${config.SLACK_CLIENT_ID}&redirect_uri=${config.BACKEND_URL}/api/credential/slack/oauth/callback&scope=${scopes}&state=${state}`;
    return {
      ok: true,
      authUrl: authUrl,
    };
  },

  async create(credential: CredentialType, email: User["email"]) {
    const code = credential.credential.key;
    if (!code) throw new AppError("No code provided from Slack", 400);

    const params = new URLSearchParams();
    params.append("client_id", config.SLACK_CLIENT_ID);
    params.append("client_secret", config.SLACK_CLIENT_SECRET);
    params.append("code", String(code));
    params.append(
      "redirect_uri",
      `${config.BACKEND_URL}/api/credential/slack/oauth/callback`,
    );

    try {
      const response = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });

      const data = await response.json();
      if (!data.ok) throw new AppError(`Slack Error: ${data.error}`, 400);

      const credentialMetadata = {
        key: data.access_token,
        teamName: data.team.name,
        botUserId: data.bot_user_id,
        workflow_id: credential.credential.workflow_id,
      };

      await addCredential(
        {
          name: ProviderEnum.Slack,
          credential: credentialMetadata,
        },
        email,
      );

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  async handleWebhook(req: Request, res: Response) {
    if (req.body.type === "url_verification") {
      return res.json({ challenge: req.body.challenge });
    }

    res.sendStatus(200);

    const event = req.body.event || req.body;
    const messageText = event.text || "";
    const botId = event.bot_id || event.from?.is_bot;
    if (botId) return;
    const parsed = WorkflowBaseSchema.shape.id.safeParse(messageText);

    if (parsed.success) {
      try {
        const workflow = await prisma.workflow.findUnique({
          where: { id: parsed.data },
          select: { id: true, userId: true },
        });
        if (workflow) {
          executeWorkflowService(workflow.id, workflow.userId).catch((e) =>
            console.error("🔴 Engine Trigger Failed:", e.message),
          );
        }
        return;
      } catch (error) {
        console.error("Error processing workflow trigger:", error);
      }
    }
  },
  async provide(name, uid: User["id"]) {
    const credentials = await UserModel.getCredentialByid(name, uid);
    if (!credentials) {
      throw new AppError("Internal Error", 500);
    }
    return credentials;
  },
  async delete(credentialName, email) {
    deleteCredential(credentialName, email);
  },
};

export const getSlackData = {
  async channels(token: string) {
    const res = await fetch(
      "https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();

    if (!data.ok) {
      console.error("Slack Channels Error:", data.error);
      return [];
    }

    return data.channels.map((c: any) => ({
      label: `# ${c.name}`,
      value: c.id,
    }));
  },

  async users(token: string) {
    const res = await fetch("https://slack.com/api/users.list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.ok) {
      console.error("Slack Users Error:", data.error);
      return [];
    }

    return data.members
      .filter((m: any) => !m.is_bot && !m.deleted)
      .map((m: any) => ({
        label: `@ ${m.real_name || m.name}`,
        value: m.id,
      }));
  },
};

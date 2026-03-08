import type { User } from "@prisma/client";
import type { Request, Response } from "express";
import * as z from "zod";

export enum ProviderEnum {
  Discord = "Discord",
  Slack = "Slack",
  Telegram = "Telegram",
  GoogleSheets = "GoogleSheets",
  OpenRouter = "OpenRouter",
}

export interface ProviderService {
  verify(credential: CredentialType): Promise<any>;
  create(credential: CredentialType, email: User["email"]): Promise<any>;
  handleWebhook(req: Request, res: Response): Promise<any>;
  provide(name: ProviderEnum, uid: User["id"]): Promise<any>;
  delete(credential: CredentialType["name"], email: User["email"]): Promise<any>;
}

export const CredentialSchema = z.object({
  name: z.enum(ProviderEnum),
  credential: z
    .object({
      key: z.string().min(1, "key is required"),
    })
    .loose(),
});

export type CredentialType = z.infer<typeof CredentialSchema>;

import type { User } from "@prisma/client";
import { AppError } from "../../errors/AppError.js";
import { TelegramProvider } from "../../services/telegram.service.js";
import {
  ProviderEnum,
  type CredentialType,
  type ProviderService,
} from "../../validators/credential.schema.js";
import { DiscordProvider } from "../../services/discord.service.js";
import { SlackProvider } from "../../services/slack.service.js";
import { GoogleSheetsProvider } from "../../services/googlesheets.service.js";
import { OpenRouterProvider } from "../../services/openrouter.service.js";

export const providerRegistry: Record<ProviderEnum, ProviderService> = {
  [ProviderEnum.Telegram]: TelegramProvider,
  [ProviderEnum.Slack]: SlackProvider,
  [ProviderEnum.Discord]: DiscordProvider,
  [ProviderEnum.GoogleSheets]: GoogleSheetsProvider,
  [ProviderEnum.OpenRouter]: OpenRouterProvider,
};

export const verifyCredentialService = async (credential: CredentialType) => {
  const provider = providerRegistry[credential.name];
  if (!provider) {
    throw new AppError(
      `Unsupported provider: ${credential.name}`,
      404,
      "PROVIDER_NOT_FOUND",
    );
  }

  return await provider.verify(credential);
};

export const createCredentialService = async (
  credential: CredentialType,
  email: User["email"],
) => {
  const provider = providerRegistry[credential.name];
  if (!provider) {
    throw new AppError(
      `Unsupported provider: ${credential.name}`,
      404,
      "PROVIDER_NOT_FOUND",
    );
  }

  return await provider.create(credential, email);
};
export const deleteCredentialService = async (
  credentialName: CredentialType["name"],
  email: User["email"],
) => {
  const provider = providerRegistry[credentialName];
  if (!provider) {
    throw new AppError(
      `Unsupported provider: ${credentialName}`,
      404,
      "PROVIDER_NOT_FOUND",
    );
  }

  return await provider.delete(credentialName, email);
};

export const provideCredentialService = async (
  providerName: ProviderEnum,
  uid: User["id"],
) => {
  const provider = providerRegistry[providerName];
  if (!provider) {
    throw new AppError(
      `Unsupported provider: ${providerName}`,
      404,
      "PROVIDER_NOT_FOUND",
    );
  }
  return await provider.provide(providerName, uid);
};

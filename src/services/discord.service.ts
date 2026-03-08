import config from "../config/config.js";
import { AppError } from "../errors/AppError.js";
import { UserModel } from "../modules/user/user.model.js";
import {
  addCredential,
  deleteCredential,
} from "../modules/user/user.service.js";
import {
  ProviderEnum,
  type CredentialType,
  type ProviderService,
} from "../validators/credential.schema.js";
import type { User } from "@prisma/client";

export const DiscordProvider: ProviderService = {
  async verify() {},

  async create(credential: CredentialType, email: User["email"]) {
    if (credential.name === ProviderEnum.Discord) {
      const { channelId } = credential.credential;

      const discordResponse = await fetch(
        `https://discord.com/api/v10/channels/${channelId}`,
        {
          headers: {
            Authorization: `Bot ${config.DISCORD_TOKEN}`,
          },
        },
      );

      if (!discordResponse.ok) {
        throw new AppError("Invalid Channel ID or Bot lacks permission", 400);
      }

      const channelData = await discordResponse.json();

      const discordCreds: CredentialType = {
        name: ProviderEnum.Discord,
        credential: {
          key: channelData.id,
          channelId: channelData.id,
          guildId: channelData.guild_id,
        },
      };

      return await addCredential(discordCreds, email);
    }
  },
  async delete(credentialName, email) {
    deleteCredential(credentialName, email);
  },

  async handleWebhook() {},
  async provide(name, uid: User["id"]) {
    const credentials = await UserModel.getCredentialByid(name, uid);
    if (!credentials) {
      throw new AppError("Internal Error", 500);
    }
    return credentials;
  },
};

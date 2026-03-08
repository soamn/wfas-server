import { AppError } from "../errors/AppError.js";
import { UserModel } from "../modules/user/user.model.js";
import {
  addCredential,
  deleteCredential,
} from "../modules/user/user.service.js";
import {
  ProviderEnum,
  type ProviderService,
} from "../validators/credential.schema.js";
import type { CredentialType } from "../validators/credential.schema.js";
import type { User } from "@prisma/client";

export const OpenRouterProvider: ProviderService = {
  async verify(credential: CredentialType) {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${credential.credential.key}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AppError(
        data?.error?.message || "Invalid OpenRouter API Key",
        401,
      );
    }

    return {
      ok: true,
      metadata: {
        label: data.data?.label,
        limit: data.data?.limit,
      },
    };
  },
  async create(credential: CredentialType, email: User["email"]) {
    const verification = await this.verify(credential);
    await addCredential(
      {
        name: ProviderEnum.OpenRouter,
        credential: {
          key: credential.credential.key,
        },
      },
      email,
    );

    return {
      success: true,
      metadata: verification.metadata,
    };
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
  async handleWebhook() {},
};

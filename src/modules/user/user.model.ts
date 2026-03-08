import type { Credential, User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { JsonObject } from "@prisma/client/runtime/client";
import type {
  CredentialType,
  ProviderEnum,
} from "../../validators/credential.schema.js";
import { decrypt } from "../../lib/protect.js";

export const UserModel = {
  //user
  findUserById: async (id: number) => {
    const user = await prisma.user.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        credentials: true,
      },
    });
    return user;
  },
  findUserByemail: async (email: string): Promise<User | null> => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch {
      return null;
    }
  },
  create: async ({
    name,
    email,
    password,
    isActive,
  }: {
    name: string;
    email: string;
    password: string;
    isActive: boolean;
  }) => {
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        isActive,
      },
    });
    const user = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
    };
    return user;
  },
  update: async (user: User) => {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: user,
    });

    return updatedUser;
  },

  getCredentialByname: async (
    name: string,
    email: User["email"],
  ): Promise<CredentialType | null> => {
    const credential = await prisma.credential.findFirst({
      where: {
        name: name,
        user: { email: email },
      },
      select: { name: true, credential: true },
    });

    if (!credential) return null;
    const data = credential as CredentialType;
    if (data.credential.key) {
      data.credential.key = decrypt(data.credential.key);
    }
    return {
      name: credential.name as ProviderEnum,
      credential: data.credential,
    };
  },

  getCredentialByid: async (
    name: string,
    id: User["id"],
  ): Promise<CredentialType | null> => {
    const credential = await prisma.credential.findUnique({
      where: {
        name: name,
        user: { id },
      },
      select: { name: true, credential: true },
    });

    if (!credential) return null;
    const data = credential.credential as CredentialType["credential"];
    data.key = decrypt(data.key);

    return {
      name: credential.name as ProviderEnum,
      credential: data,
    };
  },
  createCredential: async (
    credential: CredentialType,
    user: User,
  ): Promise<Credential | null> => {
    try {
      const credentials = await prisma.credential.create({
        data: {
          name: credential.name,
          credential: credential.credential as JsonObject,
          userId: user.id,
        },
      });
      return credentials;
    } catch (error: any) {
      return error;
    }
  },

  updateCredential: async (
    credentials: CredentialType,
    email: User["email"],
  ): Promise<Credential | null> => {
    try {
      const updatedCredentials = await prisma.credential.update({
        where: { name: credentials.name, user: { email: email } },
        data: {
          name: credentials.name,
          credential: credentials.credential as JsonObject,
        },
      });
      return updatedCredentials;
    } catch (error: any) {
      return error;
    }
  },
  deleteCredential: async (
    credentials: CredentialType,
    email: User["email"],
  ): Promise<Credential | null> => {
    const deletedCredential = await prisma.credential.delete({
      where: { name: credentials.name, user: { email } },
    });
    return deletedCredential;
  },

  deleteSession: async (sid: string): Promise<void> => {
    await prisma.session.deleteMany({
      where: { sid },
    });
  },
};

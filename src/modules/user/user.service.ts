import { UserModel } from "./user.model.js";
import bcrypt from "bcrypt";
import { AppError } from "../../errors/AppError.js";
import type { Provider } from "../../types/provider.types.js";
import type { User } from "@prisma/client";
import type { CredentialType } from "../../validators/credential.schema.js";
import { encrypt } from "../../lib/protect.js";

export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  const existing = await UserModel.findUserByemail(email);
  if (existing)
    throw new AppError("email already registered", 400, "ALREADY_EXIST");
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = {
    name,
    email,
    password: hashedPassword,
    isActive: true,
  };
  return await UserModel.create(user);
};

export const login = async (email: string, password: string) => {
  const existing = await UserModel.findUserByemail(email);
  if (existing === null)
    throw new AppError(
      "The entered Credentials are incorrect",
      401,
      "INVALID_CREDENTIALS",
    );
  const isCorrect = await bcrypt.compare(password, existing.password);
  if (!isCorrect) {
    throw new AppError(
      "The entered Credentials are incorrect",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  return existing;
};

export const updatePassword = async (
  email: string,
  oldPassword: string,
  newPassword: string,
) => {
  const existing = await UserModel.findUserByemail(email);
  if (existing === null) throw new AppError("User not found", 404, "NOT_FOUND");
  const isCorrect = await bcrypt.compare(oldPassword, existing.password);
  if (!isCorrect) {
    throw new AppError(
      "The entered Credentials are incorrect",
      401,
      "INVALID_CREDENTIALS",
    );
  }
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  const updatedUser = await UserModel.update({
    ...existing,
    password: hashedPassword,
  });

  return updatedUser;
};

export const addCredential = async (
  credential: CredentialType,
  email: User["email"],
) => {
  const existingUser = await UserModel.findUserByemail(email);
  if (!existingUser) throw new Error("user not found");
  const credentialData = { ...credential.credential } as any;
  if (credentialData.key) {
    credentialData.key = encrypt(credentialData.key);
  }
  const securedCredential = {
    ...credential,
    credential: credentialData,
  };
  const existingCredential = await UserModel.getCredentialByname(
    credential.name,
    email,
  );
  if (!existingCredential) {
    return await UserModel.createCredential(securedCredential, existingUser);
  } else {
    return await UserModel.updateCredential(securedCredential, email);
  }
};
export const deleteCredential = async (
  name: Provider["name"],
  email: User["email"],
) => {
  const existingCredential = await UserModel.getCredentialByname(name, email);
  const existingUser = await UserModel.findUserByemail(email);
  if (existingUser === null) throw new Error("user not found");
  if (existingCredential === null) {
    throw new AppError("Resource not found", 404, "NOT_FOUND");
  }
  const creds = await UserModel.deleteCredential(existingCredential, email);
  return creds;
};

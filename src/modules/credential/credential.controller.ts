import { checkSession, ValidateBody } from "../../validators/validator.js";
import { CredentialSchema } from "../../validators/credential.schema.js";
import {
  createCredentialService,
  deleteCredentialService,
  provideCredentialService,
  verifyCredentialService,
} from "./credential.service.js";
import { errorHandler } from "../../middleware/error.middleware.js";
import type { Request, Response } from "express";
import config from "../../config/config.js";

export const verifyCredentail = async (req: Request, res: Response) => {
  try {
    checkSession(req.user);
    const parsedData = ValidateBody(CredentialSchema, req.body);
    const { name, credential } = parsedData;
    const response = await verifyCredentialService({ name, credential });
    return res.status(200).json({ response });
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const createCredential = async (req: Request, res: Response) => {
  try {
    const sessiondata = checkSession(req.user);
    const parsedData = ValidateBody(CredentialSchema, req.body);
    const { name, credential } = parsedData;
    const response = await createCredentialService(
      { name, credential },
      sessiondata.user.email,
    );
    return res.status(200).json({ response });
  } catch (error: any) {
    errorHandler(error, res);
  }
};
export const deleteCredential = async (req: Request, res: Response) => {
  try {
    const sessiondata = checkSession(req.user);
    const { name } = req.body;
    const response = await deleteCredentialService(
      name,
      sessiondata.user.email,
    );
    return res.status(200).json({ response });
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const provideCredential = async (req: Request, res: Response) => {
  try {
    const engineSecret = req.headers["x-engine-secret"];

    if (!engineSecret || engineSecret !== config.ENGINE_INTERNAL_SECRET) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Only the Engine can access this." });
    }
    const { provider, conn_id } = req.body;
    const response = await provideCredentialService(provider, conn_id);
    return res.status(200).json({ response });
  } catch (error: any) {
    errorHandler(error, res);
  }
};

import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import type { CookieOptions, SessionOptions } from "express-session";
import { prisma } from "../lib/prisma.js";
import type { NextFunction, Request, Response } from "express";
import { UserModel } from "../modules/user/user.model.js";
import config from "../config/config.js";

const cookieOptions: CookieOptions = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  sameSite: "lax",
  secure: config.IS_PRODUCTION,
  httpOnly: true,
  path: "/",
};
const prismaSessionStore: PrismaSessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 30 * 60 * 1000,
  dbRecordIdIsSessionId: true,
});

export const verifySession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (req.session.uid) {
    const user = await UserModel.findUserById(req.session.uid);
    if (user) {
      req.user = { id: user.id, name: user.name, email: user.email };
      req.credentials = user.credentials.map((item) => {
        const { id, userId, credential, ...itemRest } = item;
        const { key, ...safeData } = credential as any;
        return {
          ...itemRest,
          credential: safeData,
        };
      });
    }
  }

  next();
};

export const sessionOptions: SessionOptions = {
  secret: config.ENCRYPTION_KEY,
  cookie: cookieOptions,
  store: prismaSessionStore,
  resave: false,
  saveUninitialized: false,
};

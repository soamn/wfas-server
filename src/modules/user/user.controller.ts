import type { Request, Response } from "express";
import { register, login, updatePassword } from "./user.service.js";

import { errorHandler } from "../../middleware/error.middleware.js";
import { updateUserSchema, userSchema } from "../../validators/user.schema.js";
import { checkSession, ValidateBody } from "../../validators/validator.js";
import config from "../../config/config.js";

export const registerUser = async (req: Request, res: Response) => {
  try {
    if (req.user) {
      return res.status(409).json({
        message: "Already logged in",
      });
    }
    ValidateBody(userSchema, req.body);
    const { name, email, password } = req.body;
    const newUser = await register(name, email, password);
    req.session.uid = newUser.id;
    req.session.save();
    return res.status(200).json(newUser);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    if (req.user) {
      return res.status(409).json({
        message: "Already logged in",
      });
    }
    ValidateBody(userSchema, req.body);
    const { email, password } = req.body;
    const user = await login(email, password);
    req.session.uid = user.id;
    req.session.save();
    return res.status(200).json(user);
  } catch (error: any) {
    errorHandler(error, res);
  }
};
export const logoutUser = async (req: Request, res: Response) => {
  try {
    if (req.session) {
      req.session.destroy((err) => {
        const clearOptions = {
          path: "/",
          httpOnly: true,
          sameSite: "lax" as const,
          secure: config.IS_PRODUCTION,
        };

        if (err) {
          res.clearCookie("connect.sid", clearOptions);
          return res.status(500).json({ error: "Could not destroy session" });
        }

        res.clearCookie("connect.sid", clearOptions);
        return res.json({ message: "Logged out successfully" });
      });
    } else {
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: config.IS_PRODUCTION,
      });
      return res.json({ message: "Cookie cleared" });
    }
  } catch (error: any) {
    if (typeof errorHandler === "function") {
      errorHandler(error, res);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
export const updateUserPassword = async (req: Request, res: Response) => {
  try {
    checkSession(req.user);
    ValidateBody(updateUserSchema, req.body);
    const { email, oldPassword, newPassword } = req.body;
    const updatedUser = await updatePassword(email, oldPassword, newPassword);
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

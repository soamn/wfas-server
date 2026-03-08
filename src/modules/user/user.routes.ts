import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  updateUserPassword,
} from "./user.controller.js";

const userRouter: Router = Router();

userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.post("/register", registerUser);
userRouter.put("/update-password", updateUserPassword);
export default userRouter;

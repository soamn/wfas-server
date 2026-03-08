import z from "zod";

export const userSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
  password: z.string(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
  oldPassword: z.string(),
  newPassword: z.string(),
});

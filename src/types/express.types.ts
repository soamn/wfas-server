import type { Credential, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, "name" | "email" | "id">;
      credentials?: Array<
        Omit<Credential, "credential" | "id" | "userId"> & {
          credential: Record<string, any>;
        }
      >;
    }
  }
}

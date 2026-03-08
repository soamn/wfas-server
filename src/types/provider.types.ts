import type z from "zod";
import type { CredentialSchema } from "../validators/credential.schema.js";
export type Provider = z.infer<typeof CredentialSchema>;

import type z from "zod";
import type { nodeLiteSchema, nodeSchema } from "../validators/node.schema.js";

export type NODE = z.infer<typeof nodeSchema>;
export type NODELITE = z.infer<typeof nodeLiteSchema>;

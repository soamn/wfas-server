import type z from "zod";
import type { WorkflowSchema } from "../validators/workflow.schema.js";

export type Workflow = z.infer<typeof WorkflowSchema>;

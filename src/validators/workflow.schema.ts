import { WorkflowState } from "@prisma/client";
import z from "zod";
import { nodeSchema } from "./node.schema.js";
import { Dag, CheckNodeBounds } from "./validator.js";
const ENTRY_TYPES = ["TRIGGER", "WEBHOOK"];
export const WorkflowBaseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  state: z.enum(WorkflowState),
  nodes: z.array(nodeSchema),
});
export const WorkflowSchema = WorkflowBaseSchema.transform((data) => ({
  ...data,
  nodes: [...data.nodes].sort((a, b) => a.index - b.index),
})).superRefine((data, ctx) => {
  const nodes = data.nodes;
  const hasTrigger = nodes.some((n) => ENTRY_TYPES.includes(n.type));
  if (!hasTrigger) {
    ctx.addIssue({
      code: "custom",
      message:
        "Workflow must contain at least one trigger node (TRIGGER or WEBHOOK).",
      path: ["nodes"],
    });
    return;
  }
  if (nodes.length < 2) {
    ctx.addIssue({
      code: "custom",
      message:
        "Workflow is incomplete. Connect at least one action node to your trigger.",
      path: ["nodes"],
    });
    return;
  }
  const isSequential = nodes.every((node, i) => node.index === i);
  if (!isSequential) {
    ctx.addIssue({
      code: "custom",
      message: "Node indexes must be unique and sequential (0, 1, 2...)",
      path: ["nodes"],
    });
    return;
  }

  try {
    CheckNodeBounds(nodes as any);
    if (!Dag(nodes as any)) {
      ctx.addIssue({
        code: "custom",
        message: "Circular dependency detected.",
        path: ["nodes"],
      });
    }
  } catch (error: any) {
    ctx.addIssue({
      code: "custom",
      message: error.message || "Invalid graph structure",
      path: ["nodes"],
    });
  }
});

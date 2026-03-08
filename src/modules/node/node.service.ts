import type { Node, User } from "@prisma/client";
import type { NODELITE } from "../../types/node.types.js";
import type { Workflow } from "../../types/workflow.types.js";
import { WorkflowModel } from "../workflow/workflow.model.js";
import { NodeModel } from "./node.model.js";
import { AppError } from "../../errors/AppError.js";

export const getNodeService = async (nodeId: Node["id"]) => {
  const node = await NodeModel.findById(nodeId);
  if (!node) {
    throw new AppError("Node not found", 404, "NOT_FOUND");
  }
  return node;
};

export const updateNodeService = async (
  node: NODELITE,
  worflowID: Workflow["id"],
  userId: User["id"],
) => {
  const existingWorkflow = await WorkflowModel.findById(worflowID, userId);
  const existingNode = await NodeModel.findById(node.id);
  if (!existingWorkflow || !existingNode) {
    throw new AppError(
      "node|workflow does not exist for the user ",
      400,
      "BAD_REQUEST",
    );
  }
  return await NodeModel.update(node);
};

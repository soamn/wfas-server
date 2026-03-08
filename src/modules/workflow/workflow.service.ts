import type { User } from "@prisma/client";
import type { Workflow } from "../../types/workflow.types.js";
import { WorkflowModel } from "./workflow.model.js";
import { AppError } from "../../errors/AppError.js";
import { NodeModel } from "../node/node.model.js";
import config from "../../config/config.js";

export const createWorkflowService = async (
  workflow: Workflow,
  userId: User["id"],
) => {
  const existingWf = await WorkflowModel.findById(workflow.id, userId);
  if (existingWf) {
    throw new AppError(
      "workflow with this ID already exists",
      403,
      "ALREADY_EXISTS",
    );
  }
  const nodeIds = workflow.nodes.map((node) => node.id);
  const existingNodes = await NodeModel.findmany(nodeIds);
  if (existingNodes.length > 0) {
    throw new AppError("Invalid Data", 400, "INVALID_DATA");
  }
  const createdWorkflowID = await WorkflowModel.create(workflow, userId);

  return await WorkflowModel.getById(createdWorkflowID, userId);
};

export const updateWorflowService = async (
  workflow: Workflow,
  userId: User["id"],
) => {
  const existingWf = await WorkflowModel.findById(workflow.id, userId);
  if (!existingWf) throw new AppError("workflow not found", 404, "NOT_FOUND");
  await notifyEngineSync(workflow.id, "REFRESH");
  return await WorkflowModel.update(workflow);
};

export const getWorkflowService = async (
  id: Workflow["id"],
  userId: User["id"],
) => {
  return await WorkflowModel.getById(id, userId);
};

export const deleteWorkflowService = async (
  id: Workflow["id"],
  userId: User["id"],
) => {
  await notifyEngineSync(id, "STOP");
  return await WorkflowModel.delete(id, userId);
};

export const executeWorkflowService = async (
  workflowId: Workflow["id"],
  id: number,
) => {
  const existingWorkflow = await WorkflowModel.getById(workflowId, id);
  if (!existingWorkflow) {
    throw new AppError("Not Found", 404, "NOT_FOUND");
  }

  await WorkflowModel.changeState(workflowId, "Running", id);
  const url = `${config.ENGINE_URL}/api/workflow/`;
  try {
    const engineResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workflowId: workflowId, conn_id: id }),
    });

    if (!engineResponse.ok) {
      await WorkflowModel.changeState(workflowId, "Draft", id);
      throw new AppError("Engine failed to start workflow", 500);
    }
  } catch (error: any) {
    throw new AppError(String(error), 500, "INTERNAL ERROR");
  }
  return;
};

export const getAllWorkflowService = async (userId: User["id"]) => {
  return await WorkflowModel.getAll(userId);
};

const notifyEngineSync = async (
  workflowId: string,
  action: "STOP" | "REFRESH",
) => {
  try {
    const url = `${config.ENGINE_URL}/api/workflow/sync`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, action }),
    });
  } catch (error) {}
};

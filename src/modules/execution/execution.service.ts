import type { User } from "@prisma/client";
import { AppError } from "../../errors/AppError.js";
import { ExecutionModel } from "./execution.model.js";

export const getExecutionsByIdService = async (executionId: number) => {
  return ExecutionModel.getById(executionId);
};
export const getExecutionsService = async (email: User["email"]) => {
  return ExecutionModel.getAll(email);
};

export const getExecutionsByWorkflowIdService = async (
  workflowId: string,
  email: User["email"],
) => {
  const existingExecution = await ExecutionModel.getByWorkflowId(
    workflowId,
    email,
  );
  if (!existingExecution) {
    throw new AppError("execution not found", 404, "NOT_FOUND");
  }
  return existingExecution;
};

export const deleteExecutionByIdService = async (executionId: number,email:User["email"]) => {
  const existingExecution = await ExecutionModel.getById(executionId);
  if (!existingExecution) {
    throw new AppError("Execution not found", 404, "NOT_FOUND");
  }
  return ExecutionModel.deleteById(executionId,email);
};

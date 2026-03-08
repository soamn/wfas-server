import type { Request, Response } from "express";
import { checkSession } from "../../validators/validator.js";
import { errorHandler } from "../../middleware/error.middleware.js";
import { AppError } from "../../errors/AppError.js";
import {
  getExecutionsByWorkflowIdService,
  getExecutionsByIdService,
  getExecutionsService,
  deleteExecutionByIdService,
} from "./execution.service.js";
import { WorkflowBaseSchema } from "../../validators/workflow.schema.js";
import z from "zod";

export const getWorkflowExecutions = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const { workflowId } = req.params;
    const idValidator = WorkflowBaseSchema.shape.id;
    const parsed = idValidator.safeParse(workflowId);
    if (!parsed.success) {
      throw new AppError("Request Invalid", 400, "INVALID_REQUEST");
    }
    const executionLogs = await getExecutionsByWorkflowIdService(
      parsed.data,
      sessionData.user.email,
    );

    return res.send(executionLogs);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const getWorkflowExecution = async (req: Request, res: Response) => {
  try {
    checkSession(req.user);
    const { executionId } = req.params;

    const executionLogs = await getExecutionsByIdService(Number(executionId));

    return res.send(executionLogs);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const getExecutions = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const executionLogs = await getExecutionsService(sessionData.user.email);
    return res.send(executionLogs);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const deleteExecutions = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const { executionId } = req.params;
    const executionIdValidator = z.preprocess(
      (a) => parseInt(z.string().parse(a), 10),
      z.number().positive(),
    );

    const parsed = executionIdValidator.safeParse(executionId);
    if (!parsed.success) {
      throw new AppError("Request Invalid", 400, "INVALID_REQUEST");
    }

    await deleteExecutionByIdService(parsed.data, sessionData.user.email);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    errorHandler(error, res);
  }
};

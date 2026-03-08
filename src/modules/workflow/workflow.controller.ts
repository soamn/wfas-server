import type { Request, Response } from "express";
import { checkSession, ValidateBody } from "../../validators/validator.js";
import {
  WorkflowBaseSchema,
  WorkflowSchema,
} from "../../validators/workflow.schema.js";
import { errorHandler } from "../../middleware/error.middleware.js";
import {
  createWorkflowService,
  deleteWorkflowService,
  executeWorkflowService,
  getAllWorkflowService,
  getWorkflowService,
  updateWorflowService,
} from "./workflow.service.js";
import { AppError } from "../../errors/AppError.js";

export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const idValidator = WorkflowBaseSchema.shape.id;
    const { id } = req.params;

    const parsed = idValidator.safeParse(id);
    if (!parsed.success) {
      throw new AppError("Request Invalid", 400, "INVALID_REQUEST");
    }

    const workflow = await getWorkflowService(parsed.data, sessionData.user.id);

    return res.send(workflow);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const createWorkflow = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const parsedData = ValidateBody(WorkflowSchema, req.body);
    const { id, name, description, state, nodes } = parsedData;

    const workflow = { id, name, description, state, nodes };

    const createdWorkflow = await createWorkflowService(
      workflow,
      sessionData.user.id,
    );

    return res.status(201).json(createdWorkflow);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const paramid = req.params.id;
    const idValidator = WorkflowBaseSchema.shape.id;
    const parsed = idValidator.safeParse(paramid);
    if (!parsed.success) {
      throw new AppError("Request Invalid", 400, "INVALID_REQUEST");
    }
    const parsedData = ValidateBody(WorkflowSchema, req.body);
    const { id, name, description, state, nodes } = parsedData;
    const workflow = { id, name, description, state, nodes };

    const updatedWorkflow = await updateWorflowService(
      workflow,
      sessionData.user.id,
    );
    return res.status(200).json(updatedWorkflow);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const deleteWorkflow = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const { id } = req.params;

    const idValidator = WorkflowBaseSchema.shape.id;
    const parsed = idValidator.safeParse(id);
    if (!parsed.success) {
      throw new AppError("Request Invalid", 400, "INVALID_REQUEST");
    }
    const deletedWorkflow = await deleteWorkflowService(
      parsed.data,
      sessionData.user.id,
    );

    return res.status(200).json(deletedWorkflow);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const executeWorkflow = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const { id } = req.params;
    const idValidator = WorkflowBaseSchema.shape.id;
    const parsed = idValidator.safeParse(id);

    if (!parsed.success) {
      throw new AppError("Request Invalid", 400, "INVALID_REQUEST");
    }
    await executeWorkflowService(parsed.data, sessionData.user.id);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const getAllWorkflow = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const workflows = await getAllWorkflowService(sessionData.user.id);
    return res.send(workflows);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

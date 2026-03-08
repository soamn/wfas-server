import type { Request, Response } from "express";
import { checkSession, ValidateBody } from "../../validators/validator.js";
import { errorHandler } from "../../middleware/error.middleware.js";
import {
  BaseNodeSchema,
  nodeLiteSchema,
} from "../../validators/node.schema.js";
import { AppError } from "../../errors/AppError.js";
import { updateNodeService, getNodeService } from "./node.service.js";
import { WorkflowBaseSchema } from "../../validators/workflow.schema.js";

export const getNode = async (req: Request, res: Response) => {
  try {
    checkSession(req.user);
    const nodeId = req.params.id;
    const validator = BaseNodeSchema.id;
    const parsed = validator.safeParse(nodeId);

    if (!parsed.success) {
      throw new AppError("Bad Request", 400, "BAD_REQUEST");
    }
    ValidateBody(nodeLiteSchema, req.body);

    const updatedNode = await getNodeService(parsed.data);
    return res.status(200).json(updatedNode);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

export const updateNode = async (req: Request, res: Response) => {
  try {
    const sessionData = checkSession(req.user);
    const worflowId = req.params.nodeid;
    const validator = WorkflowBaseSchema.shape.id;
    const parsed = validator.safeParse(worflowId);
    if (!parsed.success) {
      throw new AppError("Bad Request", 400, "BAD_REQUEST");
    }
    const worflowID = parsed.data;

    ValidateBody(nodeLiteSchema, req.body);
    const { id, name, type, config } = req.body;
    const node = { id, name, type, config };
    const updatedNode = await updateNodeService(
      node,
      worflowID,
      sessionData.user.id,
    );
    return res.status(200).json(updatedNode);
  } catch (error: any) {
    errorHandler(error, res);
  }
};

import { Router } from "express";
import {
  deleteExecutions,
  getExecutions,
  getWorkflowExecution,
  getWorkflowExecutions,
} from "./execution.controller.js";

const executionRouter: Router = Router();

executionRouter.get("/", getExecutions);
executionRouter.get("/workflow/:workflowId", getWorkflowExecutions);
executionRouter.get("/:executionId", getWorkflowExecution);
executionRouter.delete("/:executionId", deleteExecutions);

export default executionRouter;

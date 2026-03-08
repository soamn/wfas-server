import { Router } from "express";
import {
  createWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getAllWorkflow,
  getWorkflow,
  updateWorkflow,
} from "./workflow.controller.js";

const workflowRouter: Router = Router();

workflowRouter.get("/", getAllWorkflow);
workflowRouter.get("/:id", getWorkflow);
workflowRouter.post("/create", createWorkflow);
workflowRouter.put("/update/:id", updateWorkflow);
workflowRouter.delete("/:id", deleteWorkflow);
workflowRouter.get("/execute/:id", executeWorkflow);
export default workflowRouter;

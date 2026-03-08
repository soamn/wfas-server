import { Router } from "express";
import { getNode, updateNode } from "./node.controller.js";

const nodeRouter: Router = Router();

nodeRouter.get("/:id",getNode)
nodeRouter.put("/update/:nodeid", updateNode);

export default nodeRouter;

import { Router, type Request, type Response } from "express";
import userRouter from "../modules/user/user.routes.js";
import workflowRouter from "../modules/workflow/workflow.routes.js";
import nodeRouter from "../modules/node/node.routes.js";
import credentialRouter from "../modules/credential/credential.routes.js";
import executionRouter from "../modules/execution/execution.routes.js";

const router: Router = Router();

router.get("/auth", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(200).json({ authenticated: false });
  }
  return res.json({
    authenticated: true,
    user: {
      ...req.user,
      credentials: req.credentials,
    },
  });
});

router.use("/user", userRouter);
router.use("/credential", credentialRouter);
router.use("/workflow", workflowRouter);
router.use("/node", nodeRouter);
router.use("/execution", executionRouter);

export default router;

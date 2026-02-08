import { Router, type Request, type Response } from "express";

const router: Router = Router();
router.get("/", testing);
export default router;

async function testing(req: Request, res: Response) {
  return res.json({
    something_is: "working",
  });
}

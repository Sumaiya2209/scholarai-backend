import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";
import {
  listPendingPapers,
  listAllPapersAdmin,
  getAdminStats,
  approvePaper,
  rejectPaper,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/papers", listAllPapersAdmin);
router.get("/papers/pending", listPendingPapers);
router.patch("/papers/:id/approve", approvePaper);
router.patch("/papers/:id/reject", rejectPaper);

export default router;
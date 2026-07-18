import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";
import { listPendingPapers, approvePaper, rejectPaper } from "../controllers/admin.controller";

const router = Router();

// Every route here needs a logged-in admin
router.use(requireAuth, requireAdmin);

router.get("/papers/pending", listPendingPapers);
router.patch("/papers/:id/approve", approvePaper);
router.patch("/papers/:id/reject", rejectPaper);

export default router;

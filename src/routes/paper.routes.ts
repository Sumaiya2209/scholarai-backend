import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { uploadPdf } from "../middleware/upload";
import {
  createPaper,
  listPapers,
  listMyPapers,
  getPaperById,
  deletePaper,
  getPlatformStats,
  getRelatedPapers,
} from "../controllers/paper.controller";

const router = Router();

// Public
router.get("/", listPapers);
router.get("/stats", getPlatformStats);

// Protected — must come BEFORE "/:id" so "mine" isn't parsed as an id
router.get("/mine", requireAuth, listMyPapers);
router.post("/", requireAuth, uploadPdf.single("file"), createPaper);
router.delete("/:id", requireAuth, deletePaper);

// Public (with internal ownership checks for non-approved papers)
router.get("/:id", getPaperById);
router.get("/:id/related", getRelatedPapers);

export default router;

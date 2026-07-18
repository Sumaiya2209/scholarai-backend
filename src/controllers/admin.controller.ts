import { Request, Response } from "express";
import { Paper } from "../models/Paper";
import { asyncHandler } from "../utils/asyncHandler";
import { generatePaperSummary } from "../lib/ai";
import { trimForContext } from "../utils/pdfExtract";

/**
 * GET /api/admin/papers/pending  (admin only)
 */
export const listPendingPapers = asyncHandler(async (_req: Request, res: Response) => {
  const papers = await Paper.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("uploadedBy", "name email")
    .select("-extractedText");
  res.json({ papers });
});

/**
 * PATCH /api/admin/papers/:id/approve  (admin only)
 * Approving a paper also triggers AI summarization (Document Intelligence
 * feature) so the details page has a summary the moment it goes public.
 */
export const approvePaper = asyncHandler(async (req: Request, res: Response) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  paper.status = "approved";
  paper.rejectionReason = undefined;

  try {
    const { summary, keyPoints } = await generatePaperSummary(trimForContext(paper.extractedText));
    paper.aiSummary = summary;
    paper.aiKeyPoints = keyPoints;
  } catch (err) {
    // Approval shouldn't fail just because the AI call hiccuped — log and
    // let the summary be generated later via the retry endpoint.
    console.error("AI summary generation failed on approval:", err);
  }

  await paper.save();
  res.json({ message: "Paper approved", paper });
});

/**
 * PATCH /api/admin/papers/:id/reject  (admin only)
 */
export const rejectPaper = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  paper.status = "rejected";
  paper.rejectionReason = reason || "Did not meet submission guidelines";
  await paper.save();

  res.json({ message: "Paper rejected", paper });
});

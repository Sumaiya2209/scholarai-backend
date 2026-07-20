import { Request, Response } from "express";
import mongoose from "mongoose";
import { Paper } from "../models/Paper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generatePaperSummary } from "../lib/ai.js";
import { trimForContext } from "../utils/pdfExtract.js";

export const listPendingPapers = asyncHandler(async (_req: Request, res: Response) => {
  const papers = await Paper.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("uploadedBy", "name email")
    .select("-extractedText");
  res.json({ papers });
});


export const listAllPapersAdmin = asyncHandler(async (req, res) => {
  try {
    console.log("Admin papers API called");

    const { status = "", page = "1", limit = "15" } = req.query as Record<string, string>;

  const query: Record<string, any> = {};
  if (status && status !== "all") {
    query.status = status;
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 15, 50);

  const [papers, total] = await Promise.all([
    Paper.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("uploadedBy", "name email")
      .select("-extractedText"),
    Paper.countDocuments(query),
  ]);

  res.json({
    papers,
    pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
  });

  } catch (err) {
    console.error(err);
    throw err;
  }
});


export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalPapers, pending, approved, rejected, totalUsers, fieldBreakdown] = await Promise.all([
    Paper.countDocuments({}),
    Paper.countDocuments({ status: "pending" }),
    Paper.countDocuments({ status: "approved" }),
    Paper.countDocuments({ status: "rejected" }),
    mongoose.connection.collection("user").countDocuments({}),
    Paper.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$field", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    totalPapers,
    pending,
    approved,
    rejected,
    totalUsers,
    fieldBreakdown: fieldBreakdown.map((f) => ({ field: f._id, count: f.count })),
  });
});

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
    console.error("AI summary generation failed on approval:", err);
  }

  await paper.save();
  res.json({ message: "Paper approved", paper });
});

export const rejectPaper = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  paper.status = "rejected";
  paper.rejectionReason = reason || "Did not meet submission guidelines";
  await paper.save();

  res.json({ message: "Paper rejected", paper });
});


import { Request, Response } from "express";
import { Paper } from "../models/Paper";
import { ChatMessage } from "../models/ChatMessage";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadPdfBuffer } from "../utils/cloudinary";
import { extractPdfText } from "../utils/pdfExtract";

/**
 * POST /api/papers  (protected)
 * Handles the "Add Paper" form. File comes in via multer (memory storage).
 * New papers always start as "pending" until an admin approves them.
 */
export const createPaper = asyncHandler(async (req: Request, res: Response) => {
  const { title, abstract, authors, field } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "PDF file is required" });
  }
  if (!title || !abstract || !authors || !field) {
    return res.status(400).json({ message: "Title, abstract, authors, and field are required" });
  }

  const extractedText = await extractPdfText(req.file.buffer);
  const fileUrl = await uploadPdfBuffer(req.file.buffer, `${Date.now()}-${req.file.originalname}`);

  const paper = await Paper.create({
    title,
    abstract,
    field,
    authors: Array.isArray(authors) ? authors : String(authors).split(",").map((a) => a.trim()),
    fileUrl,
    extractedText,
    uploadedBy: req.user!.id,
    status: "pending",
  });

  res.status(201).json({ message: "Paper submitted for admin approval", paper });
});

/**
 * GET /api/papers  (public)
 * Powers the /explore page: search + filter (field, sort) + pagination.
 * Only approved papers are ever visible here.
 */
export const listPapers = asyncHandler(async (req: Request, res: Response) => {
  const {
    search = "",
    field = "",
    sort = "newest",
    page = "1",
    limit = "12",
  } = req.query as Record<string, string>;

  const query: Record<string, any> = { status: "approved" };

  if (search) {
    query.$text = { $search: search };
  }
  if (field) {
    query.field = field;
  }

  const sortMap: Record<string, any> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    mostViewed: { views: -1 },
  };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 12, 50);

  const [papers, total] = await Promise.all([
    Paper.find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("-extractedText"), // no need to ship full paper text to list view
    Paper.countDocuments(query),
  ]);

  res.json({
    papers,
    pagination: {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total,
    },
  });
});

/**
 * GET /api/papers/mine  (protected)
 * Powers the "Manage Papers" dashboard — shows the logged-in user's own
 * submissions regardless of status (pending/approved/rejected).
 */
export const listMyPapers = asyncHandler(async (req: Request, res: Response) => {
  const papers = await Paper.find({ uploadedBy: req.user!.id })
    .sort({ createdAt: -1 })
    .select("-extractedText");
  res.json({ papers });
});

/**
 * GET /api/papers/:id  (public, with visibility rules)
 * Approved papers are visible to everyone. Pending/rejected papers are only
 * visible to their owner or an admin (so links can't leak unapproved work).
 */
export const getPaperById = asyncHandler(async (req: Request, res: Response) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  const isOwner = req.user?.id === paper.uploadedBy.toString();
  const isAdmin = req.user?.role === "admin";

  if (paper.status !== "approved" && !isOwner && !isAdmin) {
    return res.status(403).json({ message: "This paper is not publicly available yet" });
  }

  if (paper.status === "approved") {
    paper.views += 1;
    await paper.save();
  }

  res.json({ paper });
});

/**
 * DELETE /api/papers/:id  (protected — owner or admin only)
 */
export const deletePaper = asyncHandler(async (req: Request, res: Response) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  const isOwner = req.user?.id === paper.uploadedBy.toString();
  const isAdmin = req.user?.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not allowed to delete this paper" });
  }

  await Promise.all([
    Paper.findByIdAndDelete(paper._id),
    ChatMessage.deleteMany({ paperId: paper._id }),
  ]);

  res.json({ message: "Paper deleted" });
});

/**
 * GET /api/papers/:id/related  (public)
 * Simple related-papers logic for the details page: same field, approved,
 * excluding the current paper.
 */
export const getRelatedPapers = asyncHandler(async (req: Request, res: Response) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ message: "Paper not found" });

  const related = await Paper.find({
    _id: { $ne: paper._id },
    field: paper.field,
    status: "approved",
  })
    .limit(4)
    .select("-extractedText");

  res.json({ papers: related });
});


/**
 * GET /api/papers/stats  (public)
 * Powers the Home page's PlatformStats section with real, live numbers —
 * no hardcoded/dummy figures.
 */
export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [approvedPapers, fieldsAgg, viewsAgg, summariesGenerated] = await Promise.all([
    Paper.countDocuments({ status: "approved" }),
    Paper.distinct("field", { status: "approved" }),
    Paper.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$views" } } },
    ]),
    Paper.countDocuments({ status: "approved", aiSummary: { $exists: true, $ne: "" } }),
  ]);

  res.json({
    approvedPapers,
    fieldsCount: fieldsAgg.length,
    totalViews: viewsAgg[0]?.total || 0,
    summariesGenerated,
  });
});
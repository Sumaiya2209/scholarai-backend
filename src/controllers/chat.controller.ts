import { Request, Response } from "express";
import { Paper } from "../models/Paper";
import { ChatMessage } from "../models/ChatMessage";
import { asyncHandler } from "../utils/asyncHandler";
import { chatAboutPaper } from "../lib/ai";
import { trimForContext } from "../utils/pdfExtract";

/**
 * GET /api/chat/:paperId  (protected)
 * Returns this user's conversation history for a specific paper.
 */
export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
  const messages = await ChatMessage.find({
    paperId: req.params.paperId,
    userId: req.user!.id,
  }).sort({ createdAt: 1 });

  res.json({ messages });
});

/**
 * POST /api/chat/:paperId  (protected)
 * AI Chat Assistant feature — answers a question grounded in the paper's
 * extracted text, using the last few turns as conversation memory.
 */
export const sendChatMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }

  const paper = await Paper.findById(req.params.paperId);
  if (!paper) return res.status(404).json({ message: "Paper not found" });
  if (paper.status !== "approved") {
    return res.status(403).json({ message: "Chat is only available for approved papers" });
  }

  // Pull last 10 turns as memory so the assistant can handle follow-ups
  const recentHistory = await ChatMessage.find({
    paperId: paper._id,
    userId: req.user!.id,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const history = recentHistory
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  // Save the user's message first — guarantees correct chronological order,
  // and means the question isn't lost even if the AI call below fails.
  const userMsg = await ChatMessage.create({
    paperId: paper._id,
    userId: req.user!.id,
    role: "user",
    content: message,
  });

  const aiReply = await chatAboutPaper(trimForContext(paper.extractedText), history, message);

  const assistantMsg = await ChatMessage.create({
    paperId: paper._id,
    userId: req.user!.id,
    role: "assistant",
    content: aiReply,
  });

  res.json({ userMessage: userMsg, assistantMessage: assistantMsg });
});

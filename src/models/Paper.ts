import { Schema, model, Document, Types } from "mongoose";
import "./User"; // ensures the "User" model is registered before populate() is used
export type PaperStatus = "pending" | "approved" | "rejected";

export interface IPaper extends Document {
  title: string;
  abstract: string;
  authors: string[];
  field: string; // e.g. "Computer Science", "Biology", "Economics"
  fileUrl: string; // Cloudinary PDF url
  extractedText: string; // raw text pulled from the PDF, used as AI chat context
  uploadedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  status: PaperStatus;
  rejectionReason?: string;
  aiSummary?: string;
  aiKeyPoints?: string[];
  views: number;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

const paperSchema = new Schema<IPaper>(
  {
    title: { type: String, required: true, trim: true },
    abstract: { type: String, required: true },
    authors: { type: [String], required: true },
    field: { type: String, required: true, index: true },
    fileUrl: { type: String, required: true },
    extractedText: { type: String, default: "" },
    uploadedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String },
    aiSummary: { type: String },
    aiKeyPoints: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index powers the /explore search bar (title + abstract + authors)
paperSchema.index({ title: "text", abstract: "text", authors: "text" });

export const Paper = model<IPaper>("Paper", paperSchema);

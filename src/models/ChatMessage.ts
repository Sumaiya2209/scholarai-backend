import mongoose from "mongoose";
import type { Document, Types } from "mongoose";

const { Schema, model } = mongoose;

export interface IChatMessage extends Document {
  paperId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    paperId: { type: Schema.Types.ObjectId, required: true, ref: "Paper", index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "user", index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatMessage = model<IChatMessage>("ChatMessage", chatMessageSchema);

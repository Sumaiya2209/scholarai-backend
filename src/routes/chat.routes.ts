import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getChatHistory, sendChatMessage } from "../controllers/chat.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/:paperId", getChatHistory);
router.post("/:paperId", sendChatMessage);

export default router;

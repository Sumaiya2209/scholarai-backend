import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getChatHistory, sendChatMessage } from "../controllers/chat.controller";

const router = Router();

router.use(requireAuth);

router.get("/:paperId", getChatHistory);
router.post("/:paperId", sendChatMessage);

export default router;

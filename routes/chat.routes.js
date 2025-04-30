import express from "express";
import { getChatHistory, sendMessage } from "../controllers/chat.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js"; // Ensure consistent naming

const router = express.Router();

// Get chat history for a course
router.get("/:courseId", isLoggedIn, getChatHistory);

// Send a message (fallback for clients that can't use WebSockets)
router.post("/:courseId", isLoggedIn, sendMessage);

export default router;

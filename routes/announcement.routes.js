import express from "express";
import { getAnnouncementsByCourse, createAnnouncement } from "../controllers/announcement.controller.js";
// import { verifyToken, verifyInstructor } from "../middleware/auth.js";
import { isInstructor, isLoggedIn } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 📌 GET all announcements
router.get("/:courseId", getAnnouncementsByCourse);

// 📌 POST a new announcement (Only Instructors)
router.post("/", isLoggedIn, isInstructor, createAnnouncement);

export default router;

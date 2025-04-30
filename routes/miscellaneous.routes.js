import { Router } from "express";
import {
    contactUs,
    userStats,
} from '../controllers/miscellaneous.controller.js';
import { isInstructor, isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/contact').post(contactUs);
router.route('/admin/stats/users').get(isLoggedIn, isInstructor, userStats);

export default router;
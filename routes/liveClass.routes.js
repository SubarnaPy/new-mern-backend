// import express from "express";
// import {
//   createLiveClass,
//   getLiveClassesByCourse,
//   joinLiveClass,
//   endLiveClass,
// } from "../controllers/liveClass.controller.js";
// import {
//     isStudent,
//     isLoggedIn,
//     isInstructor,
// } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// router.post("/create", isLoggedIn, isInstructor, createLiveClass);
// router.get("/course/:courseId", isLoggedIn, getLiveClassesByCourse);
// router.post("/join/:classId", isLoggedIn, joinLiveClass);
// router.post("/end/:classId", isLoggedIn, isInstructor, endLiveClass);

// export default router;

import express from "express";
import { createClass } from "../controllers/liveClass.controller.js";

const router = express.Router();

router.post("/create-class", createClass);

export default router;

import { Router } from 'express';

const router = Router();
import{ isLoggedIn, isInstructor,isStudent } from"../middlewares/auth.middleware.js";
import{
  deleteAccount,
  updateUserProfile,
  getUserProfile,
//   getAllUserDetails,
//   updateDisplayPicture,
  getEnrolledCourses,
//   instructorDashboard,
}from"../controllers/profile.controller.js";
import upload from '../middlewares/multer.middleware.js';

// Delet User Account
router.delete("/deleteProfile",isLoggedIn,deleteAccount)
router.put("/updateProfile",isLoggedIn,upload.single('thumbnailImage'), updateUserProfile)
router.get("/getUserDetails", isLoggedIn, getUserProfile )
// Get Enrolled Courses
router.get("/getEnrolledCourses", isLoggedIn, getEnrolledCourses)
//router.put("/updateDisplayPicture", isInstructor, updateDisplayPicture)
//get instructor dashboard details
//router.get("/getInstructorDashboardDetails",auth,isInstructor, instructorDashboard)

export default router;
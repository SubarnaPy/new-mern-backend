import { Router } from 'express';
import {
  getCourseByInstructorId,
  getCourseEntireDetailsById,
  createCourse,
  deleteCourseById,
  getAllCourses,
  updateCourseById,
   searchCourses, 
   getTopCourses
} from '../controllers/course.controller.js';

import {
  createSection,
  updateSection,
  deleteSection,
} from "../controllers/section.controller.js"

// Sub-Sections Controllers Import
import {
  createSubSection,
  updateSubSectionById,
  deleteSubSectionById,
  getAllSubSectionsBySectionId
} from "../controllers/subSection.controller.js";

// Rating Controllers Import
import {
  addRatingAndReview,
  getAverageRatingByCourseId ,
  getAllRatings
  
} from"../controllers/rattingAndReview.controller.js"
import {
  //authorizeRoles,
  authorizeSubscribers,
  isLoggedIn,
  isInstructor, isStudent, isAdmin 
} from '../middlewares/auth.middleware.js';
import upload, { uploadMultiple } from '../middlewares/multer.middleware.js';
import { updateAssignmentProgress, updateCourseProgress } from '../controllers/courseProgress.controller.js';
import { createCategory,addCourseToCategory,categoryPageDetails, showAllCategories } from '../controllers/catagory.controller.js';
import { createAssignment, deleteAssignment, fetchSubmissions, getAssignment, gradeAssignment, submitAssignment, updateAssignment } from '../controllers/assignment.controller.js';
import { createQuiz, getQuizBySection, submitQuiz } from '../controllers/quize.controller.js';

const router = Router();

// , isLoggedIn, authorizeRoles("ADMIN", "USER") - middlewares

// // OLD Code
// router.get("/", getAllCourses);
// router.post("/", isLoggedIn, authorizeRoles("ADMIN"), createCourse);
// router.delete(
//   "/",
//   isLoggedIn,
//   authorizeRoles("ADMIN"),
//   removeLectureFromCourse
// );
// router.get("/:id", isLoggedIn, getLecturesByCourseId);
// router.post(
//   "/:id",
//   isLoggedIn,
//   authorizeRoles("ADMIN"),
//   upload.single("lecture"),
//   addLectureToCourseById
// );
// router.delete("/:id", isLoggedIn, authorizeRoles("ADMIN"), deleteCourseById);

// Refactored code


// Courses can Only be Created by Instructors
router.post("/createCourse", isLoggedIn, isInstructor,upload.single('thumbnailImage'), createCourse)
//Add a Section to a Course
router.post("/addSection", isLoggedIn, isInstructor, createSection)
// Update a Section
router.post("/updateSection", isLoggedIn, isInstructor, updateSection)
// Delete a Section
router.post("/deleteSection", isLoggedIn, isInstructor, deleteSection)
// Edit Sub Section
router.post("/updateSubSection", isLoggedIn, isInstructor,upload.single('videoFile'), updateSubSectionById)
// Delete Sub Section
router.post("/deleteSubSection", isLoggedIn, isInstructor, deleteSubSectionById)
// Add a Sub Section to a Section
// router.post("/addSubSection", isLoggedIn, isInstructor,upload.single('videoFile'), createSubSection)
router.post("/addSubSection", isLoggedIn, isInstructor, uploadMultiple, createSubSection);
// Get all Registered Courses
router.get("/getAllCourses", getAllCourses)
// Get Details for a Specific Courses
router.post("/fullCourseDetails",  getCourseEntireDetailsById)
// Get Details for a Specific Courses
//router.post("/getFullCourseDetails", isLoggedIn, getFullCourseDetails)
// Edit Course routes
router.post("/editCourse", isLoggedIn, isInstructor,upload.single('thumbnailImage'), updateCourseById)
// Get all Courses Under a Specific Instructor
router.get("/instructorCourses", isLoggedIn, isInstructor, getCourseByInstructorId)
// Delete a Course
router.post("/deleteCourse", deleteCourseById,)
 router.post("/updateCourseProgress", isLoggedIn,  updateCourseProgress);
 router.get('/top-courses', getTopCourses);


router.post("/createRating", isLoggedIn, isStudent,addRatingAndReview )
router.get("/getAverageRating", getAverageRatingByCourseId)
router.get("/getReviews", getAllRatings)

router.post("/createCategory", isLoggedIn, isInstructor, createCategory)
router.get("/showAllCategories", showAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)
router.post("/addCourseToCategory", isLoggedIn, isInstructor, addCourseToCategory);

router.post("/createAssignment",upload.single('file'), createAssignment);
router.post("/fetchAssignments", getAssignment );
router.get("/assignments/:assignmentId/submissions", fetchSubmissions);
router.post("/sections/assignments/submit",upload.single('Assignmentfile'), submitAssignment);
router.post("/grade/gradeAssignment", gradeAssignment);
router.post("/assignments/complete",isLoggedIn, updateAssignmentProgress);
router.post("/createquizzes", createQuiz);
router.get("/getQuizBySection", getQuizBySection);
router.post("/submit/:quizId", submitQuiz);
router.post("/deleteAssignment", deleteAssignment);     
router.post("/updateAssignment", upload.single("file"), updateAssignment);


// router
//   .route('/')
//   .get(getAllCourses)
//   .post(
//     isLoggedIn,
//     authorizeRoles('ADMIN'),
//     upload.single('thumbnail'),
//     createCourse,
//   )
//   .delete(isLoggedIn, authorizeRoles('ADMIN'), removeLectureFromCourse);

// router
//   .route('/:id')
//   .get(isLoggedIn, authorizeSubscribers, getLecturesByCourseId) // Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures
//   .post( isLoggedIn, authorizeRoles('ADMIN'), upload.single('lecture'), addLectureToCourseById)
//   .put(isLoggedIn, authorizeRoles('ADMIN'), updateCourseById);

  
  
  

  
  // Route to handle course search
  router.get('/course/search', searchCourses);  


//   console.log(createCourse); // Should not be undefined
// console.log(isLoggedIn); // Should not be undefined
// console.log(authorizeRoles); // Should not be undefined
// console.log(upload); // Should not be undefined


export default router;

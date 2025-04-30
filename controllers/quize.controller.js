import Quiz from "../models/quize.model.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import AppError from "../utils/AppError.js";
import Section from "../models/section.model.js";
import Course from "../models/course.model.js";

// ✅ Create Quiz
export const createQuiz = asyncHandler(async (req, res) => {
  console.log(req.body)
  const { title, courseId,sectionId, questions } = req.body;

  const quiz = await Quiz.create({
    title,
    
    section:sectionId,
    questions,
    
  });

  const updatedSection = await Section.findByIdAndUpdate(
    sectionId,
    { $push: { quizzes: quiz._id } },
    { new: true }
  ).populate("subSection");

  if (!updatedSection) {
    return res.status(404).json({ success: false, message: "Failed to update section" });
  }
  
    // console.log(assignment);
  
    const course = await Course.findById(courseId)
    .populate({
      path: "courseContent",
      populate: [
        { path: "subSection" },       // Populate subSection
        { path: "assignments" },      // Populate assignments
        { path: "quizzes" }           // Populate quizzes
      ]
    });
  
    console.log(course)
    
  
    res.status(201).json({
      success: true,
      data: course,
    });
  });

// ✅ Get Quiz by Section (IDs in body)
export const getQuizBySection = asyncHandler(async (req, res) => {
  const { sectionId } = req.body;

  if (!sectionId) {
    throw new AppError("Section ID is required", 400);
  }

  const quiz = await Quiz.find({ section: sectionId });

  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  res.status(200).json({
    success: true,
    data: quiz,
  });
});

// ✅ Submit Quiz (IDs in body)
export const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId, answers } = req.body;

  if (!quizId) {
    throw new AppError("Quiz ID is required", 400);
  }

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  let score = 0;

  quiz.questions.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      score++;
    }
  });

  res.status(200).json({
    success: true,
    message: "Quiz submitted successfully",
    score,
    totalQuestions: quiz.questions.length,
  });
});

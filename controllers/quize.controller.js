import {Quiz,QuizSubmission} from "../models/quize.model.js";
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
  console.log(sectionId)

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
// import { Quiz, QuizSubmission } from "../models/quiz.model.js";
// import asyncHandler from "express-async-handler";
// import AppError from "../utils/appError.js";

// Submit quiz with detailed tracking

export const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId, answers } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!quizId || !Array.isArray(answers)) {
    throw new AppError("Invalid submission data", 400);
  }

  // Find the quiz
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) throw new AppError("Quiz not found", 404);

  let correctAnswers = 0;

  // Process answers
  const processedAnswers = quiz.questions.map((question) => {
    const userAnswer = answers.find(
      (a) => a.questionId === question._id.toString()
    );
    const correctOption = question.options[question.correctOption];
    const selectedOption = userAnswer?.selectedOption || null;
    const isCorrect = selectedOption === correctOption;

    if (isCorrect) correctAnswers++;

    return {
      questionId: question._id,
      selectedOption,
      correctOption,
      isCorrect,
    };
  });

  // Calculate score
  const totalQuestions = quiz.questions.length;
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

  // Create quiz submission
  const submission = await QuizSubmission.create({
    user: userId,
    quiz: quizId,
    section: quiz.section,
    answers: processedAnswers,
    totalQuestions,
    correctAnswers,
    scorePercentage,
  });

  // Increment totalAttempts count in quiz document
  await Quiz.findByIdAndUpdate(quizId, {
    $inc: { totalAttempts: 1 },
  });

  res.status(201).json({
    status: "success",
    data: {
      submissionId: submission._id,
      correctAnswers,
      totalQuestions,
      scorePercentage,
      details: processedAnswers,
    },
  });
});


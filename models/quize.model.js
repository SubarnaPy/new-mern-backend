// models/quiz.model.js

import mongoose from "mongoose";

// ========== Quiz Schema ==========
const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
          required: true,
        },
      ],
      correctOption: {
        type: Number, // index of the correct option
        required: true,
      },
    },
  ],
  totalAttempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Quiz = mongoose.model("Quiz", quizSchema);

// ========== Quiz Submission Schema ==========
const quizSubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      selectedOption: {
        type: String,
        required: true,
      },
      correctOption: {
        type: String,
        required: true,
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
    },
  ],
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  scorePercentage: {
    type: Number,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export const QuizSubmission = mongoose.model("QuizSubmission", quizSubmissionSchema);

// import { Quiz, QuizSubmission } from "../models/quiz.model.js";

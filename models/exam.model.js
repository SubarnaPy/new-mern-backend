import mongoose from 'mongoose';

// Schema for defining a live exam
const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructions: { type: String },
  duration: { type: Number, required: true }, // in minutes
  passingScore: { type: Number, required: true },

  isLive: { type: Boolean, default: false },
  startTime: { type: Date },
  endTime: { type: Date },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  questions: [
    {
      question: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctAnswer: { type: Number, required: true },
    },
  ],
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;

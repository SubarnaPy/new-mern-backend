import mongoose from 'mongoose';

const examAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: {
    type: String,
    enum: ['ongoing', 'submitted', 'auto-submitted'],
    default: 'ongoing'
  },

  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    answeredAt: Date
  }],

  currentQuestionIndex: { type: Number, default: 0 },
  questionTimestamps: [{
    questionIndex: Number,
    viewedAt: Date,
    answeredAt: Date
  }],

  violations: { type: Number, default: 0 },
  tabSwitchCount: { type: Number, default: 0 },
  faceNotDetectedCount: { type: Number, default: 0 },
  screenshotViolations: { type: Number, default: 0 },
  isAutoSubmitted: { type: Boolean, default: false },
  score: Number,
  feedback: String
}, { timestamps: true });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);
export default ExamAttempt;

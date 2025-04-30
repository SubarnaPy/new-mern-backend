import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  totalMarks: {
    type: Number,
    default: 100,   // Default marks, if not specified
  },
  uploadedFiles: [
    {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
  ],
  submissions: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      submittedFiles: [
        {
          public_id: {
            type: String,
          },
          secure_url: {
            type: String,
          },
        },
      ],
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      marksObtained: {
        type: Number,
      },
      feedback: {
        type: String,
      },
    },
  ],
  assignmentStatus: {
    type: String,
    enum: ["due", "completed", "overdue"],   // Allowed statuses
    default: "due",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the status based on the due date
assignmentSchema.pre("save", function (next) {
  const now = new Date();
  if (this.dueDate < now) {
    this.assignmentStatus = "overdue";
  } else if (this.submissions && this.submissions.length > 0) {
    this.assignmentStatus = "completed";
  } else {
    this.assignmentStatus = "due";
  }
  next();
});

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;

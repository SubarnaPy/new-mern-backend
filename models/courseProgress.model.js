import mongoose, { model, Schema } from 'mongoose';

const courseProgressSchema = new Schema(
  {
    courseID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',

    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedVideos:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubSections',
        }
    ],
    completedAssignments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment"
  }],
  completedQuizzes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz"
  }],
   
  },
  {
    timestamps: true,
  }
);

const CourseProgress = model('CourseProgress', courseProgressSchema);

export default CourseProgress;


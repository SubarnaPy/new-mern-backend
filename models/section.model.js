import mongoose, { model, Schema } from 'mongoose';

const sectionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subSection: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SubSection',
      }
    ],
    quizzes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',   // Reference to the Quiz model
      }
    ],
    assignments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Assignment',   // Reference to the Assignment model
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Section = model('Section', sectionSchema);

export default Section;

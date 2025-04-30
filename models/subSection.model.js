import { model, Schema } from 'mongoose';

const subSectionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    timeDuration: {
      type: Number, // Store duration in seconds
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    lecture: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
      isFree: {
        type: Boolean,
      },
    },
    demoLecture: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    pdf: {  
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

const SubSection = model("SubSection", subSectionSchema);

export default SubSection;

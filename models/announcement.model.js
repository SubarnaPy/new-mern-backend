import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    isLive: { type: Boolean, default: false },
    roomId: {
      type: String, // ✅ New field to store live class room ID
      default: null, // If no live class, roomId is null
    },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);

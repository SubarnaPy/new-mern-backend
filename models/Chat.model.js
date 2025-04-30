import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        senderName: {
          type: String,
        },
        message: {
          type: String,
        },
        fileUrl: {
          type: String,
        },
        replyTo: {
          type: mongoose.Schema.Types.ObjectId, // Reference to the message being replied to
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
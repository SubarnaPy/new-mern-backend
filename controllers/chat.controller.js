import mongoose from "mongoose";
import Chat from "../models/Chat.model.js";
import User from "../models/user.model.js";

// Helper function to save a message
const saveMessage = async (courseId, userId, message, fileUrl, replyTo) => {
  let chat = await Chat.findOne({ course: courseId });
  const user = await User.findById(userId);
  const userName = user.fullName;

  if (!chat) {
    chat = new Chat({ course: courseId, messages: [] });
  }

  const newMessage = {
    sender: userId,
    senderName: userName,
    message,
    fileUrl, // Save the file URL (can be an image or PDF)
    replyTo, // Save the ID of the message being replied to
    timestamp: new Date(),
  };

  chat.messages.push(newMessage);
  await chat.save();

  // If the message is a reply, find the replied message and attach its details
  if (replyTo) {
    const repliedMessage = chat.messages.find((m) => m._id.equals(replyTo));
    if (repliedMessage) {
      newMessage.replyTo = {
        _id: repliedMessage._id,
        message: repliedMessage.message,
        fileUrl: repliedMessage.fileUrl,
        senderName: repliedMessage.senderName,
      };
    } else {
      newMessage.replyTo = null; // If the replied message is not found
    }
  }

  return newMessage;
};

// Get chat history for a course
export const getChatHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const chat = await Chat.findOne({ course: courseId });

    if (!chat) {
      return res.status(404).json({ message: "No chat found for this course" });
    }

    // Manually resolve the replyTo field
    const messagesWithReplies = chat.messages.map((message) => {
      if (message.replyTo) {
        const repliedMessage = chat.messages.find((m) => m._id.equals(message.replyTo));
        return {
          ...message.toObject(),
          replyTo: repliedMessage ? {
            _id: repliedMessage._id,
            message: repliedMessage.message,
            fileUrl: repliedMessage.fileUrl,
            senderName: repliedMessage.senderName,
          } : null,
        };
      }
      return message;
    });

    res.status(200).json(messagesWithReplies);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send a message via REST API
export const sendMessage = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, message, fileUrl, replyTo } = req.body;

    if (!userId || (!message && !fileUrl)) {
      return res.status(400).json({ message: "User ID and message or file are required" });
    }

    const newMessage = await saveMessage(courseId, userId, message, fileUrl, replyTo);
    res.status(201).json({ message: "Message sent successfully", newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Initialize Socket.IO
export const initializeChat = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a course room
    socket.on("joinCourse", (courseId) => {
      socket.join(courseId);
      console.log(`User joined course chat: ${courseId}`);
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ courseId, userId, message, fileUrl, replyTo }) => {
      try {
        const newMessage = await saveMessage(courseId, userId, message, fileUrl, replyTo);
        console.log(newMessage);
        io.to(courseId).emit("newMessage", newMessage); // Broadcast the message to the course room
      } catch (error) {
        console.error("Error handling socket message:", error);
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// In-memory storage
let connections = {};  // { courseId: [ { socketId, userId, name, role } ] }
let messages = {};     // { courseId: [ messageData ] }
let timeOnline = {};   // { socketId: loginTime }

const JWT_SECRET = process.env.JWT_SECRET || "your_long_jwt_secret";

export const connectToSocket = (io) => {
  // Authenticate socket connection using JWT
  io.use((socket, next) => {
    const { token, courseId } = socket.handshake.auth;

    if (!token || !courseId) {
      return next(new Error("Authentication failed: Missing token or courseId"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.courseId = courseId;
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    const { courseId, user } = socket;
    const userData = {
      socketId: socket.id,
      userId: user.id || socket.id,
      name: user.email || "Unknown",
      role: user.role || "STUDENT",
    };

    // Initialize course data if not already present
    if (!connections[courseId]) connections[courseId] = [];

    // Check if the user is already connected to the course
    const existing = connections[courseId].find(p => p.userId === userData.userId);

    // If the user is already connected, just update the socket ID without disconnecting
    if (existing) {
      existing.socketId = socket.id;
    } else {
      // Add this new connection
      connections[courseId].push(userData);
    }

    timeOnline[socket.id] = new Date();

    console.log(`✅ ${userData.name} connected to course ${courseId}`);

    // Notify all other participants that a new user has joined
    connections[courseId].forEach(p => {
      if (p.socketId !== socket.id) {
        io.to(p.socketId).emit("user-joined", socket.id, {
          userId: userData.userId,
          name: userData.name,
          role: userData.role
        });
      }
    });

    // Send current participants list to the newly joined user
    io.to(socket.id).emit("participants", connections[courseId]);

    // Send previous chat history to the new participant
    if (messages[courseId]) {
      messages[courseId].forEach(msg => {
        io.to(socket.id).emit("chat-message", msg);
      });
    }

    // Handle chat messages
    socket.on("chat-message", (msgData) => {
      if (!messages[courseId]) messages[courseId] = [];
      messages[courseId].push(msgData);

      // Broadcast message to all participants
      connections[courseId].forEach(p => {
        io.to(p.socketId).emit("chat-message", msgData);
      });
    });

    // Handle WebRTC signaling
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Raise hand functionality
    socket.on("raise-hand", (isRaised) => {
      connections[courseId].forEach(p => {
        io.to(p.socketId).emit("raise-hand", socket.id, isRaised);
      });
    });

    // Handle file sharing
    socket.on("share-file", (fileData) => {
      connections[courseId].forEach(p => {
        io.to(p.socketId).emit("file-shared", fileData);
      });
    });

    console.log()

    // Handle ICE candidates for WebRTC
    socket.on("ice-candidate", (toId, candidate) => {
      io.to(toId).emit("ice-candidate", socket.id, candidate);
    });

    // WebRTC offers and answers
    socket.on("offer", (toId, offer) => {
      socket.to(toId).emit("offer", socket.id, offer);
    });

    socket.on("answer", (toId, answer) => {
      socket.to(toId).emit("answer", socket.id, answer);
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.id}`);

      // Remove the user from the list of participants
      connections[courseId] = connections[courseId]?.filter(p => p.socketId !== socket.id) || [];

      // Notify other participants
      connections[courseId].forEach(p => {
        io.to(p.socketId).emit("user-left", socket.id);
      });

      delete timeOnline[socket.id];
    });
  });
};

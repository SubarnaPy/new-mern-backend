// backend/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Improved data structures
const courseRooms = new Map(); // Map<courseId, RoomState>
const userConnections = new Map(); // Map<userId, { socketId, lastSeen }>

class RoomState {
  constructor() {
    this.participants = new Map(); // Map<userId, UserData>
    this.messages = [];
    this.files = [];
    this.raisedHands = new Set();
    this.whiteboardState = null;
  }
}

export const connectToSocket = (io) => {
  io.use((socket, next) => {
    try {
      const { token, courseId } = socket.handshake.auth;
      const decoded = jwt.verify(token, JWT_SECRET);
      
      socket.user = {
        id: decoded._id,
        courseId,
        name: decoded.name,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { user } = socket;
    let roomState = courseRooms.get(user.courseId);

    // Initialize room if not exists
    if (!roomState) {
      roomState = new RoomState();
      courseRooms.set(user.courseId, roomState);
    }

    // Handle reconnection
    const existingConnection = userConnections.get(user.id);
    if (existingConnection) {
      // Disconnect old socket
      io.to(existingConnection.socketId).disconnect(true);
    }

    // Update connections
    userConnections.set(user.id, {
      socketId: socket.id,
      lastSeen: Date.now()
    });

    // Add/update participant
    roomState.participants.set(user.id, {
      userId: user.id,
      name: user.name,
      role: user.role,
      connected: true
    });

    // Join room channel
    socket.join(user.courseId);

    // Send initial state to reconnecting user
    socket.emit("room-state", {
      participants: Array.from(roomState.participants.values()),
      messages: roomState.messages.slice(-100),
      files: roomState.files.slice(-10),
      raisedHands: Array.from(roomState.raisedHands),
      whiteboard: roomState.whiteboardState
    });

    // Notify others about connection update
    socket.to(user.courseId).emit("participant-updated", {
      userId: user.id,
      status: 'connected'
    });

    // WebRTC Signaling
    socket.on("offer", ({ targetUserId, offer }) => {
      const target = userConnections.get(targetUserId);
      if (target) {
        io.to(target.socketId).emit("offer", {
          fromUserId: user.id,
          offer
        });
      }
    });

    socket.on("answer", ({ targetUserId, answer }) => {
      const target = userConnections.get(targetUserId);
      if (target) {
        io.to(target.socketId).emit("answer", {
          fromUserId: user.id,
          answer
        });
      }
    });

    socket.on("ice-candidate", ({ targetUserId, candidate }) => {
      const target = userConnections.get(targetUserId);
      if (target) {
        io.to(target.socketId).emit("ice-candidate", {
          fromUserId: user.id,
          candidate
        });
      }
    });

    // Chat handling
    socket.on("chat-message", (message) => {
      const msgData = {
        ...message,
        userId: user.id,
        timestamp: Date.now()
      };
      
      roomState.messages.push(msgData);
      io.to(user.courseId).emit("chat-message", msgData);
    });

    // File sharing
    socket.on("share-file", (fileData) => {
      const file = {
        ...fileData,
        userId: user.id,
        timestamp: Date.now()
      };
      
      roomState.files.push(file);
      io.to(user.courseId).emit("file-shared", file);
    });

    // Raise hand
    socket.on("raise-hand", (isRaised) => {
      if (isRaised) {
        roomState.raisedHands.add(user.id);
      } else {
        roomState.raisedHands.delete(user.id);
      }
      io.to(user.courseId).emit("raise-hand-update", {
        userId: user.id,
        isRaised
      });
    });

    // Whiteboard
    socket.on("whiteboard-update", (update) => {
      if (user.role === 'INSTRUCTOR') {
        roomState.whiteboardState = update;
        socket.to(user.courseId).emit("whiteboard-update", update);
      }
    });

    // Disconnection handler
    socket.on("disconnect", () => {
      userConnections.delete(user.id);
      const participant = roomState.participants.get(user.id);
      if (participant) {
        participant.connected = false;
        socket.to(user.courseId).emit("participant-updated", {
          userId: user.id,
          status: 'disconnected'
        });
      }
      
      // Cleanup empty rooms
      if (roomState.participants.size === 0) {
        courseRooms.delete(user.courseId);
      }
    });

    // Periodic cleanup
    setInterval(() => {
      const now = Date.now();
      userConnections.forEach((value, key) => {
        if (now - value.lastSeen > 30000) { // 30s timeout
          userConnections.delete(key);
          const participant = roomState.participants.get(key);
          if (participant) {
            participant.connected = false;
            io.to(user.courseId).emit("participant-updated", {
              userId: key,
              status: 'disconnected'
            });
          }
        }
      });
    }, 10000);
  });
};
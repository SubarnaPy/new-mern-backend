import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const courseRooms = new Map();

class RoomState {
  constructor() {
    this.participants = new Map();
    this.messages = [];
    this.files = [];
    this.raisedHands = new Set();
    this.whiteboardState = null;
  }
}

export const connectToSocket = (io) => {
  io.use((socket, next) => {
    try {
      const { token } = socket.handshake.auth;
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = {
        id: decoded._id,
        courseId: decoded.courseId,
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
    let roomState = courseRooms.get(user.courseId) || new RoomState();
    
    // Existing connection cleanup
    const existing = [...courseRooms.values()]
      .find(room => room.participants.has(user.id));
    if (existing) existing.participants.delete(user.id);

    // Update room state
    roomState.participants.set(user.id, {
      userId: user.id,
      name: user.name,
      role: user.role,
      streams: []
    });
    courseRooms.set(user.courseId, roomState);

    socket.join(user.courseId);
    
    // Event handlers
    socket.on("offer", ({ targetUserId, offer }) => {
      const target = roomState.participants.get(targetUserId);
      if (target) {
        io.to(target.socketId).emit("offer", { 
          fromUserId: user.id, 
          offer,
          streams: roomState.participants.get(user.id)?.streams || []
        });
      }
    });

    socket.on("answer", ({ targetUserId, answer }) => {
      const target = roomState.participants.get(targetUserId);
      if (target) io.to(target.socketId).emit("answer", { fromUserId: user.id, answer });
    });

    socket.on("ice-candidate", ({ targetUserId, candidate }) => {
      const target = roomState.participants.get(targetUserId);
      if (target) io.to(target.socketId).emit("ice-candidate", { fromUserId: user.id, candidate });
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      roomState.participants.delete(user.id);
      if (roomState.participants.size === 0) {
        courseRooms.delete(user.courseId);
      }
      socket.to(user.courseId).emit("user-left", user.id);
    });
  });
};

import { createServer } from 'http';
import { v2 as cloudinary } from 'cloudinary';
import express from 'express';


import app from './app.js';
import { Server } from "socket.io";
import connectToDb from './configs/dbConnect.js';
import { initializeChat } from "./controllers/chat.controller.js";
import { connectToSocket } from './controllers/liveClass.controller.js';
import path from 'path';
// import { initializeLiveClass } from "./controllers/liveClass.controller.js";




cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Create an HTTP server
const server = createServer(app);

// Initialize WebSocket chat and live class
// initializeChat(server);
// initializeLiveClass(server);

// Dynamic Import for PeerJS
// (async () => {
//     const { ExpressPeerServer } = await import("peer");
//     const peerServer = ExpressPeerServer(server, {
//         debug: true,
//         path: "/peerjs",
//     });

//     app.use('/peerjs', peerServer);
// })();

// const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//     },
//     transports: ['websocket']
//   });
//  connectToSocket(io);


const io = new Server(server, {
  cors: {
    origin: 'https://new-lms-8qgi.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

initializeChat(io);


// In-memory room tracking
const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR' | 'STUDENT' }> }

io.on('connection', socket => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // A client joins a room
  socket.on('join-room', (roomId, { role }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, role });
    console.log(`→ ${socket.id} joined room ${roomId} as ${role}`);

    // Notify the new client of existing users
    const existing = rooms[roomId].filter(u => u.id !== socket.id);
    socket.emit('all-users', existing);

    // Broadcast to others that a new user joined
    socket.to(roomId).emit('user-joined', { id: socket.id, role });
  });

  // Relay offers, answers, and ICE candidates
  socket.on('offer', ({ target, sdp, role }) => {
    io.to(target).emit('offer', { caller: socket.id, sdp, role });
  });

  socket.on('whiteboard-draw', data => {
    socket.to(socket.roomId).emit('whiteboard-draw', data);
  });

  socket.on('answer', ({ target, sdp }) => {
    io.to(target).emit('answer', { responder: socket.id, sdp });
  });

  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', { sender: socket.id, candidate });
  });

  // Chat message forwarding
  socket.on('chat-message', ({ text, sender }) => {
    // find rooms this socket is in
    const socketRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    socketRooms.forEach(roomId => {
      socket.to(roomId).emit('chat-message', { text, sender });
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    // Remove from rooms and notify peers
    for (const roomId of Object.keys(rooms)) {
      rooms[roomId] = rooms[roomId].filter(u => u.id !== socket.id);
      socket.to(roomId).emit('user-disconnected', socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});



//   handleSocketEvents(io);
// Define server port
const port = process.env.PORT || 5001;

// ////////////////////////////////////////////////////////////////////////////////////////////
// if(process.env.NODE_ENV === 'production'){
//     const dirPath=path.resolve();

//     app.use(express.static("./frontend/dist"));
//     app.get("*",(req,res)=>{
//         res.sendFile(path.resolve(dirPath,"frontend/dist","index.html"));
//     })
// }

// Start the server
server.listen(port, async () => {
    await connectToDb();
    console.log(`🚀 Server running on port ${port}`);
    // console.log(`🎥 PeerJS Server available at ws://localhost:${port}/peerjs`);
});


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
// initializeChat(io);


const io = new Server(server, {
  cors: {
    origin: 'https://new-lms-8qgi.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// In-memory room tracking
const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR' | 'STUDENT' }> }

io.on('connection', socket => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId, { role }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, role });
    console.log(`→ ${socket.id} joined room ${roomId} as ${role}`);

    // Send all existing users (except self)
    const existing = rooms[roomId].filter(u => u.id !== socket.id);
    socket.emit('all-users', existing);

    // Notify others of the newcomer
    socket.to(roomId).emit('user-joined', { id: socket.id, role });
  });

  // Signaling: forward SDP offers
  socket.on('offer', ({ target, sdp, role }) => {
    io.to(target).emit('offer', { caller: socket.id, sdp, role });
  });

  // Signaling: forward SDP answers
  socket.on('answer', ({ target, sdp }) => {
    io.to(target).emit('answer', { responder: socket.id, sdp });
  });

  // Signaling: forward ICE candidates
  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', { sender: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Remove from rooms and notify peers
    Object.keys(rooms).forEach(roomId => {
      rooms[roomId] = rooms[roomId].filter(u => u.id !== socket.id);
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
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

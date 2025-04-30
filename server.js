
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

const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
 connectToSocket(io);
initializeChat(io);

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

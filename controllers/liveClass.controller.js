// server.js (Enhanced Backend)
import { Server } from "socket.io";

let liveClasses = {};
let userRoles = {};

export const connectToSocket = (io) => {
   

    io.use((socket, next) => {
        // Add authentication middleware here (JWT verification)
        const token = socket.handshake.auth.token;
        // Verify token and fetch user role from LMS system
        next();
    });

    io.on("connection", (socket) => {
        socket.on("create-class", (classData) => {
            const classId = generateClassId();
            liveClasses[classId] = {
                teacher: socket.id,
                students: new Set(),
                handRaised: new Set(),
                isRecording: false,
                classInfo: classData
            };
            userRoles[socket.id] = 'teacher';
            socket.emit('class-created', classId);
        });

        // Modify join-class handler to notify all participants
socket.on("join-class", (classId, userData) => {
    if (!liveClasses[classId]) return socket.emit('invalid-class');
    
    const role = liveClasses[classId].teacher === socket.id ? 'teacher' : 'student';
    userRoles[socket.id] = role;
    
    liveClasses[classId].students.add(socket.id);
    socket.join(classId);
    
    // Notify all participants about new user
    io.to(classId).emit('participant-joined', socket.id);
    
    // Send existing participants to new user
    const participants = [
      liveClasses[classId].teacher,
      ...Array.from(liveClasses[classId].students)
    ].filter(id => id !== socket.id);
    
    socket.emit('existing-participants', participants);
  });

        socket.on("raise-hand", (classId) => {
            if (userRoles[socket.id] === 'student') {
                liveClasses[classId].handRaised.add(socket.id);
                io.to(liveClasses[classId].teacher).emit('hand-raised', socket.id);
            }
        });

        socket.on("mute-user", (classId, targetId) => {
            if (userRoles[socket.id] === 'teacher') {
                io.to(targetId).emit('force-mute');
            }
        });

        socket.on("start-recording", (classId) => {
            if (userRoles[socket.id] === 'teacher') {
                liveClasses[classId].isRecording = true;
                io.to(classId).emit('recording-started');
            }
        });

        socket.on("end-class", (classId) => {
            if (userRoles[socket.id] === 'teacher') {
                io.to(classId).emit('class-ended');
                delete liveClasses[classId];
            }
        });
        socket.on("offer", ({ targetId, offer }) => {
          io.to(targetId).emit("offer", {
              senderId: socket.id,
              offer,
          });
      });
      
      socket.on("answer", ({ targetId, answer }) => {
          io.to(targetId).emit("answer", {
              senderId: socket.id,
              answer,
          });
      });
      
      socket.on("ice-candidate", ({ targetId, candidate }) => {
          io.to(targetId).emit("ice-candidate", {
              senderId: socket.id,
              candidate,
          });
      });
      

        socket.on("disconnect", () => {
            for (const classId in liveClasses) {
                if (liveClasses[classId].teacher === socket.id) {
                    io.to(classId).emit('class-ended');
                    delete liveClasses[classId];
                } else if (liveClasses[classId].students.has(socket.id)) {
                    liveClasses[classId].students.delete(socket.id);
                    io.to(liveClasses[classId].teacher).emit('student-left', socket.id);
                }
            }
        });
    });

    return io;
};

function generateClassId() {
    return Math.random().toString(36).substr(2, 9);
}
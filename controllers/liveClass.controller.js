export const connectToSocket = (io) => {
  // const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR' | 'STUDENT' }> }
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

    socket.on('whiteboard-draw', data => {
      socket.to(socket.roomId).emit('whiteboard-draw', data);
    });
  
    // Relay offers, answers, and ICE candidates
    socket.on('offer', ({ target, sdp, role }) => {
      io.to(target).emit('offer', { caller: socket.id, sdp, role });
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
  
  }
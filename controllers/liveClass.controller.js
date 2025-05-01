export const connectToSocket = (io) => {
  const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR' | 'STUDENT' }> }

  io.on('connection', socket => {
    console.log(`🟢 Connected: ${socket.id}`);

    // Store user's room for cleanup
    let currentRoomId = null;

    socket.on('disconnect', () => {
      if (currentRoomId && rooms[currentRoomId]) {
        rooms[currentRoomId] = rooms[currentRoomId].filter(u => u.id !== socket.id);
        socket.to(currentRoomId).emit('user-disconnected', socket.id);
        if (rooms[currentRoomId].length === 0) {
          delete rooms[currentRoomId];
        }
      }
      console.log(`🔴 Disconnected: ${socket.id}`);
    });

    socket.on('join-room', (roomId, { role }) => {
      socket.join(roomId);
      currentRoomId = roomId;

      rooms[roomId] = rooms[roomId] || [];
      if (!rooms[roomId].some(u => u.id === socket.id)) {
        rooms[roomId].push({ id: socket.id, role });
      }

      const others = rooms[roomId].filter(u => u.id !== socket.id);
      socket.emit('all-users', others);
      socket.to(roomId).emit('user-joined', { id: socket.id, role });
      console.log(`📦 ${socket.id} joined room ${roomId} as ${role}`);
    });

    // Move these outside join-room
    socket.on('offer', ({ target, sdp }) => {
      io.to(target).emit('offer', { caller: socket.id, sdp });
    });

    socket.on('answer', ({ target, sdp }) => {
      io.to(target).emit('answer', { responder: socket.id, sdp });
    });

    socket.on('ice-candidate', ({ target, candidate }) => {
      io.to(target).emit('ice-candidate', { sender: socket.id, candidate });
    });
  });
};

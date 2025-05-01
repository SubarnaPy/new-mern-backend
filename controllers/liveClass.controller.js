// socket.js
export const connectToSocket = (io) => {
  const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR'|'STUDENT' }> }

  io.on('connection', (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // Clean-up across all rooms when a socket disconnects
    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        const before = rooms[roomId].length;
        rooms[roomId] = rooms[roomId].filter(u => u.id !== socket.id);
        if (rooms[roomId].length !== before) {
          socket.to(roomId).emit('user-disconnected', socket.id);
        }
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
      console.log(`🔴 Socket disconnected: ${socket.id}`);
    });

    socket.on('join-room', (roomId, { role }) => {
      // Avoid duplicates
      rooms[roomId] = rooms[roomId] || [];
      if (!rooms[roomId].some(u => u.id === socket.id)) {
        rooms[roomId].push({ id: socket.id, role });
      }
      socket.role = role;
      socket.join(roomId);

      // Emit list of existing peers (id & role) to the newcomer
      const others = rooms[roomId].filter(u => u.id !== socket.id);
      socket.emit('all-users', others);

      // Notify existing peers of the newcomer
      socket.to(roomId).emit('user-joined', { id: socket.id, role });
      console.log(`Room ${roomId} users:`, rooms[roomId]);

      // Signaling passthrough
      socket.on('offer', ({ target, sdp }) => {
        socket.to(target).emit('offer', { caller: socket.id, sdp });
      });

      socket.on('answer', ({ target, sdp }) => {
        socket.to(target).emit('answer', { responder: socket.id, sdp });
      });

      socket.on('ice-candidate', ({ target, candidate }) => {
        socket.to(target).emit('ice-candidate', {
          sender: socket.id,
          candidate
        });
      });
    });
  });
};

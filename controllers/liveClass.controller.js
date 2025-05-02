export const connectToSocket = (io) => {
  const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR' | 'STUDENT' }> }

  io.on('connection', socket => {
    console.log(`🟢 Connected: ${socket.id}`);

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        rooms[roomId] = rooms[roomId].filter(u => u.id !== socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
      console.log(`🔴 Disconnected: ${socket.id}`);
    });

    socket.on('join-room', (roomId, { role }) => {
      socket.join(roomId);
      rooms[roomId] = rooms[roomId] || [];
      rooms[roomId].push({ id: socket.id, role });

      const others = rooms[roomId].filter(u => u.id !== socket.id);
      socket.emit('all-users', others);
      socket.to(roomId).emit('user-joined', { id: socket.id, role });

      socket.on('offer', ({ target, sdp }) => {
        io.to(target).emit('offer', { caller: socket.id, sdp });
      });

      socket.on('answer', ({ target, sdp }) => {
        io.to(target).emit('answer', { responder: socket.id, sdp });
      });

      socket.on('ice-candidate', ({ target, candidate }) => {
        io.to(target).emit('ice-candidate', {
          sender: socket.id,
          candidate,
        });
      });
    });
  });
};

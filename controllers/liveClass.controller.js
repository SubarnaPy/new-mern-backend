// socket.js
export const connectToSocket = (io) => {
  const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR'|'STUDENT' }> }
  io.on('connection', socket => {
    console.log(`🟢 Connected: ${socket.id}`);
  
    // Always clean up on disconnect (removes from any room)
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
      console.log(`🔴 Disconnected: ${socket.id}`);
    });
  
    // Join‐room handler
    socket.on('join-room', (roomId, { role }) => {
      rooms[roomId] = rooms[roomId] || [];
      // avoid duplicates
      if (!rooms[roomId].some(u => u.id === socket.id)) {
        rooms[roomId].push({ id: socket.id, role });
      }
      socket.role = role;
      socket.join(roomId);
  
      // send newcomer the list of existing peers
      const others = rooms[roomId].filter(u => u.id !== socket.id);
      socket.emit('all-users', others);
  
      // notify existing peers
      socket.to(roomId).emit('user-joined', { id: socket.id, role });
      console.log(`Room ${roomId}:`, rooms[roomId]);
  
      // signaling passthrough
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
}  
export const connectToSocket = (io) => {
  const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR'|'STUDENT' }> }
  // const rooms = {};

  io.on('connection', (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);
  
    socket.on('join-room', (roomId, { role }) => {
      // 1) Add this socket to our in-memory rooms map
      rooms[roomId] = rooms[roomId] || [];
      rooms[roomId].push({ id: socket.id, role });
      socket.role = role;
      socket.join(roomId);
  
      // 2) Emit “all-users” to the newcomer: [ { id, role }, … ]
      const others = rooms[roomId].filter(u => u.id !== socket.id);
      socket.emit('all-users', others);
  
      // 3) Tell everyone else in the room that someone joined
      socket.to(roomId).emit('user-joined', { id: socket.id, role });
  
      // 4) Handle this socket disconnecting
      socket.on('disconnect', () => {
        if (!rooms[roomId]) return;
        rooms[roomId] = rooms[roomId].filter(u => u.id !== socket.id);
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
        socket.to(roomId).emit('user-disconnected', socket.id);
        console.log(`After disconnect, room ${roomId}:`, rooms[roomId]);
      });
  
      // 5) Signaling passthrough
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
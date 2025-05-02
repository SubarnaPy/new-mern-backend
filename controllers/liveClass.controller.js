export const connectToSocket = (io) => {
  // const rooms = {}; // { [roomId]: Array<{ id: string, role: 'INSTRUCTOR' | 'STUDENT' }> }
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
  }
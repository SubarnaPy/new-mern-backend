export const connectToSocket = (io) => {
  const rooms = new Map(); // { roomId: { users: Array, whiteboard: Array, chat: Array } }

  io.on('connection', socket => {
    console.log(`🟢 Connected: ${socket.id}`);
    let currentRoomId = null;

    const getRoomData = (roomId) => {
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          users: [],
          whiteboard: [],
          chat: [],
          screenSharer: null
        });
      }
      return rooms.get(roomId);
    };

    socket.on('disconnect', () => {
      if (currentRoomId) {
        const room = getRoomData(currentRoomId);
        room.users = room.users.filter(u => u.id !== socket.id);
        
        // Clear screen sharing status if sharer leaves
        if (room.screenSharer === socket.id) {
          room.screenSharer = null;
          io.to(currentRoomId).emit('screen-sharing-update', { isSharing: false });
        }

        if (room.users.length === 0) {
          rooms.delete(currentRoomId);
        } else {
          socket.to(currentRoomId).emit('user-disconnected', socket.id);
        }
      }
      console.log(`🔴 Disconnected: ${socket.id}`);
    });

    socket.on('join-room', (roomId, { role }) => {
      socket.join(roomId);
      currentRoomId = roomId;
      
      const room = getRoomData(roomId);
      if (!room.users.some(u => u.id === socket.id)) {
        room.users.push({ id: socket.id, role });
      }

      // Send existing data to new user
      socket.emit('room-data', {
        users: room.users.filter(u => u.id !== socket.id),
        whiteboard: room.whiteboard,
        chat: room.chat,
        screenSharer: room.screenSharer
      });

      socket.to(roomId).emit('user-joined', { id: socket.id, role });
      console.log(`📦 ${socket.id} joined room ${roomId} as ${role}`);
    });

    // WebRTC Signaling
    socket.on('offer', ({ target, sdp }) => {
      io.to(target).emit('offer', { caller: socket.id, sdp });
    });

    socket.on('answer', ({ target, sdp }) => {
      io.to(target).emit('answer', { responder: socket.id, sdp });
    });

    socket.on('ice-candidate', ({ target, candidate }) => {
      io.to(target).emit('ice-candidate', { sender: socket.id, candidate });
    });

    // Chat functionality
    socket.on('send-message', (message) => {
      if (!currentRoomId) return;
      const room = getRoomData(currentRoomId);
      const chatMessage = {
        id: socket.id,
        text: message,
        timestamp: Date.now(),
        role: room.users.find(u => u.id === socket.id).role
      };
      room.chat.push(chatMessage);
      io.to(currentRoomId).emit('receive-message', chatMessage);
    });

    // Whiteboard functionality
    socket.on('whiteboard-draw', (path) => {
      if (!currentRoomId) return;
      const room = getRoomData(currentRoomId);
      room.whiteboard.push(path);
      socket.to(currentRoomId).emit('whiteboard-draw', path);
    });

    socket.on('whiteboard-clear', () => {
      if (!currentRoomId) return;
      const room = getRoomData(currentRoomId);
      room.whiteboard = [];
      io.to(currentRoomId).emit('whiteboard-clear');
    });

    // Screen sharing control
    socket.on('screen-sharing-start', () => {
      if (!currentRoomId) return;
      const room = getRoomData(currentRoomId);
      room.screenSharer = socket.id;
      io.to(currentRoomId).emit('screen-sharing-update', { 
        isSharing: true,
        sharerId: socket.id
      });
    });

    socket.on('screen-sharing-stop', () => {
      if (!currentRoomId) return;
      const room = getRoomData(currentRoomId);
      room.screenSharer = null;
      io.to(currentRoomId).emit('screen-sharing-update', { 
        isSharing: false 
      });
    });

    // Room control
    socket.on('leave-room', () => {
      if (currentRoomId) {
        socket.leave(currentRoomId);
        const room = getRoomData(currentRoomId);
        room.users = room.users.filter(u => u.id !== socket.id);
        
        if (room.users.length === 0) {
          rooms.delete(currentRoomId);
        } else {
          socket.to(currentRoomId).emit('user-disconnected', socket.id);
        }
        currentRoomId = null;
      }
    });
  });
};
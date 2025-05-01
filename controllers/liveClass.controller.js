export const connectToSocket = (io) => {
  const rooms = new Map();

  const getRoomData = (roomId) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Map(), // Use Map for better user management
        whiteboard: [],
        chat: [],
        screenSharer: null,
        deleteTimeout: null
      });
    }
    return rooms.get(roomId);
  };

  io.on('connection', (socket) => {
    let currentRoomId = null;
    const RECONNECT_GRACE_PERIOD = 5000; // 5 seconds

    const handleDisconnect = () => {
      if (currentRoomId) {
        const room = getRoomData(currentRoomId);
        const user = room.users.get(socket.id);
        
        if (user) {
          // Mark user as disconnected but keep in room temporarily
          user.isConnected = false;
          user.disconnectTimer = setTimeout(() => {
            room.users.delete(socket.id);
            io.to(currentRoomId).emit('user-disconnected', socket.id);
            
            if (room.users.size === 0) {
              rooms.delete(currentRoomId);
            }
          }, RECONNECT_GRACE_PERIOD);
        }
      }
    };

    const handleJoinRoom = (roomId, { role }) => {
      const room = getRoomData(roomId);
      const existingUser = room.users.get(socket.id);

      if (existingUser) {
        // User reconnected within grace period
        clearTimeout(existingUser.disconnectTimer);
        existingUser.isConnected = true;
        existingUser.role = role;
      } else {
        // New user connection
        room.users.set(socket.id, {
          id: socket.id,
          role,
          isConnected: true,
          disconnectTimer: null
        });
      }

      // Clear room deletion timeout if exists
      if (room.deleteTimeout) {
        clearTimeout(room.deleteTimeout);
        room.deleteTimeout = null;
      }

      socket.join(roomId);
      currentRoomId = roomId;

      // Send full room state to connecting user
      socket.emit('room-data', {
        users: Array.from(room.users.values()).filter(u => u.isConnected),
        whiteboard: room.whiteboard,
        chat: room.chat,
        screenSharer: room.screenSharer
      });

      // Notify others about user connection
      if (!existingUser) {
        socket.to(roomId).emit('user-joined', { id: socket.id, role });
      } else {
        socket.to(roomId).emit('user-reconnected', socket.id);
      }
    };

    // Event handlers
    socket.on('disconnect', handleDisconnect);
    socket.on('join-room', handleJoinRoom);

    // WebRTC signaling
    socket.on('offer', ({ target, sdp }) => 
      io.to(target).emit('offer', { caller: socket.id, sdp }));
    
    socket.on('answer', ({ target, sdp }) => 
      io.to(target).emit('answer', { responder: socket.id, sdp }));
    
    socket.on('ice-candidate', ({ target, candidate }) => 
      io.to(target).emit('ice-candidate', { sender: socket.id, candidate }));

    // Chat system
    socket.on('send-message', (message) => {
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

    // Whiteboard system
    socket.on('whiteboard-draw', (path) => {
      const room = getRoomData(currentRoomId);
      room.whiteboard.push(path);
      socket.to(currentRoomId).emit('whiteboard-draw', path);
    });

    socket.on('whiteboard-clear', () => {
      const room = getRoomData(currentRoomId);
      room.whiteboard = [];
      io.to(currentRoomId).emit('whiteboard-clear');
    });

    // Screen sharing
    socket.on('screen-sharing-start', () => {
      const room = getRoomData(currentRoomId);
      room.screenSharer = socket.id;
      io.to(currentRoomId).emit('screen-sharing-update', {
        isSharing: true,
        sharerId: socket.id
      });
    });

    socket.on('screen-sharing-stop', () => {
      const room = getRoomData(currentRoomId);
      room.screenSharer = null;
      io.to(currentRoomId).emit('screen-sharing-update', { isSharing: false });
    });
  });
};
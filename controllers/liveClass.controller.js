import shortid from 'shortid';

export const connectToSocket = (io) => {
  const users = {}; // Track users by roomId

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining a room
    socket.on('join-room', (roomId) => {
      if (!users[roomId]) users[roomId] = [];
      users[roomId].push(socket.id);
      socket.join(roomId); // Join the specific room

      const otherUsers = users[roomId].filter(id => id !== socket.id);
      socket.emit('all-users', otherUsers); // Emit the list of other users in the room

      // Notify other users that a new user has joined
      socket.to(roomId).emit('user-joined', socket.id);

      // Handle disconnection
      socket.on('disconnect', () => {
        users[roomId] = users[roomId].filter(id => id !== socket.id);
        if (users[roomId].length === 0) {
          delete users[roomId]; // Clean up the room if no users are left
        }
        socket.to(roomId).emit('user-disconnected', socket.id); // Notify others of the disconnection
      });

      // Handle receiving and emitting offer messages
      socket.on('offer', (data) => {
        socket.to(data.target).emit('offer', {
          sdp: data.sdp,
          caller: socket.id,
        });
      });

      // Handle receiving and emitting answer messages
      socket.on('answer', (data) => {
        socket.to(data.target).emit('answer', {
          sdp: data.sdp,
          responder: socket.id,
        });
      });

      // Handle ICE candidate exchange
      socket.on('ice-candidate', (data) => {
        socket.to(data.target).emit('ice-candidate', {
          candidate: data.candidate,
          sender: socket.id,
        });
      });
    });
  });
};

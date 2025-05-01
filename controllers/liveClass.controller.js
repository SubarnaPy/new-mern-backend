import shortid from 'shortid';

export const connectToSocket = (io) => {
    const users = {};

    io.on('connection', (socket) => {
      socket.on('join-room', (roomId) => {
        if (!users[roomId]) users[roomId] = [];
    
        users[roomId].push(socket.id);
        socket.join(roomId);
    
        const otherUsers = users[roomId].filter(id => id !== socket.id);
        socket.emit('all-users', otherUsers);
    
        socket.to(roomId).emit('user-joined', socket.id);
    
        socket.on('disconnect', () => {
          users[roomId] = users[roomId].filter(id => id !== socket.id);
          socket.to(roomId).emit('user-disconnected', socket.id);
        });
    
        socket.on('offer', (data) => {
          socket.to(data.target).emit('offer', {
            sdp: data.sdp,
            caller: socket.id,
          });
        });
    
        socket.on('answer', (data) => {
          socket.to(data.target).emit('answer', {
            sdp: data.sdp,
            responder: socket.id,
          });
        });
    
        socket.on('ice-candidate', (data) => {
          socket.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            sender: socket.id,
          });
        });
      });
    });
    
};

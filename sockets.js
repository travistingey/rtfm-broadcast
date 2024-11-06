// sockets.js
const videoManager = require('./videoManager');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('A client connected:', socket.id);
        socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
    });
};
// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const sassMiddleware = require('sass-middleware');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Import configurations and modules
const videoManager = require('./videoManager');

videoManager.getVideoList();

const initializeSockets = require('./sockets');
const apiRoutes = require('./routes/api');


// Middleware to serve static files
app.use(express.static('public'));

// Setup routes
app.use('/api', apiRoutes(io));
app.use('/media', require('./routes/media'));

// Initialize sockets
initializeSockets(io);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});

module.exports = io;
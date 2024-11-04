require('dotenv').config();
const express = require('express');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);


// Log the HA_TOKEN to verify it's loaded correctly
console.log('Loaded HA_TOKEN:', process.env.HA_TOKEN);

// Middleware to serve static files
app.use(express.static('public'));

// Configuration
const HA_URL = 'http://homeassistant.local:8123';
const HA_TOKEN = process.env.HA_TOKEN;

let currentVideoIndex = 0;
let videoList = [];

// Load video list at startup
(async function initializeVideoList() {
    try {
        const response = await axios.get(`${HA_URL}/api/states/sensor.rtfm`, {
            headers: {
                'Authorization': `Bearer ${HA_TOKEN}`
            }
        });
        videoList = response.data.attributes.file_list.map(file => file.replace('/media/rtfm/', ''));
    } catch (error) {
        console.error('Error fetching video list:', error);
    }
})();



// Endpoint to proxy media requests dynamically based on file name
app.get('/media/:filename', async (req, res) => {
    const { filename } = req.params;
    const fileUrl = `${HA_URL}/media/local/rtfm/${filename}`;

    try {
        const response = await axios.get(fileUrl, {
            headers: {
                'Authorization': `Bearer ${HA_TOKEN}`
            },
            responseType: 'stream'
        });
        response.data.pipe(res);
    } catch (error) {
        console.error('Error fetching media file:', error);
        res.status(500).send('Error fetching media file');
    }
});


app.post('/api/updateVideoList', async (req, res) => {
    const url = `${HA_URL}/api/states/sensor.rtfm`;
  
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Extract the file list from the sensor's attributes
      videoList = response.data.attributes.file_list.map(file=>file.replace('/media/rtfm/',''));
      res.status(200)
    } catch (error) {
      console.error('Error fetching sensor state:', error);
      res.status(500).send('Error fetching sensor state');
    }
  });
  
// API Endpoints for Playback Commands
app.post('/api/refresh', (req, res) => {
    io.emit('refresh');
    res.sendStatus(200);
});

// API Endpoints for Playback Commands
app.post('/api/play', (req, res) => {
    io.emit('play');
    res.sendStatus(200);
});

app.post('/api/pause', (req, res) => {
    io.emit('pause');
    res.sendStatus(200);
});

app.post('/api/restart', (req, res) => {
    io.emit('restart');
    res.sendStatus(200);
});

app.post('/api/next', (req, res) => {
    currentVideoIndex = (currentVideoIndex + 1) % videoList.length;
    io.emit('load', { file: videoList[currentVideoIndex] });
    res.json({ file: videoList[currentVideoIndex] });

});

app.post('/api/prev', (req, res) => {
    currentVideoIndex = (currentVideoIndex - 1 + videoList.length) % videoList.length;

    io.emit('load', { file: videoList[currentVideoIndex] });
    res.sendStatus(200);
});

// Updated Load Endpoint to accept only the file name
app.post('/api/mute', (req, res) => {
    
        io.emit('mute');
        res.sendStatus(200);
    
});

app.post('/api/unmute', (req, res) => { 
    io.emit('unmute');
    res.sendStatus(200);
});

// Updated Load Endpoint to accept only the file name
app.post('/api/load', express.json(), (req, res) => {
    const { file } = req.body;
    if (file) {
        io.emit('load', { file });
        res.sendStatus(200);
    } else {
        res.status(400).send('File parameter is required');
    }
});

// API Endpoints for Notifications
app.post('/api/notify-overlay', express.json(), (req, res) => {
    const { message } = req.body;
    if (message) {
        io.emit('notify-overlay', { message });
        res.sendStatus(200);
    } else {
        res.status(400).send('Message parameter is required');
    }
});

app.post('/api/notify-fullscreen', express.json(), (req, res) => {
    const { message, duration } = req.body;
    if (message && duration) {
        io.emit('notify-fullscreen', { message, duration });
        res.sendStatus(200);
    } else {
        res.status(400).send('Message and duration parameters are required');
    }
});

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
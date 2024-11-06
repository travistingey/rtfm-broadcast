// api.js
const express = require('express');
const axios = require('axios');
const videoManager = require('../videoManager');
const { HA_URL, HA_TOKEN } = require('../config');

module.exports = function(io) {
    const router = express.Router();

    // Update video list from Home Assistant
    router.post('/updateVideoList', async (req, res) => {
        try {
            const response = await axios.get(`${HA_URL}/api/states/sensor.rtfm`, {
                headers: { Authorization: `Bearer ${HA_TOKEN}` },
            });
            videoManager.updateVideoList(response.data.attributes.file_list);
            res.sendStatus(200);
        } catch (error) {
            console.error('Error fetching video list:', error);
            res.status(500).send('Error fetching video list');
        }
    });

    // Playback Commands
    router.post('/play', (req, res) => {
        io.emit('play');
        res.sendStatus(200);
    });

    router.post('/pause', (req, res) => {
        io.emit('pause');
        res.sendStatus(200);
    });

    router.post('/loop', (req, res) => {
        videoManager.updateStatus({ loop: true });
        io.emit('status-update', videoManager.getStatus());
        res.sendStatus(200);
    });
    
    router.post('/unloop', (req, res) => {
        videoManager.updateStatus({ loop: false });
        io.emit('status-update', videoManager.getStatus());
        res.sendStatus(200);
    });
    

    router.post('/restart', (req, res) => {
        io.emit('restart');
        res.sendStatus(200);
    });

    router.post('/refresh', (req, res) => {
        io.emit('refresh');
        res.sendStatus(200);
    });

    // Next and Previous Commands
    router.post('/next', (req, res) => {
        const file = videoManager.getNextVideo();
        io.emit('notify-overlay', { message: `Up Next: ${file}` });
        io.emit('load', { file });
        
        res.json({ file });
    });

    router.post('/prev', (req, res) => {
        const file = videoManager.getPreviousVideo();
        io.emit('load', { file });
        res.json({ file });
    });

    // Load a specific file by filename
    router.post('/load', express.json(), (req, res) => {
        const { file } = req.body;
        if (file) {
            io.emit('load', { file });
            res.sendStatus(200);
        } else {
            res.status(400).send('File parameter is required');
        }
    });

    // Mute and Unmute Commands
    router.post('/mute', (req, res) => {
        io.emit('mute');
        res.sendStatus(200);
    });

    router.post('/unmute', (req, res) => {
        io.emit('unmute');
        res.sendStatus(200);
    });

    // Notification Commands
    router.post('/notify-overlay', express.json(), (req, res) => {
        const { message } = req.body;
        if (message) {
            io.emit('notify-overlay', { message });
            res.sendStatus(200);
        } else {
            res.status(400).send('Message parameter is required');
        }
    });

    router.post('/notify-fullscreen', express.json(), (req, res) => {
        const { message, duration } = req.body;
        if (message && duration) {
            io.emit('notify-fullscreen', { message, duration });
            res.sendStatus(200);
        } else {
            res.status(400).send('Message and duration parameters are required');
        }
    });

    // Status Endpoints
    // GET /api/status - Retrieve current playback status
    router.get('/status', (req, res) => {
        res.json(videoManager.getStatus());
    });

    // POST /api/status - Update playback status
    // Accepts a JSON body with properties to update
    router.post('/status', express.json(), (req, res) => {
        const updates = req.body;
        if (!updates || typeof updates !== 'object') {
            return res.status(400).send('Invalid status data');
        }

        const hasChanged = videoManager.updateStatus(updates);

        if (hasChanged) {
            // Emit status update to all connected clients
            io.emit('status-update', videoManager.getStatus());
        }

        res.sendStatus(200);
    });

    return router;
};
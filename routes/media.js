const express = require('express');
const axios = require('axios');
const { HA_URL, HA_TOKEN } = require('../config');
const router = express.Router();
const io = require('../server');

router.get('/:filename', async (req, res) => {
    const { filename } = req.params;
    const fileUrl = `${HA_URL}/media/local/rtfm/${filename}`;
    try {
        const response = await axios.get(fileUrl, {
            headers: { Authorization: `Bearer ${HA_TOKEN}` },
            responseType: 'stream',
        });
        response.data.pipe(res);
    } catch (error) {
        console.error('Error fetching media file:', error);
        res.status(500).send('Error fetching media file');
    }
});

module.exports = router;
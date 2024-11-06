// videoManager.js
const axios = require('axios');
const { HA_URL, HA_TOKEN } = require('./config');

let videoList = [];
let currentVideoIndex = 0;

let status = {
    isPlaying: true,
    isMuted: true,
    currentVideo: null,
    currentTime: 0, // in seconds
    duration: 0, // in seconds
    volume: 0, // 0 to 100
    loop: true
};

function updateStatus(data) {
    let hasChanged = false;
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(status, key)) {
            if (status[key] !== data[key]) {
                status[key] = data[key];
                hasChanged = true;
            }
        }
    }
    return hasChanged;
}

function getStatus() {
    return status;
}

async function getVideoList() {
    try {
        const response = await axios.get(`${HA_URL}/api/states/sensor.rtfm`, {
            headers: { Authorization: `Bearer ${HA_TOKEN}` },
        });
        videoList = response.data.attributes.file_list.map(file => file.replace('/media/rtfm/', ''));
        // Initialize currentVideo if not set
        if (!status.currentVideo && videoList.length > 0) {
            status.currentVideo = videoList[0];
        }
    } catch (error) {
        console.error('Error fetching video list:', error);
    }
}

function getNextVideo() {
    if (videoList.length === 0) return null;
    currentVideoIndex = (currentVideoIndex + 1) % videoList.length;
    status.currentVideo = videoList[currentVideoIndex];
    return status.currentVideo;
}

function getPreviousVideo() {
    if (videoList.length === 0) return null;
    currentVideoIndex = (currentVideoIndex - 1 + videoList.length) % videoList.length;
    status.currentVideo = videoList[currentVideoIndex];
    return status.currentVideo;
}

module.exports = {
    updateStatus,
    getStatus,
    getVideoList,
    getNextVideo,
    getPreviousVideo,
};
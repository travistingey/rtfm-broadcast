const socket = io();
let videoList = [];
let currentVideoIndex = 0;
let isMuted = true; // Initialize mute state

// Video Player
const mediaPlayer = document.getElementById('media-player');

// Notifications
const overlayNotification = document.getElementById('overlay-notification');
const overlayMessage = document.getElementById('overlay-message');
const fullscreenNotification = document.getElementById('fullscreen-notification');
const fullscreenMessage = document.getElementById('fullscreen-message');

// Load video list on startup
async function loadVideoList() {
    // try {
    //     const response = await fetch('/list');
    //     const data = await response.json();
    //     videoList = data.files;
    //     console.log('Video list:', videoList); // Debug log
    //     if (videoList.length > 0) {
    //         selectRandomVideo();
    //     } else {
    //         console.warn('Video list is empty');
    //     }
    // } catch (error) {
    //     console.error('Error loading video list:', error);
    // }
}

// Select a random video to play on startup
function selectRandomVideo() {
    currentVideoIndex = Math.floor(Math.random() * videoList.length);
    loadVideo(videoList[currentVideoIndex]);
}

let userInteractionQueued = false; // Track if we need to wait for user interaction

// Load video by file name
function loadVideo(file) {
    mediaPlayer.src = `/media/${file}`;
    mediaPlayer.load();
    mediaPlayer.muted = isMuted; // Ensure the video respects the mute state

    mediaPlayer.play().catch((error) => {
        console.warn('Autoplay failed, waiting for user interaction:', error);

        // If autoplay fails, wait for user interaction to retry
        if (!userInteractionQueued) {
            userInteractionQueued = true;
            document.addEventListener('click', resumeAutoplay);
            document.addEventListener('touchstart', resumeAutoplay);
        }
    });
}

// Resume autoplay after user interaction
function resumeAutoplay() {
    mediaPlayer.play().then(() => {
        console.log('Playback started after user interaction');
    }).catch((error) => {
        console.error('Failed to play video after user interaction:', error);
    });

    // Remove the event listener once it’s used
    document.removeEventListener('click', resumeAutoplay);
    document.removeEventListener('touchstart', resumeAutoplay);
    userInteractionQueued = false;
}

// Next and previous video with wrapping
async function playNextVideo() {
    try {
        const response = await fetch('/next');
        const data = await response.json();
        loadVideo(data.file);
    } catch (error) {
        console.error('Error fetching next video:', error);
    }
}

async function playPrevVideo() {
    try {
        const response = await fetch('/prev');
        const data = await response.json();
        loadVideo(data.file);
    } catch (error) {
        console.error('Error fetching previous video:', error);
    }
}

// Startup logic
document.addEventListener('DOMContentLoaded', loadVideoList);

// Playback Controls
socket.on('play', () => mediaPlayer.play());
socket.on('pause', () => mediaPlayer.pause());
socket.on('restart', () => {
    mediaPlayer.currentTime = 0;
    mediaPlayer.play();
});
socket.on('refresh', () => {
    window.location.reload();
});

socket.on('load', (data) => {
    const { file } = data;
    loadVideo(file);
});

// Mute and Unmute Commands
socket.on('mute', () => {
    isMuted = true;
    mediaPlayer.muted = true;
});

socket.on('unmute', () => {
    isMuted = false;
    mediaPlayer.muted = false;
});

// Notification: Overlay
socket.on('notify-overlay', (data) => {
    const { message } = data;
    overlayMessage.textContent = message;
    overlayNotification.classList.remove('hidden');

    anime({
        targets: '#overlay-notification',
        opacity: [0, 1],
        translateY: [-50, 0],
        duration: 500,
        easing: 'easeOutQuad'
    });

    setTimeout(() => {
        anime({
            targets: '#overlay-notification',
            opacity: [1, 0],
            translateY: [0, -50],
            duration: 500,
            easing: 'easeInQuad',
            complete: () => overlayNotification.classList.add('hidden')
        });
    }, 3000);
});

// Notification: Fullscreen
socket.on('notify-fullscreen', (data) => {
    const { message, duration } = data;
    fullscreenMessage.textContent = message;
    fullscreenNotification.classList.remove('hidden');
    mediaPlayer.pause();

    anime({
        targets: '#fullscreen-notification',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 500,
        easing: 'easeOutBack'
    });

    setTimeout(() => {
        anime({
            targets: '#fullscreen-notification',
            opacity: [1, 0],
            scale: [1, 0.8],
            duration: 500,
            easing: 'easeInBack',
            complete: () => {
                fullscreenNotification.classList.add('hidden');
                mediaPlayer.play();
            }
        });
    }, duration);
});
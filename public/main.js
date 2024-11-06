// public/main.js

// ==========================================================
// Section: Module Imports (if using a module system)
// ==========================================================
// Note: Since this is a client-side script running in the browser,
// module imports are typically handled differently than in Node.js.
// You may need to use ES6 modules or bundlers like Webpack or Browserify.
// For the purpose of this segmentation, we'll indicate where modules
// would be imported if applicable.

// Example:
// import { waitForEvent } from './utils.js';
// import { fetchStatus, applyStatus, updateServerStatus } from './statusManager.js';
// import { loadAndPlayVideo, enqueueVideoLoad, processQueue } from './videoControl.js';
// import { setupSocketHandlers } from './socketHandlers.js';
// import { attachEventListeners } from './eventListeners.js';

// ==========================================================
// Section: Global Variables and DOM Element References
// ==========================================================
// File: globals.js
/**
 * Global variables and references to DOM elements used throughout the script.
 */

const socket = io(); // Socket.IO client instance
let videoList = [];
let currentVideoIndex = 0;
let isMuted = true; // Initialize mute state

let currentVideo = null;   // Currently playing video filename
let loadingVideo = null;   // Video that is currently being loaded

// Playback status object
let status = {
    isPlaying: false,
    isMuted: true,
    currentVideo: null,
    loop: true, // Default to true
};

// Active and Inactive Video Players
const mediaPlayer1 = document.getElementById('media-player-1');
const mediaPlayer2 = document.getElementById('media-player-2');

// Current Active Player Reference
let activePlayer = mediaPlayer1;
let inactivePlayer = mediaPlayer2;

// Notifications
const overlayNotification = document.getElementById('overlay-notification');
const overlayMessage = document.getElementById('overlay-message');
const fullscreenNotification = document.getElementById('fullscreen-notification');
const fullscreenMessage = document.getElementById('fullscreen-message');

// Transition Overlay
const transitionOverlay = document.getElementById('transition-overlay');

// Video Queue
const videoQueue = [];

// Flag to prevent multiple transitions at the same time
let isTransitioning = false;

// ==========================================================
// Section: Utility Functions
// ==========================================================
// File: utils.js
/**
 * Utility functions used throughout the script.
 */

/**
 * Waits for a specified event to be fired on an element.
 * @param {HTMLElement} element - The target element.
 * @param {string} event - The event name to listen for.
 * @returns {Promise} - Resolves when the event is fired.
 */
function waitForEvent(element, event) {
    return new Promise((resolve) => {
        const handler = () => {
            element.removeEventListener(event, handler);
            resolve();
        };
        element.addEventListener(event, handler);
    });
}

// ==========================================================
// Section: Status Management Functions
// ==========================================================
// File: statusManager.js
/**
 * Functions related to fetching and applying playback status.
 */

/**
 * Fetches the current playback status from the server.
 * @param {boolean} apply - Whether to apply the fetched status.
 * @returns {Promise<Object>} - The fetched status object.
 */
async function fetchStatus(apply = true) {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        if (apply) {
            applyStatus(data);
        }
        return data;
    } catch (error) {
        console.error('Error fetching status:', error);
    }
}

/**
 * Applies the given status to the media players and updates local variables.
 * @param {Object} newStatus - The new status object to apply.
 */
function applyStatus(newStatus) {
    // Update the local status object
    Object.assign(status, newStatus);

    // Update mute state
    if (status.isMuted !== isMuted) {
        isMuted = status.isMuted;
        activePlayer.muted = isMuted;
        inactivePlayer.muted = isMuted;
    }

    // Update playback state
    if (status.isPlaying && activePlayer.paused) {
        activePlayer.play().catch((error) => {
            if (error.name !== 'AbortError') {
                console.error('Playback failed:', error);
            }
        });
    } else if (!status.isPlaying && !activePlayer.paused) {
        activePlayer.pause();
    }

    // Update loop state
    if (status.loop !== undefined && status.loop !== activePlayer.loop) {
        activePlayer.loop = status.loop;
        inactivePlayer.loop = status.loop;
        console.log(`Looping is now ${status.loop ? 'enabled' : 'disabled'}`);
    }

    // Load new video if necessary
    if (status.currentVideo) {
        if (status.currentVideo !== currentVideo && status.currentVideo !== loadingVideo) {
            enqueueVideoLoad(status.currentVideo);
        }
    }
}

/**
 * Updates the server with the given status changes.
 * @param {Object} updates - The status updates to send to the server.
 */
async function updateServerStatus(updates) {
    try {
        await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        console.log('Server status updated:', updates);
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// ==========================================================
// Section: Video Control Functions
// ==========================================================
// File: videoControl.js
/**
 * Functions for managing video playback and transitions.
 */

/**
 * Enqueues a video to be loaded and played.
 * @param {string} file - The filename of the video to load.
 */
function enqueueVideoLoad(file) {
    // Avoid enqueuing the same file multiple times or if it's already loaded or loading
    if (file === currentVideo || file === loadingVideo || videoQueue.includes(file)) {
        return;
    }

    videoQueue.push(file);
    processQueue();
}

/**
 * Processes the video queue by loading and playing the next video.
 */
async function processQueue() {
    if (isTransitioning || videoQueue.length === 0) {
        return;
    }

    isTransitioning = true;
    const nextFile = videoQueue.shift();

    try {
        await loadAndPlayVideo(nextFile);
    } catch (error) {
        console.error('Error during video loading:', error);
    } finally {
        isTransitioning = false;
        // Continue processing the queue in case there are more videos
        if (videoQueue.length > 0) {
            processQueue();
        }
    }
}

/**
 * Loads and plays a new video with transitions.
 * @param {string} newFile - The filename of the new video to play.
 * @returns {Promise} - Resolves when the video has started playing.
 */
async function loadAndPlayVideo(newFile) {
    loadingVideo = newFile; // Set loadingVideo

    return new Promise(async (resolve, reject) => {
        console.log(`Loading new video: ${newFile}`);

        try {
            // Preload the new video on the inactive player
            inactivePlayer.src = `/media/${newFile}`;
            inactivePlayer.load();
            console.log(`Preloading new video on inactive player: ${newFile}`);

            // Wait until the inactive player can play through
            await waitForEvent(inactivePlayer, 'canplaythrough');
            console.log('Inactive player can play through');

            // Start fade to black using Anime.js
            await anime({
                targets: transitionOverlay,
                opacity: [0, 1],
                duration: 500,
                easing: 'easeOutQuad'
            }).finished;
            console.log('Transition fade to black completed');

            // Play the new active player
            await inactivePlayer.play();
            console.log('Playing new video on active player');

            // Swap players
            swapPlayers(newFile);
            inactivePlayer.muted = isMuted;

            // Start fade back to transparent using Anime.js
            await anime({
                targets: transitionOverlay,
                opacity: [1, 0],
                duration: 500,
                easing: 'easeInQuad'
            }).finished;
            console.log('Transition fade back to transparent completed');

            loadingVideo = null; // Reset loadingVideo

            resolve();
        } catch (error) {
            console.error('Error during video loading:', error);

            loadingVideo = null; // Reset loadingVideo in case of error

            // Handle errors by fading back to transparent
            await anime({
                targets: transitionOverlay,
                opacity: [1, 0],
                duration: 500,
                easing: 'easeInQuad'
            }).finished;
            console.log('Transition fade back to transparent completed after error');

            resolve(); // Resolve to continue processing
        }
    });
}

/**
 * Swaps the active and inactive video players.
 * @param {string} newFile - The filename of the new video that is now active.
 */
function swapPlayers(newFile) {
    // Hide the previous active player
    activePlayer.style.display = 'none';
    activePlayer.pause();
    activePlayer.currentTime = 0;

    // Show the inactive player
    inactivePlayer.style.display = 'block';

    // Update player references
    [activePlayer, inactivePlayer] = [inactivePlayer, activePlayer];

    // Update currentVideo
    currentVideo = newFile;

    console.log('Swapped active and inactive players');
}

/**
 * Handles the video ended event, advancing to the next video or looping.
 * @param {Event} event - The ended event.
 */
function onVideoEnded(event) {
    if (event.target !== activePlayer) {
        // Ignore ended events from the inactive player
        return;
    }

    if (!status.loop) {
        console.log('Video ended, advancing to next video.');
        playNextVideo();
    } else {
        console.log('Video ended, looping is enabled.');
        activePlayer.play(); // Replay the video
    }
}

/**
 * Plays the next video in the playlist.
 */
async function playNextVideo() {
    try {
        const response = await fetch('/api/next', { method: 'POST' });
        const data = await response.json();
        if (data.file) {
            enqueueVideoLoad(data.file);
            // Update the server status with the new current video
            updateServerStatus({ currentVideo: data.file });
        }
    } catch (error) {
        console.error('Error fetching next video:', error);
    }
}

/**
 * Plays the previous video in the playlist.
 */
async function playPrevVideo() {
    try {
        const response = await fetch('/api/prev', { method: 'POST' });
        const data = await response.json();
        if (data.file) {
            enqueueVideoLoad(data.file);
            // Update the server status with the new current video
            updateServerStatus({ currentVideo: data.file });
        }
    } catch (error) {
        console.error('Error fetching previous video:', error);
    }
}

// ==========================================================
// Section: Socket.IO Event Handlers
// ==========================================================
// File: socketHandlers.js
/**
 * Handlers for events received via Socket.IO.
 */

// Playback Controls
socket.on('play', () => {
    if (isTransitioning) return; // Ignore during transitions
    activePlayer.play().then(() => {
        console.log('Playback started via play command');
        updateServerStatus({ isPlaying: true });
    }).catch((error) => {
        if (error.name !== 'AbortError') {
            console.error('Playback failed via play command:', error);
        }
    });
});

socket.on('pause', () => {
    if (isTransitioning) return; // Ignore during transitions
    activePlayer.pause();
    console.log('Playback paused via pause command');
    updateServerStatus({ isPlaying: false });
});

socket.on('restart', () => {
    if (isTransitioning) return; // Ignore during transitions
    activePlayer.currentTime = 0;
    activePlayer.play().then(() => {
        console.log('Playback restarted');
        updateServerStatus({ isPlaying: true });
    }).catch((error) => {
        if (error.name !== 'AbortError') {
            console.error('Playback failed during restart:', error);
        }
    });
});

socket.on('refresh', () => {
    window.location.reload();
});

socket.on('load', (data) => {
    const { file } = data;
    enqueueVideoLoad(file);
    // No need to update server status here
});

// Mute and Unmute Commands
socket.on('mute', () => {
    if (isTransitioning) return; // Ignore during transitions
    isMuted = true;
    activePlayer.muted = true;
    inactivePlayer.muted = true;
    console.log('Playback muted via mute command');
    updateServerStatus({ isMuted: true });
});

socket.on('unmute', () => {
    if (isTransitioning) return; // Ignore during transitions
    isMuted = false;
    activePlayer.muted = false;
    inactivePlayer.muted = false;
    console.log('Playback unmuted via unmute command');
    updateServerStatus({ isMuted: false });
});

// Handle status updates from the server
socket.on('status-update', (newStatus) => {
    applyStatus(newStatus);
});

// ==========================================================
// Section: Event Listeners
// ==========================================================
// File: eventListeners.js
/**
 * Attaches event listeners to media players and other DOM elements.
 */

// Attach event listeners to both video players
mediaPlayer1.addEventListener('ended', onVideoEnded);
mediaPlayer2.addEventListener('ended', onVideoEnded);

// Optional: Handle mediaPlayer events to update status
mediaPlayer1.addEventListener('play', () => {
    if (!isTransitioning) {
        updateServerStatus({ isPlaying: true });
    }
});

mediaPlayer1.addEventListener('pause', () => {
    if (!isTransitioning) {
        updateServerStatus({ isPlaying: false });
    }
});

mediaPlayer2.addEventListener('play', () => {
    if (!isTransitioning) {
        updateServerStatus({ isPlaying: true });
    }
});

mediaPlayer2.addEventListener('pause', () => {
    if (!isTransitioning) {
        updateServerStatus({ isPlaying: false });
    }
});

// ==========================================================
// Section: Notification Handlers
// ==========================================================
// File: notificationHandlers.js
/**
 * Handles display of overlay and fullscreen notifications.
 */

// Notification: Overlay
socket.on('notify-overlay', (data) => {
    if (isTransitioning) return; // Ignore notifications during transitions

    const { message } = data;
    overlayMessage.textContent = message;
    overlayNotification.classList.remove('hidden');

    anime({
        targets: '#overlay-notification',
        opacity: [0, 1],
        translateY: [100, 0],
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
    if (isTransitioning) return; // Ignore notifications during transitions

    const { message, duration } = data;
    fullscreenMessage.textContent = message;
    fullscreenNotification.classList.remove('hidden');
    activePlayer.pause();

    anime({
        targets: '#fullscreen-notification',
        opacity: [0, 1],
        duration: 0,
        easing: 'easeOutBack'
    });

    setTimeout(() => {
        anime({
            targets: '#fullscreen-notification',
            opacity: [1, 0],
            duration: 500,
            easing: 'easeInBack',
            complete: () => {
                fullscreenNotification.classList.add('hidden');
                activePlayer.play().then(() => {
                    console.log('Playback resumed after fullscreen notification');
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('Playback failed after fullscreen notification:', error);
                    }
                });
            }
        });
    }, duration);
});

// ==========================================================
// Section: Startup Logic
// ==========================================================
// File: main.js (remaining in main script)
/**
 * Initializes the application by fetching the initial status and setting up event listeners.
 */

// Fetch initial status when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchStatus);

// Optionally, set up any additional startup logic here

// ==========================================================
// End of main.js
// ==========================================================
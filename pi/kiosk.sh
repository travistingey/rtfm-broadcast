#!/bin/bash

# Start X server using xinit and openbox, explicitly setting DISPLAY=:0
export DISPLAY=:0
xinit /usr/bin/openbox-session &

# Wait for the X server to initialize
while ! pgrep Xorg > /dev/null; do sleep 1; done

# Re-export DISPLAY for the rest of the commands
export DISPLAY=:0

# Disable screen saver, power management, and screen blanking
xset s off
xset -dpms
xset s noblank

# Launch Chromium in kiosk mode
chromium-browser --kiosk --app=http://localhost:3000 &

# Start the Node server in the background
node /home/admin/broadcast-server/src/index.js &
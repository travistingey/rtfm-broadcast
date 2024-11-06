#!/bin/bash
# sudo startx -- :0
export DISPLAY=:0 

# Disable screen saver, power management, and screen blanking
xset s off
xset s noblank

# Launch Chromium in kiosk mode
chromium-browser --kiosk --incognito http://localhost:3000 --autoplay-policy=no-user-gesture-required --disable-cache


API Documentation

Base URL

http://localhost:3000

1. Play Video

Endpoint: /api/play
Method: POST
Description: Triggers the video to play.

Sample curl Request:

curl -X POST http://localhost:3000/api/play

2. Pause Video

Endpoint: /api/pause
Method: POST
Description: Pauses the currently playing video.

Sample curl Request:

curl -X POST http://localhost:3000/api/pause

3. Restart Video

Endpoint: /api/restart
Method: POST
Description: Restarts the video from the beginning.

Sample curl Request:

curl -X POST http://localhost:3000/api/restart

4. Load New Video

Endpoint: /api/load
Method: POST
Description: Loads a specified video file from the base URL. Only the file name is needed, as the server automatically appends it to the base URL.

Request Body Parameters:

	•	file (string) - The file name of the video to load.

Sample curl Request:

curl -X POST http://localhost:3000/api/load -H "Content-Type: application/json" -d '{"file": "CC501_hypercard.mp4"}'

Example request loads the CC501_hypercard.mp4 video.

5. Get Media File

Endpoint: /media/:filename
Method: GET
Description: Proxies a request for a video file from the Home Assistant media directory. This endpoint streams the video file specified by filename from the Home Assistant server.

URL Parameters:

	•	filename (string) - The file name of the video to retrieve.

Sample curl Request:

curl -X GET http://localhost:3000/media/CC501_hypercard.mp4 -o CC501_hypercard.mp4

Example request downloads the CC501_hypercard.mp4 video from the Home Assistant server.

6. Overlay Notification

Endpoint: /api/notify-overlay
Method: POST
Description: Displays an overlay notification on top of the video.

Request Body Parameters:

	•	message (string) - The message text to display in the overlay.

Sample curl Request:

curl -X POST http://localhost:3000/api/notify-overlay -H "Content-Type: application/json" -d '{"message": "This is an overlay notification."}'

Displays an overlay notification with the text “This is an overlay notification.”

7. Fullscreen Notification

Endpoint: /api/notify-fullscreen
Method: POST
Description: Displays a fullscreen notification that takes over the video for a specified duration.

Request Body Parameters:

	•	message (string) - The message text to display in the fullscreen notification.
	•	duration (integer) - The duration (in milliseconds) for which the fullscreen notification should be displayed.

Sample curl Request:

curl -X POST http://localhost:3000/api/notify-fullscreen -H "Content-Type: application/json" -d '{"message": "This is a fullscreen notification.", "duration": 5000}'

Displays a fullscreen notification with the text “This is a fullscreen notification.” for 5 seconds.

Quick Summary of All Commands

Playback Controls

	•	Play:

curl -X POST http://localhost:3000/api/play


	•	Pause:

curl -X POST http://localhost:3000/api/pause


	•	Restart:

curl -X POST http://localhost:3000/api/restart



Video Loading

	•	Load Video:

curl -X POST http://localhost:3000/api/load -H "Content-Type: application/json" -d '{"file": "CC501_hypercard.mp4"}'



Media File Streaming

	•	Get Media File:

curl -X GET http://localhost:3000/media/CC501_hypercard.mp4 -o CC501_hypercard.mp4



Notifications

	•	Overlay Notification:

curl -X POST http://localhost:3000/api/notify-overlay -H "Content-Type: application/json" -d '{"message": "This is an overlay notification."}'


	•	Fullscreen Notification:

curl -X POST http://localhost:3000/api/notify-fullscreen -H "Content-Type: application/json" -d '{"message": "This is a fullscreen notification.", "duration": 5000}'



These curl commands will help you test each of the API endpoints for video playback and notifications, confirming that the server is working as expected. Let me know if you need further customization or additional endpoints!
### Run server (default PORT = 1410)
`cd server`\
`python server.py`

### Run client 
`cd client`\
`yarn install`\
`yarn start`\

### Simulation steps
- Click Setup button, open browser's console to see connected message.
- Click test button, open cmd of server to see message has been sent.

### Flow of Client
- Connect to socket (RTSP and RTP)
- Send RTSP packet
- Receive RTSP packet 
- Receive RTP packet 
- Decode RTP packet (from byte to img)
- Display img 

import eventlet
import socketio
from random import randint
from VideoStream import VideoStream

sio = socketio.Server(cors_allowed_origins='*')

app = socketio.WSGIApp(sio)

OK_200 = 0
FILE_NOT_FOUND_404 = 1
CON_ERR_500 = 2

SETUP = 'SETUP'
PLAY = 'PLAY'
PAUSE = 'PAUSE'
TEARDOWN = 'TEARDOWN'
FASTFORWARD = 'FASTFORWARD'
BACKWARD = 'BACKWARD'
SWITCH = 'SWITCH'

INIT = 0
READY = 1
PLAYING = 2

class Server:
    def __init__(self, sid):
        self.sid = sid
        self.state = INIT

        self.clientInfo = {}

        self.listMovies = ["movie", "movie1", "movie2"]

        self.status = True
        
    def replyRtsp(self, code, seq):
        if code == OK_200:
            reply = 'RTSP/1.0 200 OK\nCSeq: ' + seq + '\nSession: ' \
                    + str(self.clientInfo['session'])
            #send rtspSocket
            print('recvRTSP'+self.sid)
            sio.emit('recvRTSP'+self.sid,reply)
        
        # Error messages
        elif code == FILE_NOT_FOUND_404:
            print("404 NOT FOUND")
        elif code == CON_ERR_500:
            print("500 CONNECTION ERROR")

    def sendRtp(self, pause = True):
        global state
        if self.status:
            while self.status:
                data = self.clientInfo['videoStream'].nextFrame()
                if data:
                    frameNumber = self.clientInfo['videoStream'].frameNbr()
                    print(frameNumber)
                    try:
                        sio.emit('recvRTP'+self.sid, {'img': data, 'frameNum': frameNumber})
                        sio.sleep(0.04)
                    except:
                        print("Connection Error")
                else:
                    state = INIT
                    sio.emit('recvRTP'+self.sid,{'status':'teardown'})
                    break
        else:
            if pause:
                data = self.clientInfo['videoStream'].getcurrentframe()
                sio.emit('recvRTP'+self.sid,{'status':data})
            else:
                state = INIT
                sio.emit('recvRTP'+self.sid,{'status':'teardown'})

    def serve(self, data):
        request = data.split('\n')
        line1 = request[0].split(' ')
        requestType = line1[0] # Setup/pause/teardown
        
        # Get the media file name
        filename = line1[1]
        
        # Get the RTSP sequence number 
        seq = request[1].split(' ')
        if requestType == SETUP:
            if self.status == False:
                self.status = True
            if self.state == INIT:
                print('process SETUP\n')
                self.clientInfo['videoStream'] = VideoStream(filename)
                self.state = READY
                self.clientInfo['session'] = randint(100000, 999999)

                self.replyRtsp(OK_200, seq[1])
                # Get the RTP/UDP port from the last line
        elif requestType==PLAY:
            if self.state==READY:
                print('process PLAY\n')
                self.status = True
                self.state=PLAYING
                self.replyRtsp(OK_200, seq[1])
                # Create a new thread and start sending RTP packets
                self.sendRtp()
        elif requestType==PAUSE:
            if self.state==PLAYING:
                print('process PAUSE\n')
                self.state = READY
                self.replyRtsp(OK_200, seq[1])
                self.status = False
                self.sendRtp()
        elif requestType==TEARDOWN:
            print('process TEARDOWN\n')
            self.replyRtsp(OK_200, seq[1])
            self.status = False
            self.sendRtp(False)
            return TEARDOWN
        elif requestType==FASTFORWARD:
            print('process FASTFORWARD\n')
            self.clientInfo['videoStream'].fastForward()
            self.replyRtsp(OK_200, seq[1])
        elif requestType==BACKWARD:
            print('process BACKWARD\n')
            self.clientInfo['videoStream'].fastBackward()
            self.replyRtsp(OK_200, seq[1])
        elif requestType==SWITCH:
            print('process SWITCH\n')
            self.state = READY
            self.clientInfo['videoStream'] = VideoStream(filename)
            self.replyRtsp(OK_200, seq[1])

servers = {}

@sio.on('RTSP')
def recvRtspRequest(sid, data):
    print("=============================SID=============================")
    print(sid)
    
    if sid not in servers.keys():
        servers[sid] = Server(sid)
    print("Total number of working servers ", len(servers))
    status = servers[sid].serve(data)
    if status==TEARDOWN:
        servers.pop(sid)
    
if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('127.0.0.1', 1410)), app)
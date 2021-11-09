import eventlet
import socketio
from random import randint
from VideoStream import VideoStream
from RtpPacket import RtpPacket



sio = socketio.Server(cors_allowed_origins='*')

app = socketio.WSGIApp(sio)

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
state = INIT

OK_200 = 0
FILE_NOT_FOUND_404 = 1
CON_ERR_500 = 2

clientInfo = {}

listMovies = ["movie", "movie1", "movie2"]

@sio.on('RTSP')
def recvRtspRequest(sid, data):
    global state
    print(data)
    request = data.split('\n')
    line1 = request[0].split(' ')
    requestType = line1[0] # Setup/pause/teardown
    
    # Get the media file name
    filename = line1[1]
    
    # Get the RTSP sequence number 
    seq = request[1].split(' ')
    if requestType == SETUP:
        if state == INIT:
            print('process SETUP\n')
            clientInfo['videoStream'] = VideoStream(filename)
            state = READY
            clientInfo['session'] = randint(100000, 999999)

            replyRtsp(OK_200, seq[1])
            # Get the RTP/UDP port from the last line
    elif requestType==PLAY:
        if state==READY:
            print('process PLAY\n')
            state=PLAYING
            replyRtsp(OK_200, seq[1])
            print('sent RSTP')
            # Create a new thread and start sending RTP packets
            sendRtp()
    elif requestType==PAUSE:
        if state==PLAYING:
            print('process PAUSE\n')
            state = READY
            replyRtsp(OK_200, seq[1])
            sendRtp(False)
    elif requestType==TEARDOWN:
        print('process TEARDOWN\n')
        replyRtsp(OK_200, seq[1])
        sendRtp(False, False)
    elif requestType==FASTFORWARD:
        print('process FASTFORWARD\n')
        clientInfo['videoStream'].fastForward()
        replyRtsp(OK_200, seq[1])
    elif requestType==BACKWARD:
        print('process BACKWARD\n')
        clientInfo['videoStream'].fastBackward()
        replyRtsp(OK_200, seq[1])
    elif requestType==SWITCH:
        print('process SWITCH\n')
        state = READY
        clientInfo['videoStream'] = VideoStream(filename)
        state = READY
        replyRtsp(OK_200, seq[1])


def replyRtsp(code, seq):
    if code == OK_200:
        reply = 'RTSP/1.0 200 OK\nCSeq: ' + seq + '\nSession: ' + str(clientInfo['session'])
        #send rtspSocket
        sio.emit('recvRTSP',reply)
    
    # Error messages
    elif code == FILE_NOT_FOUND_404:
        print("404 NOT FOUND")
    elif code == CON_ERR_500:
        print("500 CONNECTION ERROR")

def sendRtp(status=True, pause = True):
    if status:
        count = 1
        while status:
            print(count)
            count+=1
            data = clientInfo['videoStream'].nextFrame()
            if data:
                frameNumber = clientInfo['videoStream'].frameNbr()
                try:
                    sio.emit('recvRTP', {'img': data, 'frameNum': frameNumber});
                except:
                    print("Connection Error")
            else:
                sio.emit('recvRTP',{'status':'teardown'})
            if count==500:
                print('du 500')
                break
    else:
        if pause:
            sio.emit('recvRTP',{'status':'pause'})
        else:
            sio.emit('recvRTP',{'status':'teardown'})



# @sio.on('msg')
# def message(sid, data):
#     print('message ', data)

# @sio.on('disconnect')
# def disconnect(sid):
#     print('disconnect ', sid)

if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('127.0.0.1', 1410)), app)
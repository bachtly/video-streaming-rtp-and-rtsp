import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import {Box, Button} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FastForwardIcon from '@mui/icons-material/FastForward'
import FastRewindIcon from '@mui/icons-material/FastRewind'
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';

const INIT = 0
const READY = 1
const PLAYING = 2
const SETUP = 0
const PLAY = 1
const PAUSE = 2
const TEARDOWN = 3
const FASTFORWARD = 4
const BACKWARD = 5

// const serverAddr = 'localhost';
// const serverPort = 3000;
const rtpPort = 2
const filename = 'movie.Mjpeg'

var rtspSeq = 0;
var sessionId = 0;
var requestSent = -1;
var teardownAcked = 0;
var frameNbr = 0;

var socket = '';

function HomePage() {
	const [state, setState] = useState(INIT);
	const [settingUp, setSettingUp] = useState(true);

	useEffect(() => {
		// console.log("Use effect setting up")
		if (settingUp===false) {
			playMovie();
		}
	}, [settingUp])

	const exitClient = () => {
		sendRtspRequest(TEARDOWN);
	}

	const pauseMovie = () => {
		if(state === PLAYING) {
			sendRtspRequest(PAUSE);
		}
	}

	const playMovie = () => {
		if (state === INIT) {
			// connect to socket at 127.0.0.1:1410
			socket = io('ws://127.0.0.1:1410')
			socket.on("connect", () => {
				recvRtspReply();
				listenRtp();
			});
			sendRtspRequest(SETUP);
			setSettingUp(true);
		}
		if (state === READY) {
			sendRtspRequest(PLAY);
		}
	}

	const fastForward= () => {
		if (state!==INIT){
			sendRtspRequest(FASTFORWARD);
		}
	}

	const fastBackward= () => {
		if(state!==INIT){
			sendRtspRequest(BACKWARD);
		}
	}


	const listenRtp = () => {
		socket.on('recvRTP'+socket.id, function(data){
				var count = Object.keys(data).length;
				if(count===1){
					if(typeof data.status==="string"){
						var img = 'end.png';//link image when teardown
						setImgSrc(img);
						sessionId = 0;
						requestSent = -1;
						teardownAcked = 0;
						frameNbr = 0;
						// state = INIT;
						setState(INIT)
					}else{
						var img = data.status;
						var base64String = arrayBufferToBase64(img);
						setImgSrc('data:image/png;base64,'+ base64String);
					}
				}else{
					var currFrameNbr = parseInt(data.frameNum);
					frameNbr = currFrameNbr;
					var img = data.img;
					var base64String = arrayBufferToBase64(img);
					setImgSrc('data:image/png;base64,'+ base64String);
					// console.log(frameNbr);
					//Show image on web
				}
			})
	}

	const arrayBufferToBase64 = ( buffer ) => {
		var binary = '';
		var bytes = new Uint8Array( buffer );
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] );
		}
		return window.btoa( binary );
	}

	const sendRtspRequest = (requestCode) =>{
		// console.log(requestCode,state);
		var request = "";
		if (requestCode===SETUP && state===INIT) {
			rtspSeq+=1;
			request = 'SETUP ' + filename +  ' RTSP/1.0\nCSeq: ' + String(rtspSeq) + '\nTransport: RTP/UDP; client_port= ' + String(rtpPort);
			requestSent  = SETUP;
		}else if (requestCode===PLAY && state===READY) {
			rtspSeq+=1;
			request = 'PLAY ' + filename + ' RTSP/1.0\nCSeq: ' + String(rtspSeq) + '\nSession: ' + String(sessionId);
			requestSent=PLAY;
		}else if(requestCode===PAUSE && state===PLAYING){
			rtspSeq+=1;
			request = 'PAUSE ' + filename + ' RTSP/1.0\nCSeq: ' + String(rtspSeq) + '\nSession: ' + String(sessionId);
			requestSent=PAUSE;
		}else if(requestCode===TEARDOWN && state!==INIT){
			rtspSeq+=1;
			request = 'TEARDOWN ' + filename + ' RTSP/1.0\nCSeq: ' + String(rtspSeq) + '\nSession: ' + String(sessionId);
			requestSent=TEARDOWN;
		}else if(requestCode===FASTFORWARD){
			rtspSeq+=1;
			request = 'FASTFORWARD ' + filename + ' RTSP/1.0\nCSeq: ' + String(rtspSeq) + '\nSession: ' + String(sessionId);
			requestSent=FASTFORWARD;
		}else if(requestCode===BACKWARD){
			rtspSeq+=1;
			request = 'BACKWARD ' + filename + ' RTSP/1.0\nCSeq: ' + String(rtspSeq) + '\nSession: ' + String(sessionId);
			requestSent=BACKWARD;
		}else{
			return;
		}
		socket.emit('RTSP',request);
		
	}

	const recvRtspReply=()=>{
		socket.on('recvRTSP' + socket.id,function(reply){
			var data = reply;
			if (data!==''){
				var lines = data.split('\n')
				var seqNum = parseInt(lines[1].split(' ')[1])
				if (seqNum===rtspSeq){
					var session = parseInt(lines[2].split(' ')[1]);
					if (sessionId===0){
						sessionId = session;
					}
					if (sessionId===session){
						if (parseInt(lines[0].split(' ')[1])===200){
							if (requestSent===SETUP){
								setState(READY)
								setSettingUp(false);
							}else if(requestSent===PLAY){
								setState(PLAYING)
							}else if(requestSent===PAUSE){
								setState(READY)
							}else if (requestSent===TEARDOWN){
								setState(INIT)
								teardownAcked = 1;
							}
						}
					}

				}
			}	
		})
	}


	const [imgSrc, setImgSrc] = useState('start.png');
  
	return (
		<Box sx={{display:'flex', justifyContent: 'center', flexDirection: 'column'}}>
			<Box sx={{
				justifyContent: 'center', display:'flex', 
				py: 2, fontSize:'32px', fontWeight: 700,
				backgroundColor: '#ededed'
			}}>
				Video Streaming
			</Box>
			<Box sx={{justifyContent: 'center', display:'flex', mt: 5}}>
				<Box id="inner-wrapper" 
					sx={{
						display:'flex', 
						justifyContent: 'space-between',
						flexDirection:'column', width: 500,
						border: '5px solid grey',
						backgroundColor: '#000'
					}}
				>
					
					<Box sx={{
						justifyContent: 'center', display:'flex', height: 400,
						backgroundImage: imgSrc
					}}>
						<img src={imgSrc} alt='Video' 
							style={{maxHeight: '100%', maxWidth: '100%', p: 'auto', objectFit: 'contain'}}
						/>
					</Box>

					<Box sx={{
						justifyContent: 'center', display:'flex',
						backgroundColor: '#ededed'
					}}>
						<Box sx={{display:'flex'}}>
							<Button onClick={fastBackward}>
								<FastRewindIcon  sx={{fontSize: 35}}/>
							</Button>
						</Box>
						<Box sx={{display:'flex',}}>
							<Button onClick={playMovie} sx={{
								verticalAlign: 'center',
								display: state===PLAYING? 'none': ''
							}}>
								<PlayArrowIcon  sx={{fontSize: 35}}/>
							</Button>
							
						</Box>
						<Box sx={{display:'flex'}}>
							<Button onClick={pauseMovie} sx={{display: state===PLAYING? '':'none'}}>
								<PauseIcon  sx={{fontSize: 35}}/>
							</Button>
						</Box>
						<Box sx={{display:'flex'}}>
							<Button onClick={fastForward}>
								<FastForwardIcon  sx={{fontSize: 35}}/>
							</Button>
						</Box>
						<Box sx={{display:'flex'}}>
							<Button onClick={exitClient}>
								<StopIcon  sx={{fontSize: 35}}/>
							</Button>
						</Box>
						
					</Box>
				</Box>
			</Box>
		</Box>
	)
}

export default HomePage

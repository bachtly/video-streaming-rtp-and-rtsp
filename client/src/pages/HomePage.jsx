import React, { useState } from 'react'
import io from 'socket.io-client'
import {Box} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FastForwardIcon from '@mui/icons-material/FastForward'
import FastRewindIcon from '@mui/icons-material/FastRewind'
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';

function HomePage() {
	const INIT = 0;
	const READY = 1;
	const PLAYING = 2;
	var state = INIT;
	const SETUP = 0;
	const PLAY = 1;
	const PAUSE = 2;
	const TEARDOWN = 3;
	const FASTFORWARD = 4;
	const BACKWARD = 5;
	const SWITCH = 6;

	const serverAddr = 'localhost';
	const serverPort = 3000;
	const rtpPort = 2;
	const filename = 'movie.Mjpeg';

	var rtspSeq = 0;
	var sessionId = 0;
	var requestSent = -1;
	var teardownAcked = 0;
	var frameNbr = 0;

	var socket = io.connect('ws://127.0.0.1:1410')

	// connectToServer();

	// const connectToServer= () => {
	// 	socket = io.connect('ws://127.0.0.1:1410')
	// }

	const setupMovie = () => {
		
		if (state === INIT) {
			sendRtspRequest(SETUP);
		}

	}


	const exitClient = () => {
		sendRtspRequest(TEARDOWN);
	}

	const pauseMovie = () => {
		if(state === PLAYING) {
			sendRtspRequest(PAUSE);
		}
	}

	const playMovie = () => {
		// setupMovie();
		sendRtspRequest(PLAY);
		if (state === READY) {
			listenRtp();
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

	const switchMovie= () => {
		if(state===INIT){
			sendRtspRequest(SWITCH);
		}
	}

	const listenRtp= () => {
		socket.on('recvRTP', function(data){
			var count = Object.keys(data).length;
			if(count===1){
				if(data.status==='pause'){
					var img = '';//source img
				}else{
					var img = '';//link image when teardown
				}
			}else{
				var currFrameNbr = parseInt(data.frameNum);
				frameNbr = currFrameNbr;
				var img = data.img;
				console.log(img);
				console.log(frameNbr);
				//Show image on web
			}
		})
	}

	const sendRtspRequest = (requestCode) =>{
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
		console.log('\nData sent:\n' + request);
		recvRtspReply();
	}

	const recvRtspReply=()=>{
		socket.on('recvRTSP',function(reply){
			console.log('Request message\n'+ reply)
			var data = reply;
			if (reply!==''){
				var lines = data.split('\n')
				var seqNum = parseInt(lines[1].split(' ')[1])
				if (seqNum===rtspSeq){
					var session = parseInt(lines[2].split(' ')[1]);
					if (sessionId==0){
						sessionId = session;
					}
					if (sessionId==session){
						if (parseInt(lines[0].split(' ')[1])===200){
							if (requestSent===SETUP){
								state=READY;
								//open port
							}else if(requestSent===PLAYING){
								state=PLAYING;
								openRtpPort();
							}else if(requestSent===PAUSE){
								state = READY;
								//The play thread exit
							}else if(requestSent===SWITCH){
								state = READY;
								//The play thread exit
							}else if (requestSent===TEARDOWN){
								state = INIT;
								teardownAcked = 1;
							}
						}
					}

				}
			}	
			console.log(String(state))
		})
	}

	const openRtpPort= ()=>{
		socket.emit('RTP', 'Open RTPport');
		listenRtp();
	}

	const [imgSrc, setImgSrc] = useState('');
	const [isPlay, setIsPlay] = useState(false);

	const handleOnClickPlaybtn = () => {
		
		// if (isPlay) {
		// 	pauseMovie();
		// }else{
		// 	playMovie();
		// }
		setIsPlay(!isPlay);

	}
  
	return (
		<Box>
			<Box sx={{justifyContent: 'center', display:'flex'}}>HomePage</Box>
			<Box sx={{justifyContent: 'center', display:'flex'}}>
				<img src={imgSrc} alt='Video'/>
			</Box>
			<Box sx={{justifyContent: 'center', display:'flex'}}>
				<Box if="backward" onClick={pauseMovie}><FastRewindIcon/></Box>
				<Box id="playbtn" onClick={handleOnClickPlaybtn}>{
					isPlay? <PauseIcon/> : <PlayArrowIcon/>
				}</Box>
				<Box id ="forward" onClick={playMovie}><FastForwardIcon/></Box>
				<Box id="exit" onClick={setupMovie}><StopIcon/></Box>
			</Box>
		</Box>
	)
}

export default HomePage

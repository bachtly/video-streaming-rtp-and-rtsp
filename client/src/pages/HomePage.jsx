import React, { useState } from 'react'
import io from 'socket.io-client'
import {Box} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FastForwardIcon from '@mui/icons-material/FastForward'
import FastRewindIcon from '@mui/icons-material/FastRewind'
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';

function HomePage() {
	// var arr_b = new ArrayBuffer(16);
	// var arr = new Int8Array(arr_b);
	// arr[0]=1; arr[1]=1; arr[4]=1; arr[5]=1;
	// console.log(arr);

	// var arr_s = arr.slice(0,4);
	// console.log(arr_s);	
	// console.log(arr_s.length);	

	// var socket = '';
	// // Sends a message to the server via sockets
	// const setup = () => {
	// 	socket = io.connect('ws://127.0.0.1:1410')
	// 	socket.on('connect',function() {
	// 		console.log('Client has connected to the server!');
	// 	});

	// 	socket.on('msg',function(data) {
	// 		console.log('Received a message from the server!',data);
	// 	});

	// 	socket.on('disconnect',function() {
	// 		console.log('The client has disconnected!');
	// 	});
	// 	console.log('In setup');
	// 	socket.emit('msg','Setup send');
	// };
	// const test = () => {
	// 	console.log('In test');
	// 	socket.send('msg','Test send');
	// };

	const [imgSrc, setImgSrc] = useState('');
	const [isPlay, setIsPlay] = useState(false);

	const handleOnClickPlaybtn = () => {
		setIsPlay(!isPlay);
	}
  
	return (
		<Box>
			<Box sx={{justifyContent: 'center', display:'flex'}}>HomePage</Box>
			<Box sx={{justifyContent: 'center', display:'flex'}}>
				<img src={imgSrc} alt='Video'/>
			</Box>
			<Box sx={{justifyContent: 'center', display:'flex'}}>
				<Box><FastRewindIcon/></Box>
				<Box id="playbtn" onClick={handleOnClickPlaybtn}>{
					isPlay? <PauseIcon/> : <PlayArrowIcon/>
				}</Box>
				<Box><FastForwardIcon/></Box>
				<Box><StopIcon/></Box>
			</Box>
		</Box>
	)
}

export default HomePage

import React from 'react'
import io from 'socket.io-client';

function HomePage() {

	var socket = '';
	

	// Sends a message to the server via sockets
	const setup = () => {
		socket = io.connect('ws://127.0.0.1:1410')
		socket.on('connect',function() {
			console.log('Client has connected to the server!');
		});

		socket.on('msg',function(data) {
			console.log('Received a message from the server!',data);
		});

		socket.on('disconnect',function() {
			console.log('The client has disconnected!');
		});
		console.log('In setup');
		socket.emit('msg','Setup send');
	};
	const test = () => {
		console.log('In test');
		socket.send('msg','Test send');
	};

	return (
		<div>
				<h1>HomePage</h1>
				
				<button onClick={setup} style={{width: 100, height: 30}}>SETUP</button>
				<button onClick={test} style={{width: 100, height: 30}}>RUN</button>
		</div>
	)
}

export default HomePage

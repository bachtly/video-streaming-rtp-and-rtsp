import sys

import asyncio
import websocket
import socket, socketio
import threading

from ServerWorker import ServerWorker

class Server:	
	def __init__(self):
		self.rtspSocket = ''
		self.connection = ''
		self.address = ''

	async def WebSocketserver(websocket, path):
		print("Console websocket ", websocket)
		print("Console path ", path)
		Rxdata = await websocket.recv()
		print(f" Received data : {Rxdata}")
		await websocket.send("200")
	
	def recvRtspRequest(self):
		while True:         
			print("Waiting for data.")   
			data = self.connection.recv(256)
			if data:
				print("Data received:\n" + data.decode("utf-8"))

	def main(self, port):
		try:
			SERVER_PORT = int(port)
			print("Successfully deployed on port ", port)
		except:
			print("[Usage: Server.py Server_port]\n")
		self.rtspSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.rtspSocket.bind(('', SERVER_PORT))
		self.rtspSocket.listen(5)      
		self.connection, self.address = self.rtspSocket.accept()
		
		threading.Thread(target=self.recvRtspRequest).start()

		# start_server = socket.serve(Server.WebSocketserver, '127.0.0.1', SERVER_PORT, ping_interval=None)
		# asyncio.get_event_loop().run_until_complete(start_server)
		# asyncio.get_event_loop().run_forever()

		### Receive client info (address,port) through RTSP/TCP session
		# while True:
		# 	clientInfo = {}
		# 	clientInfo['rtspSocket'] = rtspSocket.accept()
		# 	ServerWorker(clientInfo).run()		

if __name__ == "__main__":
	(Server()).main(sys.argv[1])



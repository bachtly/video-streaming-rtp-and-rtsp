from flask import Flask, request, jsonify
import sys
sys.path.append('./src/')

from src.RtpPacket import RtpPacket
from src.Server import Server
from src.ServerWorker import ServerWorker
from src.VideoStream import VideoStream

app = Flask(__name__)


@app.route("/")
def index():
    return "Congratulations, it's a web app!"

if __name__ == "__main__":
    # For debugging purpose
    app.run(host='0.0.0.0', port=9999, debug=True)
    Server.main(9999)
    # For production
    # serve(app, host='0.0.0.0', port=9099)

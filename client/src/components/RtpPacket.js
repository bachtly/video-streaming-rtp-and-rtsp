export default class RtpPacket {

    HEADER_SIZE = 12;
	header = new Int8Array(new ArrayBuffer(this.HEADER_SIZE));
	
	constructor() {}
		
	encode() {}
		
	decode(byteStream) {
		// """Decode the RTP packet."""
		self.header = byteStream.slice(0, HEADER_SIZE);
		self.payload = byteStream.slice(HEADER_SIZE, byteStream.length);
    }
	
	version() {
		// """Return RTP version."""
		// return int(self.header[0] >> 6)
    }
	
	seqNum() {
		// """Return sequence (frame) number."""
		seqNum = self.header[2] << 8 | self.header[3]
		return parseInt(seqNum)
    }
	
	timestamp() {
		// """Return timestamp."""
		// timestamp = self.header[4] << 24 | self.header[5] << 16 | self.header[6] << 8 | self.header[7]
		// return parseInt(timestamp)
    }
	
	payloadType() {
		// """Return payload type."""
		// pt = self.header[1] & 127
		// return int(pt)
    }
	
	getPayload() {
		// """Return payload."""
		return self.payload
    }
		
	getPacket() {
		// """Return RTP packet."""
		// return self.header + self.payload
    }
}	
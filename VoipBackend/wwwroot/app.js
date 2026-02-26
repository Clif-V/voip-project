const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");
const volumeLevel = document.getElementById("volumeLevel");

let localStream;
let audioContext;
let analyser;
let dataArray;
let animationFrameId = null;
let transport = null;

const transportMode = "p2p"; // or "sfu"

class MediaTransport {
    async initialize(localStream) {}
    async handleOffer(data) {}
    async handleAnswer(data) {}
    async handleIceCandidate(data) {}
    async close() {}
}

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/signal")
    .withAutomaticReconnect()
    .build();

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const micOffBtn = document.getElementById("micOffBtn");
const startCallBtn = document.getElementById("startCallBtn");

const roomId = "test-room";

connection.on("ReceiveOffer", async offer => {
    if (!transport) {
        transport = createTransport("p2p", connection, roomId);
        await transport.initialize(localStream);
    }

    console.log("Received offer");
    await transport.handleOffer(offer);
});

connection.on("ReceiveAnswer", async answer => {
    console.log("Received answer");
    await transport.handleAnswer(answer);
});

connection.on("ReceiveIceCandidate", async candidate => {
    await transport.handleIceCandidate(candidate);
});

class P2PTransport extends MediaTransport {
    constructor(connection, roomId) {
        super();
        this.connection = connection;
        this.roomId = roomId;
        this.peerConnection = null;
    }


    async initialize(localStream) {

        // 1️⃣ CREATE peerConnection FIRST
        this.peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        // 2️⃣ THEN attach handlers
        this.peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", this.peerConnection.connectionState);
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE state:", this.peerConnection.iceConnectionState);
        };

        // 3️⃣ THEN add tracks
        localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, localStream);
        });

        // 4️⃣ THEN ICE handler
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.connection.invoke("SendIceCandidate", this.roomId, event.candidate);
            }
        };

        // 5️⃣ THEN remote track
        this.peerConnection.ontrack = (event) => {
            const audio = document.getElementById("remoteAudio");
            audio.srcObject = event.streams[0];
        };
    }
    

    async createAndSendOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        await this.connection.invoke("SendOffer", this.roomId, offer);
    }

    async handleOffer(offer) {
        await this.peerConnection.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        await this.connection.invoke("SendAnswer", this.roomId, answer);
    }

    async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(answer);
    }

    async handleIceCandidate(candidate) {
        await this.peerConnection.addIceCandidate(candidate);
    }

    async close() {
        this.peerConnection?.close();
    }
}

startCallBtn.addEventListener("click", async () => {
    if (!localStream) {
        alert("Enable microphone first");
        return;
    }

    transport = createTransport("p2p", connection, roomId);
    await transport.initialize(localStream);

    // Important: only one peer should create offer
    await transport.createAndSendOffer();
});

// Placeholder for SFU transport - not implemented yet
class SFUTransport extends MediaTransport {
    async initialize(localStream) {
        console.log("SFU mode not implemented yet");
    }
}

function createTransport(mode, connection, roomId) {
    if (mode === "p2p") {
        return new P2PTransport(connection, roomId);
    }

    if (mode === "sfu") {
        return new SFUTransport(connection, roomId);
    }
}

connectBtn.addEventListener("click", async () => {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
        await connection.start();
        console.log("Connected to signaling server");

        await connection.invoke("JoinRoom", roomId);
        console.log("Joined room");
    } else {
        console.log("Already connected");
    }
});

disconnectBtn.addEventListener("click", async () => {
    if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
        console.log("Disconnected from signaling server");
    } else {
        console.log("Already disconnected");
    }
});

micBtn.addEventListener("click", async () => {
    if (localStream) {
        console.log("Mic already active");
        return;
    }

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStatus.textContent = "Mic: Access granted";

        setupAudioAnalysis(localStream);
    } catch (err) {
        micStatus.textContent = "Mic: Access denied";
        console.error("Microphone error:", err);
    }
});

micOffBtn.addEventListener("click", () => {
    stopMicrophone();
});

function setupAudioAnalysis(stream) {
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    detectVolume();
}

function stopMicrophone() {
    if (!localStream) {
        console.log("Mic not active");
        return;
    }

    // Cancel animation loop FIRST
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Stop tracks
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;

    // Close audio context
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    analyser = null;
    dataArray = null;

    micStatus.textContent = "Mic: Disabled";
    volumeLevel.textContent = "Volume: 0";

    console.log("Microphone stopped");
}

function detectVolume() {
    if (!analyser){
        console.log("No analyser available, mic is off.");
            return;
    }

    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }

    const average = Math.floor(sum / dataArray.length);
    volumeLevel.textContent = "Volume: " + average;

    requestAnimationFrame(detectVolume);
}
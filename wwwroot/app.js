const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");
const volumeLevel = document.getElementById("volumeLevel");

let localStream;
let audioContext;
let analyser;
let dataArray;
let animationFrameId = null;
let transport = null;
let isMuted = false;
let appState = "disconnected";
const userID = crypto.randomUUID();

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
const micToggle = document.getElementById("micToggle");

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

connection.on("UserMuteChanged", (connectionId, isMuted) => {
    console.log("User mute changed:", connectionId, isMuted);

    const indicator = document.getElementById("remoteMuteIndicator");

    if (isMuted) {
        indicator.textContent = "Remote user is muted";
    } else {
        indicator.textContent = "Remote user is speaking";
    }
});

class P2PTransport extends MediaTransport {
    constructor(connection, roomId) {
        super();
        this.connection = connection;
        this.roomId = roomId;
        this.peerConnection = null;
    }


    async initialize(localStream) {

        // creates peerConnection
        this.peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        // attaches handlers
        this.peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", this.peerConnection.connectionState);
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE state:", this.peerConnection.iceConnectionState);
        };

        // adds local tracks
        localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, localStream);
        });

        // ICE handler
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.connection.invoke("SendIceCandidate", this.roomId, event.candidate);
            }
        };

        // remote track
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
    switch (appState) {

        case "disconnected":
            await startConnection();
            break;

        case "connected":
            await startCall();
            break;

        case "in-call":
            await endCall();
            break;
    }

    updateUI();
});

disconnectBtn.addEventListener("click", async () => {
    if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
        console.log("Disconnected from signaling server");
    }

    if (transport) {
        await transport.close();
        transport = null;
        console.log("Closed WebRTC transport");
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        console.log("Stopped local stream");
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

micToggle.addEventListener("click", () => {
    toggleMicrophoneMute();

});

function setupAudioAnalysis(stream) {
    audioContext = new AudioContext();

    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Mute the output to avoid feedback

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);

    detectVolume();
}

async function startConnection() {
    await connection.start();
    console.log("Connected to signaling server");

    await connection.invoke("JoinRoom", roomId);
    console.log("Joined room");

    appState = "connected";
}

async function startCall() {
    if (!localStream) {
        alert("Enable microphone first");
        return;
    }

    transport = createTransport("p2p", connection, roomId);
    await transport.initialize(localStream);

    await transport.createAndSendOffer();

    appState = "in-call";
}

async function endCall() {
    if (transport) {
        await transport.close();
        transport = null;
    }

    appState = "connected";
}

async function disconnectCompletely() {
    await connection.invoke("LeaveRoom", roomId);
    await connection.stop();

    if (transport) {
        await transport.close();
        transport = null;
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    appState = "disconnected";
}

function updateUI() {
    switch (appState) {
        case "disconnected":
            connectBtn.textContent = "Connect";
            break;
        case "connected":
            connectBtn.textContent = "Start Call";
            break;
        case "in-call":
            connectBtn.textContent = "End Call";
            break;
    }
}

function getCurrentMuteState() {
    return isMuted;
}

function toggleMicrophoneMute() {
    if (!localStream) return;

    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;

    isMuted = !track.enabled;

    micStatus.textContent = isMuted
        ? "Mic: Muted"
        : "Mic: Unmuted";

    connection.invoke("SendMuteState", roomId, getCurrentMuteState());
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
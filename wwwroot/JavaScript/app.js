import { state } from "./state.js";
import * as UI from "./ui.js";
import * as Audio from "./audio.js";
import * as WebRTC from "./webrtc.js";
import * as Auth from "./auth.js";
import * as Signaling from "./signaling.js";

const micToggle = document.getElementById("micToggle");
const micBtn = document.getElementById("micBtn");
const connectBtn = document.getElementById("connectBtn");

//Connect / Disconnect / End Call
connectBtn.addEventListener("click", async () => {
    if (state.appState === "disconnected") {
        await Signaling.startConnection();
    } else if (state.appState === "connected") {
        await Signaling.disconnect();
    } else if (state.appState === "in-call") {
        await WebRTC.endCall();
    }

    UI.updateUI();
});

//Enable mic
micBtn.addEventListener("click", async () => {
    if (state.localStream) {
        console.log("Mic already active");
        return;
    }

    try {
        state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        UI.setMicStatus("Mic: Access granted");

        Audio.setupAudioAnalysis(state.localStream);
    } catch (err) {
        UI.setMicStatus("Mic: Access denied");
        console.error(err);
    }
});

//Toggle mute
micToggle.addEventListener("click", () => {
    Audio.toggleMicrophoneMute();
});

//Auto-login
if (localStorage.getItem("username")) {
    Auth.showApp();
}
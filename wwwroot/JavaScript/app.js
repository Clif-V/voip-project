import { state } from "./state.js";
import * as UI from "./ui.js";
import * as Audio from "./audio.js";
import * as WebRTC from "./webrtc.js";
import * as Auth from "./auth.js";
import * as Signaling from "./signaling.js";

const micToggle = document.getElementById("micToggle");
const micBtn = document.getElementById("micBtn");
const connectBtn = document.getElementById("connectBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const acceptCallBtn = document.getElementById("acceptCallBtn");
const rejectCallBtn = document.getElementById("rejectCallBtn");
const transportRadios = document.querySelectorAll('input[name="transportMode"]');

window.onload = () => {
    if(localStorage.getItem("transportMode")){
        state.transportMode = localStorage.getItem("transportMode") || "p2p";
        document.querySelector(`input[name="transportMode"][value="${state.transportMode}"]`).checked = true;
    }
    else{
        state.transportMode = "p2p";
        document.getElementById("p2p").checked = true;
    }
}

transportRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        state.transportMode = document.querySelector('input[name="transportMode"]:checked').value;
        localStorage.setItem("transportMode", state.transportMode);

        console.log("Transport mode set to:", state.transportMode);
    });
});

logoutBtn.addEventListener("click", () => {
    Auth.logout();
});

loginBtn.addEventListener("click", () => {
    Auth.login();
});

registerBtn.addEventListener("click", () => {
    Auth.register();
});

acceptCallBtn.addEventListener("click", async () => {
    await WebRTC.acceptCall();
    UI.updateUI();
});

rejectCallBtn.addEventListener("click", async () => {
    await WebRTC.rejectCall();
    UI.updateUI();
});

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
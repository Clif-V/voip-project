import { state } from "./state.js";
import * as WebRTC from "./webrtc.js";

export function updateUI() {
    const btn = document.getElementById("connectBtn");

    if (state.appState === "disconnected") btn.textContent = "Connect";
    if (state.appState === "connected") btn.textContent = "Disconnect";
    if (state.appState === "in-call") btn.textContent = "End Call";
}

export function renderUserList(users) {
    const container = document.getElementById("userList");
    container.innerHTML = "";

    const currentUser = localStorage.getItem("username");

    users.forEach(user => {
        if (user === currentUser) return;

        const btn = document.createElement("button");
        btn.textContent = user;

        btn.onclick = () => WebRTC.startCall(user);

        container.appendChild(btn);
    });
}

export function setMicStatus(text) {
    document.getElementById("micStatus").textContent = text;
}

export function setVolume(value) {
    document.getElementById("volumeLevel").textContent = "Volume: " + value;
}

export function showIncomingCall() {
    document.getElementById("incomingCall").style.display = "block";
}
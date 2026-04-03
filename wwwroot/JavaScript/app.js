import { state } from "./state.js";
import * as UI from "./ui.js";
import * as Audio from "./audio.js";
import * as WebRTC from "./webrtc.js";
import * as Auth from "./auth.js";
import * as Signaling from "./signaling.js";
import * as Friend from "./friend.js";

const micToggle = document.getElementById("micToggle");
const micBtn = document.getElementById("micBtn");
const logoutBtn = document.getElementById("logoutBtn");
const acceptCallBtn = document.getElementById("acceptCallBtn");
const rejectCallBtn = document.getElementById("rejectCallBtn");
const transportRadios = document.querySelectorAll('input[name="transportMode"]');
const addFriendBtn = document.getElementById("addFriendBtn");
const callBtn = document.getElementById("callBtn");
const endCallBtn = document.getElementById("endCallBtn");
const toggleRequestsBtn = document.getElementById("toggleRequestsBtn");
const sendMessageBtn = document.getElementById("sendMessageBtn");

document.addEventListener("DOMContentLoaded", async () => {
    if (!await Auth.verifySession()) {
        UI.showLogin();
        return;
    }

    const username = localStorage.getItem("username");
    document.getElementById("usernameDisplay").textContent = username || "User";

    const savedMode = localStorage.getItem("transportMode") || "p2p";
    state.transportMode = savedMode;
    document.querySelector(`input[name="transportMode"][value="${savedMode}"]`).checked = true;

    await Signaling.startConnection();
});

transportRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        state.transportMode = document.querySelector('input[name="transportMode"]:checked').value;
        localStorage.setItem("transportMode", state.transportMode);
    });
});

toggleRequestsBtn.addEventListener("click", () => {
    const dropdown = document.getElementById("requestsDropdown");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
});

logoutBtn.addEventListener("click", () => {
    Auth.logout();
});

callBtn.addEventListener("click", async () => {
    if (state.selectedFriend) {

        console.log("Starting call with", state.selectedFriend);
        await WebRTC.startCall(state.selectedFriend);
        UI.updateUI();
    }
});

acceptCallBtn.addEventListener("click", async () => {
    console.log("Accepting call from", state.currentTargetUser);
    await WebRTC.acceptCall();
    UI.hideIncomingCall();
    UI.updateUI();
});

rejectCallBtn.addEventListener("click", () => {
    console.log("Rejecting call from", state.currentTargetUser);
    state.pendingOffer = null;
    state.currentTargetUser = null;
    UI.hideIncomingCall();
});

addFriendBtn.addEventListener("click", async () => {
    await Friend.addFriend();
});

callBtn.addEventListener("click", async () => {
    if (state.selectedFriend) {
        await WebRTC.startCall(state.selectedFriend);
        UI.updateUI();
    }
});

endCallBtn.addEventListener("click", async () => {
    await WebRTC.endCall();
    UI.updateUI();
});

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

sendMessageBtn.addEventListener("click", async () => {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    if (message && state.selectedFriend) {
        await Friend.sendMessage(state.selectedFriend, message);
        messageInput.value = "";
    }
});

micToggle.addEventListener("click", () => {
    Audio.toggleMicrophoneMute();
});

document.getElementById("usernameInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addFriendBtn.click();
});

document.getElementById("messageInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessageBtn.click();
});
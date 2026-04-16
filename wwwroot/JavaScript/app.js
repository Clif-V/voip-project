import { state } from "./state.js";
import * as UI from "./ui.js";
import * as Audio from "./audio.js";
import * as WebRTC from "./webrtc.js";
import * as Auth from "./auth.js";
import * as Signaling from "./signaling.js";
import * as Friend from "./friend.js";
import * as Message from "./message.js";

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

    await Signaling.startConnection();
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

rejectCallBtn.addEventListener("click", async () => {
    console.log("Rejecting call from", state.currentTargetUser);
    await WebRTC.rejectCall();
});

addFriendBtn.addEventListener("click", async () => {
    await Friend.addFriend();
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
    await Audio.startAudioStream();
});

sendMessageBtn.addEventListener("click", async () => {
    console.log("Send message button clicked");
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    if (message && state.selectedFriend) {
        const token = await Message.deriveConversationToken(state.selectedFriend);
        await Message.sendMessage(state.selectedFriend, message, token);
        UI.appendMessage(message, true);
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
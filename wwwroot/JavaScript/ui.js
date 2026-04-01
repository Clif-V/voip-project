import { state } from "./state.js";
import * as WebRTC from "./webrtc.js";
import * as Friend from "./friend.js";

export function updateUI() {
    const btn = document.getElementById("connectBtn");

    if (state.appState === "disconnected") btn.textContent = "Connect";
    if (state.appState === "connected") btn.textContent = "Disconnect";
    if (state.appState === "in-call") btn.textContent = "End Call";
}

export function renderFriendRequestList(friendRequests) {
    const incomingList = document.getElementById("friendRequestList");
    incomingList.innerHTML = "";
    
    const outgoingList = document.getElementById("outgoingFriendRequestList");
    outgoingList.innerHTML = "";

    friendRequests.incoming?.forEach(request => {
        const item = document.createElement("li");
        item.textContent = `Incoming: ${request.from}`;
        incomingList.appendChild(item);

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "Accept";
        acceptBtn.addEventListener("click", async () => {
            await Friend.acceptFriendRequest(request.id);
        });
        item.appendChild(acceptBtn);


        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "Reject";
        rejectBtn.addEventListener("click", async () => {
            await Friend.rejectFriendRequest(request.id);
            rejectBtn.remove();
            acceptBtn.remove();
            item.remove();
        });
        item.appendChild(rejectBtn);
    });

    friendRequests.outgoing?.forEach(request => {
        const item = document.createElement("li");
        item.textContent = `Outgoing: ${request.to}`;
        outgoingList.appendChild(item);
    });
}

export async function renderOnlineFriendsList() {
    const friendsList = document.getElementById("friendsList");
    friendsList.innerHTML = "";

    const friends = await Friend.getFriends();

    friends.forEach(friend => {
        const item = document.createElement("li");

        const button = document.createElement("button");
        button.textContent = "Call";
        button.addEventListener("click", async () => {
            await WebRTC.startCall(friend);
            updateUI();
        });

        item.textContent = friend;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", async () => {
            await Friend.removeFriend(friend);
            item.remove();
        });
        item.appendChild(removeBtn);
        item.appendChild(button);
        friendsList.appendChild(item);
    });
}

export function hideFriends() {
    document.getElementById("friendsSection").style.display = "none";
}

export function showFriends() {
    document.getElementById("friendsSection").style.display = "block";
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
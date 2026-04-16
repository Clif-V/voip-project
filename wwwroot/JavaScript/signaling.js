import { state } from "./state.js";
import * as UI from "./ui.js";
import * as Friend from "./friend.js";
import * as Audio from "./audio.js";
import * as Message from "./message.js";

export const connection = new signalR.HubConnectionBuilder()
    .withUrl("/signal", {
        accessTokenFactory: () => localStorage.getItem("token")
    })
    .withAutomaticReconnect()
    .build();

//Incoming call
connection.on("ReceiveOffer", (offer, callerUsername) => {
    console.log("Incoming call from:", callerUsername);

    if (state.appState === "in-call" || state.pendingOffer) {
        connection.invoke("RejectCallToUser", callerUsername);
        return;
    }

    state.currentTargetUser = callerUsername;
    state.pendingOffer = offer.offer;
    state.transportMode = offer.mode || "p2p"; // Default to P2P if mode not provided

    UI.showIncomingCall();
});

//Reconnect
connection.onreconnected(() => {
    console.log("Reconnected");
    Friend.getFriendRequests();
    UI.renderOnlineFriendsList();
});

//Answer
connection.on("ReceiveAnswer", async (answer) => {
    await state.transport?.handleAnswer(answer);
});

//ICE
connection.on("ReceiveIceCandidate", async (candidate) => {
    if (state.transport) {
        await state.transport.handleIceCandidate(candidate);
    } else {
        state.pendingIceCandidates.push(candidate);
    }
});

connection.on("FriendRequestListUpdated", friendRequests => {
    UI.renderFriendRequestList(friendRequests);
});

connection.on("FriendsListUpdated", () => {
    UI.renderOnlineFriendsList();
});

connection.on("ServerShutdown", async () => {
    if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
    }
    state.appState = "disconnected";
});

connection.on("CallEnded", async () => {
    if (state.transport) {
        await state.transport.close();
        state.transport = null;
    }
    state.currentTargetUser = null;
    state.pendingOffer = null;
    state.pendingIceCandidates = [];
    UI.hideIncomingCall();

    if (state.appState === "in-call") {
        state.appState = "connected";
        UI.updateUI();
    }
});

connection.on("CallRejected", async () => {
    UI.hideIncomingCall();
    alert("Call rejected by the user.");
    state.pendingOffer = null;
    state.pendingIceCandidates = [];
    state.currentTargetUser = null;
    if(state.localStream) await Audio.stopAudioStream();
});

connection.on("UserMuteChanged", (userID, isMuted) => {
    console.log(`User ${userID} mute state changed: ${isMuted}`);
    if (state.currentTargetUser === userID) {
        UI.setRemoteMicStatus(isMuted);
    }
});

connection.on("ReceiveMessage", async (token, ciphertextB64, ivB64) => {
    const fromUser = UI.getConversationFriend(token);
    if (!fromUser) {
        console.warn("ReceiveMessage: unknown conversation token", token);
        return;
    }
    try {
        const { text } = await Message.decryptMessage(fromUser, ciphertextB64, ivB64);
        if (state.selectedFriend === fromUser) {
            UI.appendMessage(text, false);
        } else {
            UI.markUnreadMessage(fromUser);
        }
    } catch (e) {
        console.error("Failed to decrypt incoming message from", fromUser, e);
    }
});

//Start connection
export async function startConnection() {
    await connection.start();

    const username = localStorage.getItem("username");
    console.log(`Connected as: ${username}`);
    
    console.log("Fetching friend requests...");
    Friend.getFriendRequests();

    UI.renderOnlineFriendsList();
    UI.showFriends();

    state.appState = "connected";
}

//Disconnect
export async function disconnect() {
    if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
    }

    if (state.transport) {
        await state.transport.close();
        state.transport = null;
    }

    if (state.localStream) {
        state.localStream.getTracks().forEach(t => t.stop());
        state.localStream = null;
    }

    UI.hideFriends();

    state.appState = "disconnected";
}
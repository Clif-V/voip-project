import { state } from "./state.js";
import * as Friend from "./friend.js";
import * as Message from "./message.js";

document.getElementById("showPassword")?.addEventListener("mousedown", () => {
    document.getElementById("password").type = "text";
});
document.getElementById("showPassword")?.addEventListener("mouseup", () => {
    document.getElementById("password").type = "password";
});
document.getElementById("showRecoveryPhrase")?.addEventListener("mousedown", () => {
    document.getElementById("recoveryPhrase").type = "text";
});
document.getElementById("showRecoveryPhrase")?.addEventListener("mouseup", () => {
    document.getElementById("recoveryPhrase").type = "password";
});

const conversationTokens = {}; // username -> conversation token (SHA-256 of ECDH shared secret)

// Reverse lookup: token -> friend username (used by signaling.js for incoming messages)
export function getConversationFriend(token) {
    return Object.keys(conversationTokens).find(u => conversationTokens[u] === token) ?? null;
}

export function updateUI() {
    const callBtn = document.getElementById("callBtn");
    const endCallBtn = document.getElementById("endCallBtn");
    const callControls = document.getElementById("callControls");

    if (state.appState === "in-call") {
        callBtn.style.display = "none";
        endCallBtn.style.display = "block";
        callControls.style.display = "flex";
    } else {
        callBtn.style.display = "block";
        endCallBtn.style.display = "none";
        callControls.style.display = "none";
    }
}

export function renderFriendRequestList(friendRequests) {
    const incomingList = document.getElementById("friendRequestList");
    incomingList.innerHTML = "";

    const outgoingList = document.getElementById("outgoingFriendRequestList");
    outgoingList.innerHTML = "";

    const totalIncoming = friendRequests.incoming?.length || 0;
    const badge = document.getElementById("incomingRequestBadge");
    badge.textContent = totalIncoming;
    badge.style.display = totalIncoming > 0 ? "inline" : "none";

    const totalOutgoing = friendRequests.outgoing?.length || 0;
    const outgoingBadge = document.getElementById("outgoingRequestBadge");
    outgoingBadge.textContent = totalOutgoing;
    outgoingBadge.style.display = totalOutgoing > 0 ? "inline" : "none";

    friendRequests.incoming?.forEach(request => {
        const item = document.createElement("li");
        item.textContent = `${request.from} `;

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "✓";
        acceptBtn.title = "Accept";
        acceptBtn.className = "req-btn req-accept";
        acceptBtn.addEventListener("click", async () => {
            await Friend.acceptFriendRequest(request.id);
        });
        item.appendChild(acceptBtn);

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "✕";
        rejectBtn.title = "Reject";
        rejectBtn.className = "req-btn req-reject";
        rejectBtn.addEventListener("click", async () => {
            await Friend.rejectFriendRequest(request.id);
        });
        item.appendChild(rejectBtn);

        incomingList.appendChild(item);
    });

    friendRequests.outgoing?.forEach(request => {
        const item = document.createElement("li");
        item.textContent = request.to;
        outgoingList.appendChild(item);
    });
}

export async function renderOnlineFriendsList() {
    const friendsList = document.getElementById("friendsList");
    friendsList.innerHTML = "";

    const friends = await Friend.getFriends();

    for (const friend of friends) {
        const item = document.createElement("li");

        const token = await Message.deriveConversationToken(friend);
        conversationTokens[friend] = token;

        const nameSpan = document.createElement("span");
        nameSpan.textContent = friend;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.className = "remove-friend-btn";
        removeBtn.title = "Remove friend";
        removeBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await Friend.removeFriend(friend);
            item.remove();
            if (state.selectedFriend === friend) {
                state.selectedFriend = null;
                document.getElementById("noSelectionView").style.display = "flex";
                document.getElementById("friendView").style.display = "none";
            }
        });

        item.appendChild(nameSpan);
        item.appendChild(removeBtn);

        item.addEventListener("click", () => selectFriend(friend));

        friendsList.appendChild(item);
    }
}

export function markUnreadMessage(fromUser) {
    const li = [...document.querySelectorAll("#friendsList li")]
        .find(li => li.querySelector("span")?.textContent === fromUser);
    if (!li) return;
    let badge = li.querySelector(".unread-badge");
    if (!badge) {
        badge = document.createElement("span");
        badge.className = "unread-badge";
        badge.textContent = "1";
        li.insertBefore(badge, li.querySelector(".remove-friend-btn"));
    } else {
        badge.textContent = String(parseInt(badge.textContent || "0") + 1);
    }
}

export function selectFriend(username) {
    state.selectedFriend = username;

    document.querySelectorAll("#friendsList li").forEach(li => {
        const isSelected = li.querySelector("span")?.textContent === username;
        li.classList.toggle("selected", isSelected);
        if (isSelected) li.querySelector(".unread-badge")?.remove();
    });

    document.getElementById("selectedFriendName").textContent = username;
    document.getElementById("noSelectionView").style.display = "none";
    document.getElementById("friendView").style.display = "flex";

    const token = conversationTokens[username];
    if (token) {
        renderConversationHistory(token, username);
    }
}

// Kept for compatibility with signaling.js
export function hideFriends() {}
export function showFriends() {}

export function setMicStatus(text) {
    document.getElementById("micStatus").textContent = text;
}

export function setRemoteMicStatus(isMuted) {
    const status = isMuted ? "Remote Mic: Muted" : "Remote Mic: Unmuted";
    document.getElementById("remoteMicStatus").textContent = status;
}

export function setVolume(value) {
    document.getElementById("volumeLevel").textContent = "Volume: " + value;
}

export function showIncomingCall() {
    document.getElementById("incomingCall").style.display = "block";
}

export function hideIncomingCall() {
    document.getElementById("incomingCall").style.display = "none";
}

export function showLogin(){
    window.location.href = "index.html";
}

export function showRegistration(){
    window.location.href = "register.html";
}

export function showApp(){
    window.location.href = "app.html";
}

export function showRecovery(){
    window.location.href = "recover.html";
}

async function renderConversationHistory(token, friendUsername) {
    const historyContainer = document.getElementById("messages");
    historyContainer.innerHTML = "";

    const res = await fetch(`/message/history/${encodeURIComponent(token)}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if (!res.ok) {
        console.log("Failed to fetch conversation history");
        return;
    }

    const messages = await res.json();
    const myUsername = localStorage.getItem("username");
    for (const msg of messages) {
        let text;
        let isSentByCurrentUser = false;
        if (!msg.iv) {
            text = "[Message encrypted before IV support — cannot decrypt]";
        } else {
            try {
                const result = await Message.decryptMessage(friendUsername, msg.content, msg.iv);
                text = result.text;
                isSentByCurrentUser = result.from === myUsername;
            } catch (e) {
                console.error("Failed to decrypt message:", e);
                text = "[Unable to decrypt]";
            }
        }
        appendMessage(text, isSentByCurrentUser);
    }

    historyContainer.scrollTop = historyContainer.scrollHeight;
}

export function appendMessage(text, isSent) {
    const historyContainer = document.getElementById("messages");
    const msgDiv = document.createElement("div");
    msgDiv.className = isSent ? "message sent" : "message received";
    msgDiv.textContent = text;
    historyContainer.appendChild(msgDiv);
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

export function showAlert(message) {
    alert(message);
}


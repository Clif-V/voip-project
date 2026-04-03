import * as UI from "./ui.js";

export async function addFriend(){
    const toUser = document.getElementById("usernameInput").value;
    console.log("Adding friend:", toUser);

    if(toUser){
        const res = await fetch("/friend/request",{
            method: "POST",
            headers: {
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ToUsername: toUser})
        });

        if(res.ok){
            alert("Friend request sent!");
        }
        else{
            const errorText = await res.text();
            alert(errorText);
        }
    }
    else{
        alert("Please enter a username.");
    }
}

export async function getFriendRequests(){
    const res = await fetch("/friend/requests", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if(res.ok){
        const friendRequests = await res.json();
        UI.renderFriendRequestList(friendRequests);
    }
    else{
        const errorText = await res.text();
        alert(errorText);
    }
}

export async function acceptFriendRequest(requestId){
    const res = await fetch(`/friend/request/${requestId}/accept`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if(res.ok){
        alert("Friend request accepted!");
    }
    else{
        const errorText = await res.text();
        alert(errorText);
    }
}

export async function rejectFriendRequest(requestId){
    const res = await fetch(`/friend/request/${requestId}/reject`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if(res.ok){
        alert("Friend request rejected.");
    }
    else{
        const errorText = await res.text();
        alert(errorText);
    }
}

export async function removeFriend(username){
    const res = await fetch(`/friend/${username}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if(res.ok){
        alert("Friend removed.");
    }
    else{
        const errorText = await res.text();
        alert(res.status + ": " + errorText);
    }
}

export async function getFriends(){
    const res = await fetch("/friend", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if(res.ok){
        const friends = await res.json();
        return friends;
    }
    else{
        const errorText = await res.text();
        alert(errorText);
        return [];
    }
}

export async function sendMessage(toUser, message){
    const res = await fetch(`/auth/publickey/${toUser}`,{
        method: "GET" 
    });

    if(res.ok){
        const { publicKey } = await res.json();

        // Encrypt message with recipient's public key
        const encryptedMessage = await encryptMessage(publicKey, message);

        // Send encrypted message to server
        await fetch("/friend/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ ToUsername: toUser, Message: encryptedMessage })
        });
    }
    else{
        const errorText = await res.text();
        alert(errorText);
    }
}
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
            alert("Failed to send friend request.");
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
        alert("Failed to fetch friend requests.");
    }
}

export function acceptFriendRequest(requestId){
    return fetch(`/friend/request/${requestId}/accept`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    }).then(res => {
        if(res.ok){
            alert("Friend request accepted!");
        }
        else{
            alert("Failed to accept friend request.");
        }
    });
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
        alert("Failed to reject friend request.");
    }
}
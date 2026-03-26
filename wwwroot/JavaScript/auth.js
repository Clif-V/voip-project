import * as Signaling from "./signaling.js";
import { state } from "./state.js";
import * as RTC from "./webrtc.js";

export async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            passwordHash: password
        })
    });

    if (!res.ok) {
        alert("Login failed");
        return;
    }

    const data = await res.json();

    localStorage.setItem("username", data.username);
    localStorage.setItem("token", data.token);

    showApp();
}

export async function logout() {
    Signaling.connection.stop();

    console.log(state.localStream);

    await RTC.endCall();

    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
    }

    localStorage.removeItem("username");
    localStorage.removeItem("token");

    showLogin();
}

export async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            passwordHash: password
        })
    });

    if (!res.ok) {
        alert("User exists or error");
        return;
    }

    alert("Registered! Now login.");
}

export function showApp() {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
}

export function showLogin(){
    document.getElementById("auth").style.display = "block";
    document.getElementById("app").style.display = "none";  
}
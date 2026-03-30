import * as Signaling from "./signaling.js";
import { state } from "./state.js";
import * as RTC from "./webrtc.js";

export async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log("Attempting login with username:", username);
    console.log("Attempting login with password:", password ? "******" : "(empty)");

    const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: username,
            password: password
        })
    });

    if (!res.ok) {
        alert("Login failed");
        return;
    }

    const data = await res.json();

    console.log("Login successful:", data);

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
    const email = document.getElementById("email").value;

    const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            password,
            email
        })
    });

    if (!res.ok) {
        alert("User exists or error");
        console.log(await res.status());
        return;
    }

    alert("Registered! Now login.");
    window.location.href = "index.html";
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
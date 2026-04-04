import * as Signaling from "./signaling.js";
import { state } from "./state.js";
import * as RTC from "./webrtc.js";
import * as UI from "./ui.js";

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
        return false;
    }

    const data = await res.json();

    console.log("Login successful:", data);

    localStorage.setItem("username", data.username);
    localStorage.setItem("token", data.token);
    return true;
}

async function deriveKeyFromPhrase(phrase, salt) {
    const phraseBuffer = new TextEncoder().encode(phrase);
    const baseKey = await crypto.subtle.importKey("raw", phraseBuffer, "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;

    // Generate ECDH key pair
    const keyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
    );

    // Export public key to send to server
    const exportedPublicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = btoa(Array.from(new Uint8Array(exportedPublicKey)).map(b => String.fromCharCode(b)).join(''));

    // Export private key to encrypt locally — never sent raw to server
    const exportedPrivateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Get recovery passphrase from user
    const recoveryPhrase = document.getElementById("recoveryPhrase").value;
    if (!recoveryPhrase || recoveryPhrase.length < 8) {
        alert("Please enter a recovery passphrase of at least 8 characters.");
        return;
    }

    // Encrypt private key with recovery passphrase
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await deriveKeyFromPhrase(recoveryPhrase, salt);
    const encryptedPrivateKey = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, exportedPrivateKey);

    const toBase64 = buf => btoa(Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join(''));

    const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            password,
            email,
            publicKey: publicKeyBase64,
            encryptedPrivateKey: toBase64(encryptedPrivateKey),
            privateKeySalt: toBase64(salt),
            privateKeyIv: toBase64(iv)
        })
    });

    if (!res.ok) {
        alert("User exists or error");
        return;
    }

    // Store private key in localStorage scoped to this user
    localStorage.setItem("privateKey_" + username, toBase64(exportedPrivateKey));

    alert("Registration successful!");
    window.location.href = "index.html";
}

export async function recoverPrivateKey() {
    const username = document.getElementById("recoverUsername").value;
    const recoveryPhrase = document.getElementById("recoverPhrase").value;

    if (!username || !recoveryPhrase) {
        alert("Please enter your username and recovery passphrase.");
        return;
    }

    const res = await fetch(`/auth/keypair/${encodeURIComponent(username)}`);
    if (!res.ok) {
        alert("User not found.");
        return;
    }

    const { encryptedPrivateKey, privateKeySalt, privateKeyIv } = await res.json();

    const fromBase64 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const toBase64 = buf => btoa(Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join(''));

    const salt = fromBase64(privateKeySalt);
    const iv = fromBase64(privateKeyIv);
    const encryptedBytes = fromBase64(encryptedPrivateKey);

    let aesKey;
    try {
        aesKey = await deriveKeyFromPhrase(recoveryPhrase, salt);
    } catch {
        alert("Failed to derive key from passphrase.");
        return;
    }

    let privateKeyBuffer;
    try {
        privateKeyBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encryptedBytes);
    } catch {
        alert("Incorrect recovery passphrase.");
        return;
    }

    localStorage.setItem("privateKey_" + username, toBase64(privateKeyBuffer));
    alert("Key recovered successfully! You can access your account.");
    UI.showApp();
}

export async function logout() {
    Signaling.connection.stop();

    console.log(state.localStream);

    await RTC.endCall();

    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
    }

    localStorage.removeItem("privateKey_" + localStorage.getItem("username"));
    localStorage.removeItem("username");
    localStorage.removeItem("token");

    UI.showLogin();
}

export async function verifySession() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.log("No token found in localStorage");
        return false;
    }
    const username = localStorage.getItem("username");
    if (!username || !localStorage.getItem("privateKey_" + username)) {
        console.log("No privateKey found in localStorage");
        return false;
    }
    const res = await fetch("/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        return false;
    }
    return true;
}
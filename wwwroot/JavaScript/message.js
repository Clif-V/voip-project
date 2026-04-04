export async function sendMessage(toUser, message) {
    // 1. Fetch recipient's public key
    const res = await fetch(`/auth/publickey/${toUser}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    if (!res.ok) { alert("Failed to fetch recipient's public key"); return; }
    const { publicKey: publicKeyB64 } = await res.json();

    // 2. Import recipient's public key as ECDH CryptoKey
    const publicKeyBytes = Uint8Array.from(atob(publicKeyB64), c => c.charCodeAt(0));
    const recipientPublicKey = await crypto.subtle.importKey(
        "spki", publicKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []
    );

    // 3. Import own private key from localStorage
    const myPrivKeyB64 = localStorage.getItem("privateKey_" + localStorage.getItem("username"));
    const myPrivKeyBytes = Uint8Array.from(atob(myPrivKeyB64), c => c.charCodeAt(0));
    const myPrivateKey = await crypto.subtle.importKey(
        "pkcs8", myPrivKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]
    );

    // 4. Derive shared AES key via ECDH
    const sharedKey = await crypto.subtle.deriveKey(
        { name: "ECDH", public: recipientPublicKey },
        myPrivateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    // 5. Encrypt the message
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(message);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encoded);

    // 6. Base64 encode for JSON transport
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    const sendRes = await fetch("/message/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ ToUsername: toUser, Message: ciphertextB64, Iv: ivB64 })
    });

    if (!sendRes.ok) {
        const errorText = await sendRes.text();
        alert(errorText);
    }
}

export async function decryptMessage(otherUser, ciphertextB64, ivB64) {
    const myPrivKeyB64 = localStorage.getItem("privateKey_" + localStorage.getItem("username"));
    if (!myPrivKeyB64) throw new Error("Private key not found in localStorage. Please recover your key.");

    const myPrivKeyBytes = Uint8Array.from(atob(myPrivKeyB64), c => c.charCodeAt(0));
    const myPrivateKey = await crypto.subtle.importKey(
        "pkcs8", myPrivKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]
    );

    const res = await fetch(`/auth/publickey/${otherUser}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    if (!res.ok) throw new Error("Failed to fetch public key for " + otherUser);
    const { publicKey: pubKeyB64 } = await res.json();
    const pubKeyBytes = Uint8Array.from(atob(pubKeyB64), c => c.charCodeAt(0));
    const otherPublicKey = await crypto.subtle.importKey(
        "spki", pubKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []
    );

    const sharedKey = await crypto.subtle.deriveKey(
        { name: "ECDH", public: otherPublicKey },
        myPrivateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, sharedKey, ciphertext);
    return new TextDecoder().decode(decrypted);
}
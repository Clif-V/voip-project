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
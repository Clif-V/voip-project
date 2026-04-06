
import * as Auth from "./auth.js";
import * as UI from "./ui.js";

// If already logged in, redirect to app
document.addEventListener("DOMContentLoaded", () => {
    const storedUsername = localStorage.getItem("username");
    if (localStorage.getItem("token") && storedUsername && localStorage.getItem("privateKey_" + storedUsername)) {
        UI.showApp();
    }
});

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
    if (await Auth.login()) {
        const username = localStorage.getItem("username");
        if (!localStorage.getItem("privateKey_" + username)) {
            UI.showRecovery();
            return;
        }
        UI.showApp();
    }
    else {
        alert("Login failed. Please check your credentials.");
    }
});

document.querySelectorAll("#password, #username").forEach(el => {
    el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") loginBtn.click();
    });
});
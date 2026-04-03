
import * as Auth from "./auth.js";
import * as UI from "./ui.js";

// If already logged in, redirect to app
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("token") && localStorage.getItem("privateKey")) {
        console.log("Existing session found, showing app..." + localStorage.getItem("token") + localStorage.getItem("privateKey"));
        UI.showApp();
    }
});

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
    if (await Auth.login()) {
        if (!localStorage.getItem("privateKey")) {
            alert("Private key not found. Please enter your recovery phrase to retrieve it.");
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
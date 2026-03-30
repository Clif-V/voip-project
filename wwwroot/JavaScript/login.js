
import * as Auth from "./auth.js";

// If already logged in, redirect to app
if (localStorage.getItem("token")) {
    window.location.href = "app.html";
}

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", () => {
    console.log("Login button clicked");
    Auth.login();
});
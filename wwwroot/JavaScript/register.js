import * as Auth from "./auth.js";

const registerBtn = document.getElementById("registerBtn");

registerBtn.addEventListener("click", () => {
    console.log("Register button clicked");
    Auth.register();
});
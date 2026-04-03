import * as Auth from "./auth.js";

const recoverBtn = document.getElementById("recoverBtn");
recoverBtn.addEventListener("click", () => {
    console.log("Attempting to recover private key...");
    Auth.recoverPrivateKey();
});
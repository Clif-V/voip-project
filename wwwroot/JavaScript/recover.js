import * as Auth from "./auth.js";

const recoverBtn = document.getElementById("recoverBtn");
recoverBtn.addEventListener("click", () => {
    console.log("Attempting to recover private key...");
    Auth.recoverPrivateKey();
});

document.querySelectorAll("#recoveryPhrase, #recoveryUsername").forEach(el => {
    el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") recoverBtn.click();
    });
});
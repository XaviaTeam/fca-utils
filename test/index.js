import { MSGStore } from "../lib/index.js";

const msgStore = new MSGStore();
msgStore.loginWithEmail("email", "password")
    .then(() => {
        console.log("Logged in");
    })
    .catch((err) => {
        console.error(err);
    });

import { Client } from "../lib/index.js";
import config from "./config.js";

const client = new Client({
    prefix: config.prefix,
    ignoreMessageInCommandEvent: true,
});

client.openServer(config.port);
client.loginWithAppState(config.appstate, { selfListen: false });
client.on("ready", (api, curID) => {
    console.log("LOGGED IN AS", curID);
    console.log("Listening for messages...");
});

client.on("message", (msg) => {
    console.log("Message received:", msg.body);

    if (msg.type === "message") {
        try {
            if (msg.args[0]?.toLowerCase() === "hi") {
                msg.reply("Hello!");
            }
        } catch (e) {
            console.error(e);
        }
    }
});

client.on("command", async (cmd) => {
    console.log("Command received:", cmd.name);

    try {
        if (cmd.name === "ping") {
            await cmd.message.reply("Pong!");

            await cmd.message.sendAttachment("https://i.ibb.co/kM9mPKv/image-2023-03-29-085007164.png");
            await cmd.message.sendAttachment("./test/1nXr.gif");
        }
    } catch (e) {
        console.error(e);
    }
})

client.on("error", (err) => console.error(err.message ?? err.error));

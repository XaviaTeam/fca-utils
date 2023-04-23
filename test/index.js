import { Client } from "../lib/index.js";
import config from "./config.js";

const client = new Client({
    prefix: config.prefix,
    ignoreMessageInCommandEvent: true,
});

try {
    const api = await client.loginWithFbState(config.appstate, {
        selfListen: false
    });
    client.on("logged", (api, currentUserID) => {
        console.log("LOGGED IN AS", currentUserID);
        console.log("Listening for messages...");
    });
    client.listen();

    client.on("message", (message) => {
        console.log("Message received:", message.body);

        if (message.type === "message") {
            try {
                if (message.args[0]?.toLowerCase() === "hi") {
                    message.reply("Hello!");
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
                await cmd.message.sendAttachment([
                    "https://i.ibb.co/kM9mPKv/image-2023-03-29-085007164.png",
                    "https://i.ibb.co/ZL61479/423269-Kycb.jpg"
                ], { skipFailed: true });
            }
        } catch (e) {
            console.error(e);
        }
    })

    client.on("event", (event) => {
        if (event.logMessageType === "log:subscribe") {
            api.sendMessage(`Welcome ${event.logMessageData.addedParticipants[0].fullName}!`, event.threadID);
        }

        if (event.logMessageType === "log:unsubscribe") {
            api.sendMessage(`Bye ${event.logMessageData.leftParticipantFbId}!`, event.threadID);
        }
    })

    client.on("error", (err) => {
        console.error(err.message ?? err.error ?? err[0]?.message ?? err)
    });
} catch (e) {
    console.error(e);
}

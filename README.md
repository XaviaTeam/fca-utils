# fca-utils
A NodeJS package to interact with Facebook Messenger API (fca-unofficial) <br/>
Inspired by [discord.js](https://www.npmjs.com/package/discord.js)


# Installation
```bash
npm install fca-utils
```

# Basic Usages
## Initialize
```js
import { Client } from 'fca-utils'

const client = new Client({
    prefix: "!", // Prefix for commands
    ignoreMessageInCommandEvent: true, // Ignore message in command event
});

client.loginWithAppState(process.env.BASE64_ENCODED_APPSTATE);
client.on("ready", (api, curID) => {
    console.log("LOGGED IN AS", curID);
    console.log("Listening for messages...");
});
```
> Login with username and password coming soon...

<hr/>
<br/>

## Message Events
```js
client.on(EVENT, (msg) => {
    // Do something
});
```

### Events
- `error` - Account error (locked/expired, etc.)
- `message` - When a message is received
- `command` - When a command is executed (only if prefix is set)
- `reaction` - When a reaction is added to a message
- `unsend` - When a message is unsent
- `event` - When an event is received, such as rename, kick/add users, etc.
- `others` - Others events: `typ`, `read`, `presence`, `read_receipt`

<br/><hr/>

### Message
```js
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
```

<details><summary><h3 style="display: inline">Screenshot<h3></summary>

![message_demo](https://i.ibb.co/9rvPFRQ/image-2023-03-27-010100006.png)

</details><br/>

Basic __msg__ properties:
- `msg.body` - Message body
- `msg.args` - Array of message body splitted by spaces/line breaks
- `msg.senderID` - ID of the sender
- `msg.threadID` - ID of the thread/group
- `msg.attachments` - Array of attachments
- `msg.mentions` - Array of mentions

Basic __msg__ methods:
- `msg.send("your message")` - Send a message back to the thread
- `msg.reply("your message")` - Reply to the message

<br/><hr/>

### Command
```js
client.on("command", async (cmd) => {
    console.log("Command received:", cmd.name);

    try {
        if (cmd.name === "ping") {
            await cmd.message.reply("Pong!");
        }
    } catch (e) {
        console.error(e);
    }
})
```

<details><summary><h3 style="display: inline">Screenshot<h3></summary>

![message_demo](https://i.ibb.co/9sMCHyX/image-2023-03-27-010125613.png)

</details><br/>

__cmd__ properties:
- `cmd.message` - same as the msg object in "message" event
- `cmd.name` - name of the command
- `cmd.args` - array of command arguments, for example:
    - `!ping hello world` -> `["hello", "world"]`

<br/><hr/>

### Reaction
```js
client.on("reaction", (msg) => {
    // Do something
});
```

<br/><hr/>

### Unsend
```js
client.on("unsend", (msg) => {
    // Do something
});
```

<br/><hr/>

### Event
```js
client.on("event", (msg) => {
    // Do something
});
```

<br/><hr/>

### Others
```js
client.on("others", (msg) => {
    // Do something
});
```

<br/><hr/>


Comming soon...

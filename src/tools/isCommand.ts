import { MessageObject, IFCAU_API } from "@xaviabot/fca-unofficial";
import {
    CommandsProps,
    TextMessage,
    AttachmentObject,
    SendAttachment,
} from "../index.js";
import loadAttachment from "./loadAttachment.js";
import { isAttachmentObject } from "./parser.js";

type CommandParserReturnTypes =
    | { status: true; data: CommandsProps }
    | { status: false; data: null };

export default function commandParser(
    message: TextMessage,
    prefix: string,
    api: IFCAU_API
): CommandParserReturnTypes {
    if (
        (message.type === "message" || message.type === "message_reply") &&
        message.body.startsWith(prefix)
    ) {
        const commandArgs = message.body
            .slice(prefix.length)
            .trim()
            .split(/ +/g);
        const name = commandArgs.shift()?.toLowerCase() ?? "";
        const { threadID, messageID } = message;

        return {
            status: true,
            data: {
                name,
                commandArgs,
                message: {
                    ...message,
                    send: (message: string | MessageObject) =>
                        api.sendMessage(message, threadID),
                    reply: (message: string | MessageObject) =>
                        api.sendMessage(message, threadID, messageID),
                    sendAttachment: async (
                        attachment: string | string[] | AttachmentObject,
                        options?: Partial<{
                            skipFailed: boolean;
                            reply: boolean;
                        }>
                    ) => {
                        const imagesSource =
                            typeof attachment === "string"
                                ? [attachment]
                                : Array.isArray(attachment)
                                ? attachment
                                : typeof attachment.url_or_path === "string"
                                ? [attachment.url_or_path]
                                : attachment.url_or_path;

                        const msgObj: MessageObject = {
                            body: isAttachmentObject(attachment)
                                ? attachment.title
                                : "",
                        };

                        msgObj.attachment = await loadAttachment(
                            imagesSource,
                            !!options?.skipFailed
                        );

                        return api.sendMessage(
                            msgObj,
                            threadID,
                            !!options?.reply ? messageID : undefined
                        );
                    },
                },
            },
        };
    }

    return {
        status: false,
        data: null,
    };
}

import { IFCAU_API, MessageObject } from "@xaviabot/fca-unofficial";
import loadAttachment from "./loadAttachment.js";
import { AttachmentObject } from "../index.js";

import {
    TextMessage,
    TextMessageExtended,
    ReactionMessage,
    ReactionMessageExtended,
    UnsendMessage,
    UnsendMessageExtended,
    EventMessage,
} from "../index.js";

export function isAttachmentObject(obj: unknown): obj is AttachmentObject {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "title" in obj &&
        "url_or_path" in obj
    );
}

export function eventParser(message: EventMessage, api: IFCAU_API) {
    return message;
}

export function textMessageParser(
    message: TextMessage,
    api: IFCAU_API
): TextMessageExtended {
    const { threadID, messageID } = message;

    return {
        ...message,
        send: (message: string | MessageObject) =>
            api.sendMessage(message, threadID),
        reply: (message: string | MessageObject) =>
            api.sendMessage(message, threadID, messageID),
        sendAttachment: async (
            attachment: string | string[] | AttachmentObject,
            options?: Partial<{ skipFailed: boolean; reply: boolean }>
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
                body: isAttachmentObject(attachment) ? attachment.title : "",
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
    };
}

export function reactionMessageParser(
    message: ReactionMessage,
    api: IFCAU_API
): ReactionMessageExtended {
    const { threadID } = message;

    return {
        ...message,
        send: (message: string | MessageObject) =>
            api.sendMessage(message, threadID),
        sendAttachment: async (
            attachment: string | string[] | AttachmentObject,
            options?: Partial<{ skipFailed: boolean }>
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
                body: isAttachmentObject(attachment) ? attachment.title : "",
            };

            msgObj.attachment = await loadAttachment(
                imagesSource,
                !!options?.skipFailed
            );

            return api.sendMessage(msgObj, threadID);
        },
    };
}

export function unsendMessageParser(
    message: UnsendMessage,
    api: IFCAU_API
): UnsendMessageExtended {
    const { threadID } = message;

    return {
        ...message,
        send: (message: string | MessageObject) =>
            api.sendMessage(message, threadID),
        sendAttachment: async (
            attachment: string | string[] | AttachmentObject,
            options?: Partial<{ skipFailed: boolean }>
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
                body: isAttachmentObject(attachment) ? attachment.title : "",
            };

            msgObj.attachment = await loadAttachment(
                imagesSource,
                !!options?.skipFailed
            );

            return api.sendMessage(msgObj, threadID);
        },
    };
}

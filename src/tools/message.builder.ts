import { MessageObject } from "@xaviabot/fca-unofficial";
import { Readable, Duplex, Transform } from "stream";
import { createReadStream, existsSync } from 'fs';
import axios from "axios";

type SendBody = string | MessageObject;

export type Mention = MessageObject["mentions"];
export type Attachment = Readable | Duplex | Transform;
export class Message {
    #body: string = "";
    #attachments: Attachment[] = [];
    #mentions: Mention = [];

    constructor(body: string = "") {
        if (typeof body !== "string") throw new TypeError("body must be a string");
        this.#body = body;
    }

    #downloadAttachment = async (attachment: URL): Promise<Attachment> => {
        if (typeof attachment === "string" || attachment instanceof URL) {
            const response = await axios.get(attachment.href, { responseType: "stream" });
            return response.data;
        } else {
            return attachment;
        }
    }

    setBody(body: string): this {
        if (typeof body !== "string") throw new TypeError("body must be a string");
        this.#body = body;
        return this;
    }

    async addAttachment(attachment: string | URL | Attachment | (string | URL)[] | Attachment[]): Promise<this> {
        if (Array.isArray(attachment)) {
            if (attachment.length === 0) return this;

            await Promise.all(attachment.map(async attachment => await this.addAttachment(attachment)));
        } else {
            if (typeof attachment === "undefined") return this;

            if (attachment instanceof URL || typeof attachment === "string") {
                try {
                    const rURL = new URL(attachment);
                    const readable = await this.#downloadAttachment(rURL);
                    if (readable !== null) this.#attachments.push(readable);
                    else throw new Error(`Failed to download attachment from ${attachment}`);
                } catch (err) {
                    if (err instanceof TypeError && err.message === "Failed to construct 'URL': Invalid URL") {
                        if (existsSync(attachment)) this.#attachments.push(createReadStream(attachment));
                        else throw new Error(`File not found: ${attachment}`);
                    } else {
                        throw err;
                    }
                }
            } else {
                this.#attachments.push(attachment);
            }
        }

        return this;
    }

    addMention(id: string, tag: string, fromIndex?: number): this {
        if (typeof id !== "string") throw new TypeError("id must be a string");
        if (typeof tag !== "string") throw new TypeError("tag must be a string");
        if (typeof fromIndex !== "undefined" && typeof fromIndex !== "number") throw new TypeError("fromIndex must be a number");

        if (typeof this.#mentions === "undefined") this.#mentions = [];
        this.#mentions.push({ tag, id, fromIndex });
        return this;
    }

    addMentions(mentions: Mention): this {
        if (typeof mentions === "undefined") return this;
        if (!Array.isArray(mentions)) throw new TypeError("mentions must be an array");
        if (typeof this.#mentions === "undefined") this.#mentions = [];

        mentions.forEach(mention => { this.addMention(mention.id, mention.tag, mention.fromIndex) });

        return this;
    }

    get value(): SendBody {
        return {
            body: this.#body,
            mentions: this.#mentions,
            attachment: this.#attachments
        }
    }
}

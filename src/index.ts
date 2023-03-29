import login, { IFCAU_API, IFCAU_Options, IFCAU_ListenMessage, MessageObject } from '@xaviabot/fca-unofficial';
import axios from 'axios';
import { createReadStream, existsSync } from 'fs';
import { EventEmitter } from 'events';
import { Express } from 'express';
import createHttpsServer from './server.js';
import { getAppstate } from './utils.js';

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36';

export const DEFAULT_OPTIONS: Partial<IFCAU_Options> = {
    pauseLog: true,
    userAgent: DEFAULT_USER_AGENT
}

export type SendMessage = (message: string | MessageObject) => Promise<{ threadID: string, messageID: string, timestamp: number }>;
export type SendAttachmentWR = (attachment: string | { title: string, url_or_path: string }, reply: boolean) => Promise<{ threadID: string, messageID: string, timestamp: number }>;
export type SendAttachment = (attachment: string | { title: string, url_or_path: string }) => Promise<{ threadID: string, messageID: string, timestamp: number }>;
export type EventMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "event" }> extends infer S ? R & S : never : never;
export type TextMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "message" | "message_reply" }> extends infer S ? R & S : never : never;
export type ReactionMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "reaction" }> extends infer S ? R & S : never : never;
export type UnsendMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "unsend" }> extends infer S ? R & S : never : never;
export type OtherMessage = Exclude<IFCAU_ListenMessage, EventMessage | TextMessage | ReactionMessage | UnsendMessage>;
export type CommandsProps = { name: string, commandArgs: string[], message: TextMessage & { send: SendMessage, reply: SendMessage, sendAttachment: SendAttachmentWR } };

export declare interface Client {
    on(event: 'ready', listener: (api: IFCAU_API, userID: string) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'message', listener: (message: TextMessage & { send: SendMessage, reply: SendMessage, sendAttachment: SendAttachmentWR }) => void): this;
    on(event: 'command', listener: (props: CommandsProps) => void): this;
    on(event: 'reaction', listener: (message: ReactionMessage & { send: SendMessage, sendAttachment: SendAttachment }) => void): this;
    on(event: 'unsend', listener: (message: UnsendMessage & { send: SendMessage, sendAttachment: SendAttachment }) => void): this;
    on(event: 'others', listener: (message: OtherMessage) => void): this;
    on(event: 'event', listener: (event: EventMessage) => void): this;
}

export interface ClientOptions {
    /**
     * @default null
     * @description The bot prefix to recognize commands
     */
    prefix?: string;
    /**
     * @default true
     * @description If true, the message event will not be emitted when the message is a command
     */
    ignoreMessageInCommandEvent?: boolean;
}

export class Client extends EventEmitter {
    #prefix: string | null = null;
    #ignoreMessageInCommandEvent: boolean = true;
    #api: IFCAU_API | null = null;

    constructor(options?: ClientOptions) {
        super();

        if (typeof options?.prefix === "string" && options.prefix.length > 0) this.#prefix = options.prefix;
        if (typeof options?.ignoreMessageInCommandEvent === "boolean") this.#ignoreMessageInCommandEvent = options.ignoreMessageInCommandEvent;
    }

    getApi() {
        return this.#api;
    }

    #isCommand(message: TextMessage): CommandsProps | false {
        if ((message.type === "message" || message.type === "message_reply") && this.#prefix !== null) {
            if (message.body.startsWith(this.#prefix) && this.#api !== null) {
                const commandArgs = message.body.slice(this.#prefix.length).trim().split(/ +/g);
                const name = commandArgs.shift()?.toLowerCase() ?? '';
                const { threadID, messageID } = message;

                return {
                    name,
                    commandArgs,
                    message: {
                        ...message,
                        send: (message: string | MessageObject) => this.#api!.sendMessage(message, threadID),
                        reply: (message: string | MessageObject) => this.#api!.sendMessage(message, threadID, messageID),
                        sendAttachment: async (attachment: string | { title: string, url_or_path: string }, reply: boolean = false) => {
                            const imageSource = typeof attachment === "string" ? attachment : attachment.url_or_path;
                            const msgObj: MessageObject = {
                                body: typeof attachment === "string" ? "" : attachment.title,
                            }

                            const isExists = existsSync(imageSource);
                            if (!isExists) {
                                try {
                                    new URL(imageSource);
                                    msgObj.attachment = await axios.get(imageSource, { responseType: 'stream' }).then(res => res.data);
                                } catch (err) {
                                    if (err instanceof Error && err.message.includes('Invalid URL'))
                                        throw new Error("Invalid image source, must be a valid URL or path to the file");
                                    else throw err;
                                }
                            } else {
                                msgObj.attachment = createReadStream(imageSource);
                            }

                            return this.#api!.sendMessage(msgObj, threadID, reply ? messageID : undefined);
                        }
                    }
                }
            }
        }
        return false;
    }

    openServer(port: number = 3001, app?: Express) {
        createHttpsServer(port, app);
    }

    // loginWithEmail(email: string, password: string, options: Partial<IFCAU_Options>) {
    //     login({ email, password }, { ...DEFAULT_OPTIONS, ...options })
    //         .then(api => {

    //         });
    // }

    loginWithAppState(EState: string, options: Partial<IFCAU_Options>) {
        const appState = getAppstate(EState);

        login({ appState }, { ...DEFAULT_OPTIONS, ...options })
            .then(api => {
                this.#api = api;
                this.emit('ready', api, api.getCurrentUserID());
                api.listenMqtt((err, message) => {
                    if (!message) return this.emit('error', err ?? new Error('Fbstate expired/Account checkpointed/banned'));
                    if (message.type === "event") this.emit('event', message);
                    else if (message.type === "message" || message.type === "message_reply") {
                        const command = this.#isCommand(message);
                        if (command !== false) this.emit('command', command);
                        if (command !== false && this.#ignoreMessageInCommandEvent) return;

                        const { threadID, messageID } = message;
                        this.emit('message', {
                            ...message,
                            send: (message: string | MessageObject) => api.sendMessage(message, threadID),
                            reply: (message: string | MessageObject) => api.sendMessage(message, threadID, messageID),
                            sendAttachment: async (attachment: string | { title: string, url_or_path: string }, reply: boolean = false) => {
                                const imageSource = typeof attachment === "string" ? attachment : attachment.url_or_path;
                                const msgObj: MessageObject = {
                                    body: typeof attachment === "string" ? "" : attachment.title,
                                }

                                const isExists = existsSync(imageSource);
                                if (!isExists) {
                                    try {
                                        new URL(imageSource);
                                        msgObj.attachment = await axios.get(imageSource, { responseType: 'stream' }).then(res => res.data);
                                    } catch (err) {
                                        if (err instanceof Error && err.message.includes('Invalid URL'))
                                            throw new Error("Invalid image source, must be a valid URL or path to the file");
                                        else throw err;
                                    }
                                } else {
                                    msgObj.attachment = createReadStream(imageSource);
                                }

                                return this.#api!.sendMessage(msgObj, threadID, reply ? messageID : undefined);
                            }
                        });
                    } else if (message.type === "message_reaction") {
                        const { threadID } = message;
                        this.emit('reaction', {
                            ...message,
                            send: (message: string | MessageObject) => api.sendMessage(message, threadID),
                            sendAttachment: async (attachment: string | { title: string, url_or_path: string }) => {
                                const imageSource = typeof attachment === "string" ? attachment : attachment.url_or_path;
                                const msgObj: MessageObject = {
                                    body: typeof attachment === "string" ? "" : attachment.title,
                                }

                                const isExists = existsSync(imageSource);
                                if (!isExists) {
                                    try {
                                        new URL(imageSource);
                                        msgObj.attachment = await axios.get(imageSource, { responseType: 'stream' }).then(res => res.data);
                                    } catch (err) {
                                        if (err instanceof Error && err.message.includes('Invalid URL'))
                                            throw new Error("Invalid image source, must be a valid URL or path to the file");
                                        else throw err;
                                    }
                                } else {
                                    msgObj.attachment = createReadStream(imageSource);
                                }

                                return this.#api!.sendMessage(msgObj, threadID);
                            }
                        });
                    } else if (message.type === "message_unsend") {
                        const { threadID } = message;
                        this.emit('unsend', {
                            ...message,
                            send: (message: string | MessageObject) => api.sendMessage(message, threadID),
                            sendAttachment: async (attachment: string | { title: string, url_or_path: string }) => {
                                const imageSource = typeof attachment === "string" ? attachment : attachment.url_or_path;
                                const msgObj: MessageObject = {
                                    body: typeof attachment === "string" ? "" : attachment.title,
                                }

                                const isExists = existsSync(imageSource);
                                if (!isExists) {
                                    try {
                                        new URL(imageSource);
                                        msgObj.attachment = await axios.get(imageSource, { responseType: 'stream' }).then(res => res.data);
                                    } catch (err) {
                                        if (err instanceof Error && err.message.includes('Invalid URL'))
                                            throw new Error("Invalid image source, must be a valid URL or path to the file");
                                        else throw err;
                                    }
                                } else {
                                    msgObj.attachment = createReadStream(imageSource);
                                }

                                return this.#api!.sendMessage(msgObj, threadID);
                            }
                        });
                    } else this.emit('others', message);
                });
            })
            .catch(err => {
                this.emit('error', err);
            })
    }
}

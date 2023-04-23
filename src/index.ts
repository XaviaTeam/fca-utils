import login, { IFCAU_API, IFCAU_Options, IFCAU_ListenMessage, MessageObject } from '@xaviabot/fca-unofficial';
import EventEmitter from 'events';

import isCommand from './tools/isCommand.js';
import { getAppstate } from './utils.js';
import { eventParser, reactionMessageParser, textMessageParser, unsendMessageParser } from './tools/parser.js';

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36';

export const DEFAULT_OPTIONS: Partial<IFCAU_Options> = {
    pauseLog: true,
    userAgent: DEFAULT_USER_AGENT
}

export type AttachmentObject = { title: string, url_or_path: string | string[] };
export type SendMessage = (message: string | MessageObject) => Promise<{ threadID: string, messageID: string, timestamp: number }>;
export type SendAttachmentWR = (attachment: string | string[] | AttachmentObject, options: { skipFailed: boolean, reply: boolean }) => Promise<{ threadID: string, messageID: string, timestamp: number }>;
export type SendAttachment = (attachment: string | string[] | AttachmentObject, options: { skipFailed: boolean }) => Promise<{ threadID: string, messageID: string, timestamp: number }>;
export type EventMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "event" }> extends infer S ? R & S : never : never;
export type TextMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "message" | "message_reply" }> extends infer S ? R & S : never : never;
export type ReactionMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "message_reaction" }> extends infer S ? R & S : never : never;
export type UnsendMessage = Pick<IFCAU_ListenMessage, Extract<keyof IFCAU_ListenMessage, 'type'>> extends infer R ? Extract<IFCAU_ListenMessage, { type: "message_unsend" }> extends infer S ? R & S : never : never;
export type OtherMessage = Exclude<IFCAU_ListenMessage, EventMessage | TextMessage | ReactionMessage | UnsendMessage>;

export type TextMessageExtended = TextMessage & { send: SendMessage, reply: SendMessage, sendAttachment: SendAttachmentWR };
export type ReactionMessageExtended = ReactionMessage & { send: SendMessage, sendAttachment: SendAttachment };
export type UnsendMessageExtended = UnsendMessage & { send: SendMessage, sendAttachment: SendAttachment };
export type CommandsProps = { name: string, commandArgs: string[], message: TextMessageExtended };

export declare interface Client {
    on(event: 'logged', listener: (api: IFCAU_API, userID: string) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'message', listener: (message: TextMessageExtended) => void): this;
    on(event: 'command', listener: (props: CommandsProps) => void): this;
    on(event: 'reaction', listener: (message: ReactionMessageExtended) => void): this;
    on(event: 'unsend', listener: (message: UnsendMessageExtended) => void): this;
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

    #isCommand(message: TextMessage) {
        return isCommand(message, this.#prefix!, this.#api!);
    }

    async #loginWithEmail(email: string, password: string, options: Partial<IFCAU_Options>) {
        return login({ email, password }, { ...DEFAULT_OPTIONS, ...options })
            .then(api => {

            });
    }

    async loginWithFbState(EState: string, options: Partial<IFCAU_Options>) {
        const appState = getAppstate(EState);

        const api = await login({ appState }, { ...DEFAULT_OPTIONS, ...options });
        this.#api = api;

        process.nextTick(() => {
            this.emit('logged', api, api.getCurrentUserID());
        });
        return api;
    }

    listen() {
        const api = this.#api;
        if (!api) {
            this.emit('error', new Error('API not initialized'));
            return;
        }

        return api.listenMqtt((err, message) => {
            if (!message) return this.emit('error', err ?? new Error('Fbstate expired/Account checkpointed/banned'));
            if (message.type === "event") return this.emit('event', eventParser(message, api));

            if (message.type === "message" || message.type === "message_reply") {
                const command = this.#isCommand(message);
                if (command.status === true) this.emit('command', command.data);
                if (command.status === true && this.#ignoreMessageInCommandEvent === true) return;

                return this.emit('message', textMessageParser(message, api));
            }

            if (message.type === "message_reaction") {
                return this.emit('reaction', reactionMessageParser(message, api));
            }

            if (message.type === "message_unsend") {
                return this.emit('unsend', unsendMessageParser(message, api));
            }

            return this.emit('others', message);
        });
    }
}

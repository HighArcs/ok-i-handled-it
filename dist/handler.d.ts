import { Client, ClientEvents, Message } from "discord.js";
import { Command } from "./command";
import { Awaitable, ParseType } from "./tools/types";
export interface OkFilter {
    ignoreBots?: boolean;
    onBotCancel?: (message: Message) => Awaitable<void>;
    ignoreSelf?: boolean;
    onSelfCancel?: (message: Message) => Awaitable<void>;
}
export interface OkEvents {
    onPrefixCheck?: (context: Message, prefixes: Array<string>) => Awaitable<Array<string>>;
    onCommandCheck?: (context: Message, command: Command) => Awaitable<boolean>;
    onCommandCheckCancel?: (context: Message, command: Command) => Awaitable<any>;
    onMessageCheck?: (context: Message) => Awaitable<boolean>;
    onMessageCheckCancel?: (context: Message) => Awaitable<any>;
    other?: Array<ParseType<{
        [K in keyof ClientEvents]: (...args: ClientEvents[K]) => any;
    }>>;
}
export interface OkOptions {
    prefix?: Iterable<string> | string;
    filter?: OkFilter;
    events?: OkEvents;
    editResponse?: boolean;
    deleteResponse?: boolean;
    startup?: boolean;
}
export declare class Ok {
    protected prefixes: Array<string>;
    commands: Array<Command>;
    replies: Map<string, Message>;
    options: Required<OkOptions>;
    constructor(options: OkOptions);
    get(name: string): Command<any> | undefined;
    add<T>(options: Command<T>): this;
    addMultiple(...commands: Array<Command>): this;
    exec(context: Message): Promise<any>;
    attach(client: Client): void;
}

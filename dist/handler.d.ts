import { Awaitable, Client, Message } from "discord.js";
import { Command } from "./command";
export interface OkFilter {
    ignoreBots?: boolean;
    onBotCancel?: (message: Message) => Awaitable<void>;
    ignoreSelf?: boolean;
    onSelfCancel?: (message: Message) => Awaitable<void>;
    ignoreDMs?: boolean;
    onDMCancel?: (message: Message) => Awaitable<void>;
}
export interface OkEvents {
    onPrefixCheck?: (context: Message, prefixes: Array<string>) => Awaitable<Array<string>>;
    onCommandCheck?: (context: Message, command: Command) => Awaitable<boolean>;
    onCommandCheckCancel?: (context: Message, command: Command) => Awaitable<any>;
    onMessageCheck?: (context: Message) => Awaitable<boolean>;
    onMessageCheckCancel?: (context: Message) => Awaitable<any>;
}
export interface OkOptions {
    prefix?: Iterable<string> | string;
    filter?: OkFilter;
    events?: OkEvents;
    editResponse?: boolean;
    deleteResponse?: boolean;
}
export interface DirectoryOptions {
    subdirectories?: boolean;
    absolute?: boolean;
}
export declare class Ok {
    readonly client: Client;
    protected prefixes: Array<string>;
    commands: Array<Command>;
    replies: Map<string, Message>;
    options: Required<OkOptions>;
    protected directories: Map<string, DirectoryOptions>;
    constructor(client: Client, options: OkOptions);
    get(name: string): Command<any> | undefined;
    add<T>(options: Command<T>): this;
    addMultiple(commands?: Array<Command>): this;
    addMultipleIn(directory: string, options: DirectoryOptions): Promise<this>;
    exec(context: Message): Promise<any>;
    attach(): Promise<void>;
    run(token: string): Promise<void>;
}

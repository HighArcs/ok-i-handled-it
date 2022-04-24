import { Message, PermissionsBitField } from "discord.js";
import { OkFilter } from "./handler";
import { Signature } from "./signature";
import { Awaitable } from "./tools/types";
export interface CommandMetadata<T> {
    description?: string;
    usage?: string;
    examples?: Array<string>;
    other?: {
        [key: string]: any;
    };
}
export interface CommandFilter<T> extends OkFilter {
    permissions?: Array<PermissionsBitField>;
    onPermissionsCancel?: (message: Message, args: T, permissions: Array<PermissionsBitField>) => Awaitable<any>;
    clientPermissions?: Array<PermissionsBitField>;
    onClientPermissionsCancel?: (message: Message, args: T, permissions: Array<PermissionsBitField>) => Awaitable<any>;
    nsfw?: boolean;
    onNsfwCancel?: (message: Message, args: T) => Awaitable<any>;
}
export interface Command<T = any> {
    file?: string;
    name: string;
    aliases?: Array<string>;
    signature?: Signature<T>;
    metadata?: CommandMetadata<T>;
    filter?: CommandFilter<T>;
    execute: (context: Message, args: T, command: Command<T>) => Awaitable<any>;
    onError?: (context: Message, error: Error, command: Command<T>) => Awaitable<any>;
    onBefore?: (context: Message, command: Command<T>) => Awaitable<boolean>;
    onCancel?: (context: Message, command: Command<T>) => Awaitable<any>;
    onBeforeRun?: (context: Message, args: T, command: Command<T>) => Awaitable<any>;
    onSuccess?: (context: Message, args: T, output: any, command: Command<T>) => Awaitable<any>;
    onTypeError?: (context: Message, errors: Record<string, Error>, command: Command<T>) => Awaitable<any>;
}

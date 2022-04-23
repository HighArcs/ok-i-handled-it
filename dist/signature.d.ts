import { Message } from "discord.js";
import { Awaitable, Resolvable } from "./tools/types";
export declare type ParameterType<T> = (value: string, context: Message) => Awaitable<T>;
export declare type ParameterDefault<T> = (context: Message) => Awaitable<T>;
export interface Parameter<T> {
    name?: string;
    type: ParameterType<T>;
    required?: boolean;
    default?: ParameterDefault<string> | string;
    choices?: Resolvable<Array<T>>;
}
export declare type Signature<T> = {
    [K in keyof T]: Parameter<T[K]> | ParameterType<T[K]>;
};
export interface SignatureResult<T> {
    signature: Signature<T>;
    raw: Array<string>;
    context: Message;
    output: T;
    errors: Record<string, TypeError>;
}
export declare function parseSignature<T>(context: Message, args: Array<string>, signature: Signature<T>): Promise<SignatureResult<T>>;

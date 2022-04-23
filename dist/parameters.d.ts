import { ParameterType } from "./signature";
export declare enum Builtin {
    BOOLEAN = "boolean",
    NUMBER = "number",
    INTEGER = "integer",
    STRING = "string",
    MENTION = "mention",
    MENTION_USER = "mentionUser",
    MENTION_CHANNEL = "mentionChannel",
    MENTION_ROLE = "mentionRole",
    DATE = "date",
    BIGINT = "bigint",
    URL = "url",
    FILE = "file"
}
export declare const Parameters: Record<Builtin, ParameterType<any>>;

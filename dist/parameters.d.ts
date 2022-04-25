import { Message } from "discord.js";
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
export declare const Parameters: {
    boolean: (value: string, context: Message) => boolean;
    number: (value: string, context: Message) => number;
    integer: (value: string, context: Message) => number;
    string: (value: string, context: Message) => string;
    mention: (value: string, context: Message) => import("./tools/markup").DiscordRegexPayload<import("./tools/markup").MentionableMatch>;
    mentionUser: (value: string, context: Message) => import("./tools/markup").DiscordRegexPayload<import("./tools/markup").MentionUserMatch>;
    mentionChannel: (value: string, context: Message) => import("./tools/markup").DiscordRegexPayload<import("./tools/markup").MentionChannelMatch>;
    mentionRole: (value: string, context: Message) => import("./tools/markup").DiscordRegexPayload<import("./tools/markup").MentionRoleMatch>;
    date: (value: string, context: Message) => Date;
    bigint: (value: string, context: Message) => bigint;
    url: (value: string, context: Message) => URL;
    file: (value: string, context: Message) => import("discord.js").Attachment | undefined;
};

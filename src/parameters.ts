import { Message } from "discord.js";
import { Match } from "./tools/markup";

export enum Builtin {
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
  FILE = "file",
  OBJECT = "object",
}
export const Parameters = {
  [Builtin.BOOLEAN]: (value: string, context: Message) => {
    return value.toLowerCase() === "true";
  },
  [Builtin.NUMBER]: (value: string, context: Message) => {
    return Number(value);
  },
  [Builtin.INTEGER]: (value: string, context: Message) => {
    return parseInt(value);
  },
  [Builtin.STRING]: (value: string, context: Message) => {
    return value;
  },
  [Builtin.MENTION]: (value: string, context: Message) => {
    return Match.mention(value);
  },
  [Builtin.MENTION_USER]: (value: string, context: Message) => {
    return Match.mentionUser(value);
  },
  [Builtin.MENTION_CHANNEL]: (value: string, context: Message) => {
    return Match.mentionChannel(value);
  },
  [Builtin.MENTION_ROLE]: (value: string, context: Message) => {
    return Match.mentionRole(value);
  },
  [Builtin.DATE]: (value: string, context: Message) => {
    return new Date(value);
  },
  [Builtin.BIGINT]: (value: string, context: Message) => {
    return BigInt(value);
  },
  [Builtin.URL]: (value: string, context: Message) => {
    if (!value.startsWith("http")) {
      value = `http://${value}`;
    }
    return new URL(value);
  },
  [Builtin.FILE]: (value: string, context: Message) => {
    return context.attachments.first();
  },
  [Builtin.OBJECT]: <T>(value: string, context: Message): T => {
    return JSON.parse(value) as T;
  },
};

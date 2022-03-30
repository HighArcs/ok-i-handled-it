import { Message } from "discord.js";

export namespace Parameters {
  export function boolean(value: string, context: Message) {
    return value.toLowerCase() === "true";
  }
  export function string(value: string, context: Message) {
    return value;
  }
  export function number(value: string, context: Message) {
    return Number(value);
  }
  export function float(value: string, context: Message) {
    return Number.parseFloat(value);
  }
  export function integer(value: string, context: Message) {
    return Number.parseInt(value);
  }
  export function bigint(value: string, context: Message) {
    return BigInt(value);
  }
  export function channel(value: string, context: Message) {
    if (value) {
      if (context.guild) {
        return context.guild.channels.cache.get(value);
      }
    }
    return context.channel;
  }
  export function member(value: string, context: Message) {
    if (value) {
      if (context.guild) {
        return context.guild.members.cache.get(value);
      }
    }
    return context.member;
  }
  export function role(value: string, context: Message) {
    if (value) {
      if (context.guild) {
        return context.guild.roles.resolve(value);
      }
    } else if (context.member) {
      return context.member.roles.highest;
    }
  }
  export function emoji(value: string, context: Message) {
    return context.client.emojis.resolve(value);
  }
  export function user(value: string, context: Message) {
    return context.client.users.resolve(value);
  }
  export function date(value: string, context: Message) {
    if (value) {
      return new Date(value);
    }
    return new Date();
  }
}

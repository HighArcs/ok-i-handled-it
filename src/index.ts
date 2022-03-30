import { Client, Message } from "discord.js";
import { Parameters } from "./parameters";
import { Signature } from "./signature";

export interface Command<T = any> {
  name: string;

  signature: Signature<T>;
  execute: (context: Message, args: T) => unknown | Promise<unknown>;
}

export interface OkOptions {
  prefix?: Array<string> | string;
}
export class Ok {
  protected readonly client: Client;
  protected prefixes: Array<string> = [];
  protected commands: Array<Command> = [];
  constructor(client: Client, options: OkOptions) {
    this.client = client;
    if (options.prefix) {
      if (Array.isArray(options.prefix)) {
        this.prefixes = options.prefix;
      } else {
        this.prefixes = [options.prefix];
      }
    }
    this.prefixes.sort((a, b) => b.length - a.length);
  }
  add<T>(options: Command<T>) {
    this.commands.push(options);
  }
}

new Ok(Client.prototype, {}).add({
  name: "test",
  signature: {
    member: {
      name: "member",
      type: Parameters.member,
    },
  },
  execute(context, args) {
    return args.member;
  },
});

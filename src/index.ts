import { Client, Message } from "discord.js";
import { parseSignature, Signature } from "./signature";
import { Awaitable } from "./tools/types";

export interface Command<T = any> {
  name: string;
  signature: Signature<T>;
  execute: (context: Message, args: T) => Awaitable<any>;
  onError?: (context: Message, error: Error) => Awaitable<any>;
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
  async exec(context: Message) {
    const args = context.content.split(" ");
    const prefix = args.shift() || "";
    const command = args.shift();
    if (this.prefixes.includes(prefix)) {
      const commandObj = this.commands.find(
        (c) => c.name === command
      ) as Command;
      if (commandObj) {
        const signature = commandObj.signature;
        const result = await parseSignature(context, args, signature);
        return commandObj.execute(context, result);
      }
    }
  }
}

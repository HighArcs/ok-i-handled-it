import { Client } from "discord.js";

export interface Command {}

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
  add(options: Command) {
    this.commands.push(options);
  }
}

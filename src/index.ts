import {
  BaseGuildTextChannel,
  Client,
  Message,
  PermissionResolvable,
  Permissions,
} from "discord.js";
import { parseSignature, Signature } from "./signature";
import { Awaitable } from "./tools/types";

export interface CommandMetadata<T> {
  description?: string;
  usage?: string;
  examples?: Array<string>;
  other?: {
    [key: string]: any;
  };
}
export interface OkFilter {
  ignoreBots?: boolean;
  onBotCancel?: (message: Message) => Awaitable<void>;
  ignoreSelf?: boolean;
  onSelfCancel?: (message: Message) => Awaitable<void>;
  ignoreDMs?: boolean;
  onDMCancel?: (message: Message) => Awaitable<void>;
}
export interface CommandFilter<T> extends OkFilter {
  permissions?: Array<PermissionResolvable>;
  onPermissionsCancel?: (
    message: Message,
    args: T,
    permissions: Permissions
  ) => Awaitable<any>;
  clientPermissions?: Array<PermissionResolvable>;
  onClientPermissionsCancel?: (
    message: Message,
    args: T,
    permissions: Permissions
  ) => Awaitable<any>;
  nsfw?: boolean;
  onNsfwCancel?: (message: Message, args: T) => Awaitable<any>;
}

export interface Command<T = any> {
  name: string;
  aliases?: Array<string>;
  signature: Signature<T>;
  metadata?: CommandMetadata<T>;
  filter?: CommandFilter<T>;
  execute: (context: Message, args: T) => Awaitable<any>;
  onError?: (context: Message, error: Error) => Awaitable<any>;
  onBefore?: (context: Message) => Awaitable<boolean>;
  onCancel?: (context: Message) => Awaitable<boolean>;
  onBeforeRun?: (context: Message, args: T) => Awaitable<any>;
  onSuccess?: (context: Message, args: T, output: any) => Awaitable<any>;
  onTypeError?: (
    context: Message,
    errors: Record<string, Error>
  ) => Awaitable<any>;
}

export interface OkEvents {
  onPrefixCheck?: (
    context: Message,
    prefixes: Array<string>
  ) => Awaitable<Array<string>>;
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

export class Ok {
  protected readonly client: Client;
  protected prefixes: Array<string> = [];
  protected commands: Array<Command> = [];
  protected replies: Map<string, Message> = new Map();
  protected options: Required<OkOptions>;

  constructor(client: Client, options: OkOptions) {
    this.client = client;
    this.options = Object.assign(
      <OkOptions>{
        prefix: [],
        filter: {},
        events: {},
        deleteResponse: false,
        editResponse: false,
      },
      options
    ) as globalThis.Required<OkOptions>;
    if (this.options.prefix) {
      if (typeof this.options.prefix === "string") {
        this.prefixes = [this.options.prefix];
      } else {
        this.prefixes = [...this.options.prefix];
      }
    }
    this.prefixes.sort((a, b) => b.length - a.length);
  }
  get(name: string) {
    return this.commands.find(
      (c) => c.name === name || (c.aliases || []).includes(name)
    );
  }
  add<T>(options: Command<T>) {
    this.commands.push(options);
    return this;
  }
  addMultiple(commands: Array<Command> = []) {
    for (let command of commands) {
      this.add(command);
    }
    return this;
  }

  async exec(context: Message) {
    if (this.options.events.onMessageCheck) {
      const result = await this.options.events.onMessageCheck(context);
      if (!result) {
        if (this.options.events.onMessageCheckCancel) {
          await this.options.events.onMessageCheckCancel(context);
        }
        return;
      }
    }

    if (this.options.filter.ignoreBots) {
      if (context.author.bot) {
        if (this.options.filter.onBotCancel) {
          await this.options.filter.onBotCancel(context);
        }
        return;
      }
    }
    if (this.options.filter.ignoreSelf) {
      if (context.author.id === this.client.user!.id) {
        if (this.options.filter.onSelfCancel) {
          await this.options.filter.onSelfCancel(context);
        }
        return;
      }
    }
    if (this.options.filter.ignoreDMs) {
      if (context.channel.type === "DM") {
        if (this.options.filter.onDMCancel) {
          await this.options.filter.onDMCancel(context);
        }
        return;
      }
    }

    let prefixes = this.prefixes;
    if (this.options.events && this.options.events.onPrefixCheck) {
      prefixes = await this.options.events.onPrefixCheck(context, prefixes);
    }
    const prefixRegex = new RegExp(`^(${prefixes.join("|")})(.*)$`);
    const match = context.content.match(prefixRegex);
    if (!match || !match.length) {
      return;
    }
    const prefix = match.join("");
    const args = context.content.slice(prefix.length).trim().split(/ +/);
    const name = args.shift()!.toLowerCase();
    const command = this.commands.find((c) => c.name.toLowerCase() === name);

    if (!command) {
      return;
    }

    if (this.options.events.onCommandCheck) {
      const result = await this.options.events.onCommandCheck(context, command);
      if (!result) {
        if (this.options.events.onCommandCheckCancel) {
          await this.options.events.onCommandCheckCancel(context, command);
        }
        return;
      }
    }

    if (command.onBefore) {
      const result = await command.onBefore(context);
      if (!result) {
        if (command.onCancel) {
          await command.onCancel(context);
        }
        return;
      }
    }

    if (command.onBeforeRun) {
      await command.onBeforeRun(context, args);
    }

    const signature = await parseSignature(context, args, command.signature);

    if (command.filter) {
      if (command.filter.nsfw) {
        if (context.channel instanceof BaseGuildTextChannel) {
          if (!context.channel.nsfw) {
            if (command.filter.onNsfwCancel) {
              await command.filter.onNsfwCancel(context, signature);
            }
            return;
          }
        }
      }
    }

    if (command.onTypeError) {
      const errors = Object.keys(signature.errors);
      if (errors.length) {
        await command.onTypeError(context, signature.errors);
        return;
      }
    }

    let output: any;
    try {
      output = await command.execute(context, signature.output);
    } catch (error) {
      if (command.onError) {
        await command.onError(context, error);
      }
      return;
    }

    if (command.onSuccess) {
      await command.onSuccess(context, signature.output, output);
    }

    if (output instanceof Message) {
      this.replies.set(context.id, output);
    }

    return output;
  }

  async attach() {
    this.client.on("message", async (message) => {
      return this.exec(message);
    });
    this.client.on("messageUpdate", async (oldMessage, newMessage) => {
      if (this.options.editResponse) {
        if (newMessage instanceof Message) {
          return this.exec(newMessage);
        }
      }
    });
    this.client.on("messageDelete", async (message) => {
      if (this.options.deleteResponse) {
        if (message instanceof Message) {
          if (this.replies.has(message.id)) {
            this.replies.delete(message.id);
          }
        }
      }
    });
  }
}

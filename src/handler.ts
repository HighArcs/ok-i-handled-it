import { Awaitable, BaseGuildTextChannel, Client, Message } from "discord.js";
import path from "path";
import { Command } from "./command";
import { parseSignature } from "./signature";
import { getFiles } from "./tools/util";

export interface OkFilter {
  ignoreBots?: boolean;
  onBotCancel?: (message: Message) => Awaitable<void>;
  ignoreSelf?: boolean;
  onSelfCancel?: (message: Message) => Awaitable<void>;
  ignoreDMs?: boolean;
  onDMCancel?: (message: Message) => Awaitable<void>;
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

export interface DirectoryOptions {
  subdirectories?: boolean;
  absolute?: boolean;
}

export class Ok {
  readonly client: Client;
  protected prefixes: Array<string> = [];
  public commands: Array<Command> = [];
  public replies: Map<string, Message> = new Map();
  public options: Required<OkOptions>;

  protected directories: Map<string, DirectoryOptions> = new Map();

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

  async addMultipleIn(directory: string, options: DirectoryOptions) {
    options = Object.assign({ subdirectories: true }, options);
    if (!options.absolute) {
      if (require.main) {
        directory = path.join(path.dirname(require.main.filename), directory);
      }
    }
    this.directories.set(directory, options);

    const files = await getFiles(directory, options.subdirectories);
    const errors: Record<string, Error> = {};

    const add = (imported: any, path: string) => {
      if (!imported) {
        return;
      }
      if (Array.isArray(imported)) {
        for (let child of imported) {
          add(child, path);
        }
      } else {
        this.add(imported);
      }
    };

    for (let file of files) {
      if (![".js", ".ts"].includes(path.extname(file))) {
        continue;
      }
      const filepath = path.resolve(directory, file);
      try {
        let imported = require(filepath);
        if (typeof imported === "object" && imported.__esModule) {
          imported = imported.default;
        }
        add(imported, filepath);
      } catch (error) {
        errors[filepath] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new Error(
        `Failed to load ${Object.keys(errors).length} files:\n${Object.keys(
          errors
        )
          .map((file) => `\`${file}\`: ${errors[file].message}`)
          .join("\n")}`
      );
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
      const result = await command.onBefore(context, command);
      if (!result) {
        if (command.onCancel) {
          await command.onCancel(context, command);
        }
        return;
      }
    }

    if (command.onBeforeRun) {
      await command.onBeforeRun(context, args, command);
    }

    const signature = await parseSignature(
      context,
      args,
      command.signature || {}
    );

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
        await command.onTypeError(context, signature.errors, command);
        return;
      }
    }

    let output: any;
    try {
      output = await command.execute(context, signature.output, command);
    } catch (error) {
      if (command.onError) {
        await command.onError(context, error, command);
      }
      return;
    }

    if (command.onSuccess) {
      await command.onSuccess(context, signature.output, output, command);
    }

    if (output instanceof Message) {
      this.replies.set(context.id, output);
    }

    return output;
  }

  async attach() {
    this.client.on("messageCreate", async (message) => {
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

  async run(token: string) {
    await this.attach();
    await this.client.login(token);
  }
}

import {
  BaseGuildTextChannel,
  Client,
  ClientEvents,
  Message,
} from "discord.js";
import path from "node:path";
import { Command } from "./command";
import { parseSignature } from "./signature";
import { Awaitable, ParseType } from "./tools/types";
import { getFiles } from "./tools/util";
export interface OkFilter {
  ignoreBots?: boolean;
  onBotCancel?: (message: Message) => Awaitable<void>;
  ignoreSelf?: boolean;
  onSelfCancel?: (message: Message) => Awaitable<void>;
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
  other?: Array<
    ParseType<{ [K in keyof ClientEvents]: (...args: ClientEvents[K]) => any }>
  >;
}
export interface OkOptions {
  prefix?: Iterable<string> | string;
  filter?: OkFilter;
  events?: OkEvents;
  editResponse?: boolean;
  deleteResponse?: boolean;
  startup?: boolean;
}
export interface DirectoryOptions {
  subdirectories?: boolean;
  absolute?: boolean;
}
export class Ok {
  protected prefixes: Array<string> = [];
  public commands: Array<Command> = [];
  public replies: Map<string, Message> = new Map();
  public options: Required<OkOptions>;
  protected directories: Map<string, DirectoryOptions> = new Map();
  constructor(options: OkOptions) {
    this.options = Object.assign(
      {
        prefix: [],
        filter: {},
        events: {},
        deleteResponse: false,
        editResponse: false,
      } as OkOptions,
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
  addMultiple(...commands: Array<Command>) {
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
        if (error instanceof Error) {
          errors[filepath] = error;
        }
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
    if (this.options.events) {
      if (this.options.events.onMessageCheck) {
        const result = await this.options.events.onMessageCheck(context);
        if (!result) {
          if (this.options.events.onMessageCheckCancel) {
            await this.options.events.onMessageCheckCancel(context);
          }
          return;
        }
      }
    }

    if (this.options.filter) {
      if (this.options.filter.ignoreBots) {
        if (context.author.bot) {
          if (this.options.filter.onBotCancel) {
            await this.options.filter.onBotCancel(context);
          }
          return;
        }
      }
      if (this.options.filter.ignoreSelf) {
        if (context.author.id === context.client.user!.id) {
          if (this.options.filter.onSelfCancel) {
            await this.options.filter.onSelfCancel(context);
          }
          return;
        }
      }
    }

    let prefixes = this.prefixes;
    if (this.options.events && this.options.events.onPrefixCheck) {
      prefixes = await this.options.events.onPrefixCheck(context, prefixes);
    }

    const prefixRegex = new RegExp(
      `^(?:${prefixes
        .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|")})`
    );

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

    if (this.options.events) {
      if (this.options.events.onCommandCheck) {
        const result = await this.options.events.onCommandCheck(
          context,
          command
        );
        if (!result) {
          if (this.options.events.onCommandCheckCancel) {
            await this.options.events.onCommandCheckCancel(context, command);
          }
          return;
        }
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
        const channel = context.channel;
        if (channel instanceof BaseGuildTextChannel) {
          if (!channel.nsfw) {
            if (command.filter.onNsfwCancel) {
              await command.filter.onNsfwCancel(context, signature);
            }
            return;
          }
        }
      }
      if (command.filter.permissions) {
        if (context.member) {
          const passed = command.filter.permissions.filter((value) => {
            return !context.member?.permissions.has(value);
          });
          if (passed.length) {
            if (command.filter.onPermissionsCancel) {
              command.filter.onPermissionsCancel(context, args, passed);
            }
            return;
          }
        }
      }
      if (command.filter.clientPermissions) {
        const guild = context.guild!;
        const self = guild.me!;
        const passed = command.filter.clientPermissions.filter((value) => {
          return !self?.permissions.has(value);
        });
        if (passed.length) {
          if (command.filter.onClientPermissionsCancel) {
            command.filter.onClientPermissionsCancel(context, args, passed);
          }
          return;
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
        await command.onError(context, error as Error, command);
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

  attach(client: Client) {
    client.on("messageCreate", this.exec.bind(this));
    if (this.options.editResponse) {
      client.on("messageUpdate", async (_unused_old, payload) => {
        if (payload instanceof Message) {
          return this.exec(payload);
        }
      });
    }
    if (this.options.deleteResponse) {
      client.on("messageDelete", async (old) => {
        if (this.replies.has(old.id)) {
          const payload = this.replies.get(old.id);
          if (payload) {
            await payload.delete();
          }
        }
      });
    }

    if (this.options.events) {
      if (this.options.events.other) {
        for (let [name, callee] of this.options.events.other) {
          // @ts-ignore: TS2339
          client.on(name, callee);
        }
      }
    }
  }
}

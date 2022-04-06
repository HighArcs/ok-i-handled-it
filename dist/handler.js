"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ok = void 0;
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const signature_1 = require("./signature");
const util_1 = require("./tools/util");
class Ok {
    client;
    prefixes = [];
    commands = [];
    replies = new Map();
    options;
    directories = new Map();
    constructor(client, options) {
        this.client = client;
        this.options = Object.assign({
            prefix: [],
            filter: {},
            events: {},
            deleteResponse: false,
            editResponse: false,
        }, options);
        if (this.options.prefix) {
            if (typeof this.options.prefix === "string") {
                this.prefixes = [this.options.prefix];
            }
            else {
                this.prefixes = [...this.options.prefix];
            }
        }
        this.prefixes.sort((a, b) => b.length - a.length);
    }
    get(name) {
        return this.commands.find((c) => c.name === name || (c.aliases || []).includes(name));
    }
    add(options) {
        this.commands.push(options);
        return this;
    }
    addMultiple(commands = []) {
        for (let command of commands) {
            this.add(command);
        }
        return this;
    }
    async addMultipleIn(directory, options) {
        options = Object.assign({ subdirectories: true }, options);
        if (!options.absolute) {
            if (require.main) {
                directory = path_1.default.join(path_1.default.dirname(require.main.filename), directory);
            }
        }
        this.directories.set(directory, options);
        const files = await (0, util_1.getFiles)(directory, options.subdirectories);
        const errors = {};
        const add = (imported, path) => {
            if (!imported) {
                return;
            }
            if (Array.isArray(imported)) {
                for (let child of imported) {
                    add(child, path);
                }
            }
            else {
                this.add(imported);
            }
        };
        for (let file of files) {
            if (![".js", ".ts"].includes(path_1.default.extname(file))) {
                continue;
            }
            const filepath = path_1.default.resolve(directory, file);
            try {
                let imported = require(filepath);
                if (typeof imported === "object" && imported.__esModule) {
                    imported = imported.default;
                }
                add(imported, filepath);
            }
            catch (error) {
                errors[filepath] = error;
            }
        }
        if (Object.keys(errors).length > 0) {
            throw new Error(`Failed to load ${Object.keys(errors).length} files:\n${Object.keys(errors)
                .map((file) => `\`${file}\`: ${errors[file].message}`)
                .join("\n")}`);
        }
        return this;
    }
    async exec(context) {
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
            if (context.author.id === this.client.user.id) {
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
        const name = args.shift().toLowerCase();
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
        const signature = await (0, signature_1.parseSignature)(context, args, command.signature || {});
        if (command.filter) {
            if (command.filter.nsfw) {
                if (context.channel instanceof discord_js_1.BaseGuildTextChannel) {
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
        let output;
        try {
            output = await command.execute(context, signature.output, command);
        }
        catch (error) {
            if (command.onError) {
                await command.onError(context, error, command);
            }
            return;
        }
        if (command.onSuccess) {
            await command.onSuccess(context, signature.output, output, command);
        }
        if (output instanceof discord_js_1.Message) {
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
                if (newMessage instanceof discord_js_1.Message) {
                    return this.exec(newMessage);
                }
            }
        });
        this.client.on("messageDelete", async (message) => {
            if (this.options.deleteResponse) {
                if (message instanceof discord_js_1.Message) {
                    if (this.replies.has(message.id)) {
                        this.replies.delete(message.id);
                    }
                }
            }
        });
    }
    async run(token) {
        await this.attach();
        await this.client.login(token);
    }
}
exports.Ok = Ok;

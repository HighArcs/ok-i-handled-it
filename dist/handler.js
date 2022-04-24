"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ok = void 0;
const discord_js_1 = require("discord.js");
const signature_1 = require("./signature");
class Ok {
    prefixes = [];
    commands = [];
    replies = new Map();
    options;
    constructor(options) {
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
    addMultiple(...commands) {
        for (let command of commands) {
            this.add(command);
        }
        return this;
    }
    async exec(context) {
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
                if (context.author.id === context.client.user.id) {
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
        const prefixRegex = new RegExp(`^(?:${prefixes
            .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|")})`);
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
        if (this.options.events) {
            if (this.options.events.onCommandCheck) {
                const result = await this.options.events.onCommandCheck(context, command);
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
        const signature = await (0, signature_1.parseSignature)(context, args, command.signature || {});
        if (command.filter) {
            if (command.filter.nsfw) {
                const channel = context.channel;
                if (channel instanceof discord_js_1.BaseGuildTextChannel) {
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
                const guild = context.guild;
                const self = guild.me;
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
    attach(client) {
        client.on("messageCreate", this.exec.bind(this));
        if (this.options.editResponse) {
            client.on("messageUpdate", async (_unused_old, payload) => {
                if (payload instanceof discord_js_1.Message) {
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
                    client.on(name, callee);
                }
            }
        }
    }
}
exports.Ok = Ok;

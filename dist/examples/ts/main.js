"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const __1 = require("../..");
let token = "";
const client = new discord_js_1.Client({
    intents: [],
    ws: { properties: { $browser: "iOS" } },
});
const ok = new __1.Ok(client, {
    events: {},
    filter: {
        ignoreDMs: true,
        onDMCancel(message) {
            message.reply("not allowed in dms :(");
        },
        ignoreSelf: true,
        ignoreBots: true,
    },
    deleteResponse: true,
    editResponse: true,
    prefix: ".",
});
ok.addMultipleIn("./commands", { subdirectories: true });
ok.add({
    name: "ping",
    async execute(context, args) {
        return await context.reply("pong");
    },
});
ok.add({
    name: "echo",
    signature: {
        text: __1.Parameters.string,
    },
    async execute(context, args) {
        return await context.reply({ allowedMentions: {}, content: args.text });
    },
});
ok.add({
    name: "coin",
    signature: {
        flip: {
            type: __1.Parameters.string,
            choices: ["heads", "tails"],
            default: "heads",
        },
    },
    async execute(context, args) {
        const flip = args.flip;
        const coin = Math.random() < 0.5 ? "heads" : "tails";
        return await context.reply(`ok, you chose ${flip} and the coin landed on ${coin}, so you ${flip === coin ? "won" : "lost"}`);
    },
});
ok.run(token);
ok.client.on("ready", async (payload) => {
    console.log("ok it works");
});

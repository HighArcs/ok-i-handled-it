import { Client } from "discord.js";
import { Ok, Parameters } from "../..";

let token = ""; // please dont hardcode your token lol

const client = new Client({
  intents: [],
  ws: { properties: { $browser: "iOS" } }, // lol
});

export const ok = new Ok(client, {
  events: {},
  filter: {
    ignoreDMs: true,
    onDMCancel(message) {
      message.reply("not allowed in dms :(");
    },
    ignoreSelf: true,
    ignoreBots: true,
  },
  // response tracking
  deleteResponse: true,
  editResponse: true,

  prefix: ".",
  // prefix: ['.', '..']
});

// import some commands
ok.addMultipleIn("./commands", { subdirectories: true });

// add a command
ok.add({
  name: "ping",
  async execute(context, args) {
    return await context.reply("pong");
  },
});

// command with args
ok.add({
  name: "echo",
  signature: {
    text: Parameters.string,
  },
  async execute(context, args) {
    return await context.reply({ allowedMentions: {}, content: args.text });
  },
});

// command with some logic and choices
ok.add({
  name: "coin",
  signature: {
    flip: {
      type: Parameters.string,
      choices: ["heads", "tails"],
      default: "heads",
    },
  },
  async execute(context, args) {
    const flip = args.flip;
    const coin = Math.random() < 0.5 ? "heads" : "tails";
    return await context.reply(
      `ok, you chose ${flip} and the coin landed on ${coin}, so you ${
        flip === coin ? "won" : "lost"
      }`
    );
  },
});

ok.run(token);
// verify it ran
ok.client.on("ready", async (payload) => {
  console.log("ok it works");
});

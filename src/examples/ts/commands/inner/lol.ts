import { Command } from "../../../../command";

export const lol: Command = {
  name: "lol",
  execute: async (context, args, command) => {
    return await context.reply(`ran from ${command.file}`);
  },
};

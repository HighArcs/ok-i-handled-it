export const lol = {
  name: "lol",
  execute: async (context, args, command) => {
    return await context.reply(`ran from ${command.file}`);
  },
};

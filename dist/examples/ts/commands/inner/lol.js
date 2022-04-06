"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lol = void 0;
exports.lol = {
    name: "lol",
    execute: async (context, args, command) => {
        return await context.reply(`ran from ${command.file}`);
    },
};

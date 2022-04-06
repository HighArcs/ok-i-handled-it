"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name: "ok",
    metadata: {
        description: "yea",
    },
    async execute(context, args) {
        return await context.reply("ok");
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parameters = exports.Builtin = void 0;
const markup_1 = require("./tools/markup");
var Builtin;
(function (Builtin) {
    Builtin["BOOLEAN"] = "boolean";
    Builtin["NUMBER"] = "number";
    Builtin["INTEGER"] = "integer";
    Builtin["STRING"] = "string";
    Builtin["MENTION"] = "mention";
    Builtin["MENTION_USER"] = "mentionUser";
    Builtin["MENTION_CHANNEL"] = "mentionChannel";
    Builtin["MENTION_ROLE"] = "mentionRole";
    Builtin["DATE"] = "date";
    Builtin["BIGINT"] = "bigint";
    Builtin["URL"] = "url";
    Builtin["FILE"] = "file";
})(Builtin = exports.Builtin || (exports.Builtin = {}));
exports.Parameters = {
    [Builtin.BOOLEAN]: (value, context) => {
        return value.toLowerCase() === "true";
    },
    [Builtin.NUMBER]: (value, context) => {
        return Number(value);
    },
    [Builtin.INTEGER]: (value, context) => {
        return parseInt(value);
    },
    [Builtin.STRING]: (value, context) => {
        return value;
    },
    [Builtin.MENTION]: (value, context) => {
        return markup_1.Match.mention(value);
    },
    [Builtin.MENTION_USER]: (value, context) => {
        return markup_1.Match.mentionUser(value);
    },
    [Builtin.MENTION_CHANNEL]: (value, context) => {
        return markup_1.Match.mentionChannel(value);
    },
    [Builtin.MENTION_ROLE]: (value, context) => {
        return markup_1.Match.mentionRole(value);
    },
    [Builtin.DATE]: (value, context) => {
        return new Date(value);
    },
    [Builtin.BIGINT]: (value, context) => {
        return BigInt(value);
    },
    [Builtin.URL]: (value, context) => {
        if (!value.startsWith("http")) {
            value = `http://${value}`;
        }
        return new URL(value);
    },
    [Builtin.FILE]: (value, context) => {
        return context.attachments.first();
    },
};

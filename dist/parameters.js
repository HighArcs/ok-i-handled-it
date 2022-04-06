"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parameters = void 0;
var Parameters;
(function (Parameters) {
    function boolean(value, context) {
        return value.toLowerCase() === "true";
    }
    Parameters.boolean = boolean;
    function string(value, context) {
        return value;
    }
    Parameters.string = string;
    function number(value, context) {
        return Number(value);
    }
    Parameters.number = number;
    function float(value, context) {
        return Number.parseFloat(value);
    }
    Parameters.float = float;
    function integer(value, context) {
        return Number.parseInt(value);
    }
    Parameters.integer = integer;
    function bigint(value, context) {
        return BigInt(value);
    }
    Parameters.bigint = bigint;
    function channel(value, context) {
        if (value) {
            if (context.guild) {
                return context.guild.channels.cache.get(value);
            }
        }
        return context.channel;
    }
    Parameters.channel = channel;
    function member(value, context) {
        if (value) {
            if (context.guild) {
                return context.guild.members.cache.get(value);
            }
        }
        return context.member;
    }
    Parameters.member = member;
    function role(value, context) {
        if (value) {
            if (context.guild) {
                return context.guild.roles.resolve(value);
            }
        }
        else if (context.member) {
            return context.member.roles.highest;
        }
    }
    Parameters.role = role;
    function emoji(value, context) {
        return context.client.emojis.resolve(value);
    }
    Parameters.emoji = emoji;
    function user(value, context) {
        return context.client.users.resolve(value);
    }
    Parameters.user = user;
    function date(value, context) {
        if (value) {
            return new Date(value);
        }
        return new Date();
    }
    Parameters.date = date;
})(Parameters = exports.Parameters || (exports.Parameters = {}));

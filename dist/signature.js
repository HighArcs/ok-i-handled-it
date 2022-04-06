"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSignature = void 0;
const types_1 = require("./tools/types");
async function parseSignature(context, args, signature) {
    const result = {};
    const errors = {};
    const entries = Object.entries(signature);
    for (let [key, parameter] of entries) {
        if (parameter instanceof Function) {
            parameter = {
                type: parameter,
            };
        }
        let name = parameter.name || key;
        const value = args.shift();
        check: if (value === undefined) {
            if (parameter.default) {
                const def = await (0, types_1.resolve)(parameter.default);
                result[key] = def;
                break check;
            }
            if (parameter.required === true) {
                errors[name] = new TypeError(`Missing required parameter '${name}'`);
            }
        }
        if (value !== undefined) {
            if (parameter.choices) {
                const choices = [...(await (0, types_1.resolve)(parameter.choices))];
                if (!choices.includes(value)) {
                    errors[name] = new TypeError(`Invalid value for parameter ${name}: ${value} (must be one of [ ${parameter.choices.join(", ")} ])`);
                }
            }
            if (parameter.type) {
                try {
                    result[key] = parameter.type(value, context);
                }
                catch (error) {
                    errors[name] = error;
                }
            }
            else {
                result[name] = value;
            }
        }
    }
    return {
        context,
        output: result,
        signature,
        raw: args,
        errors,
    };
}
exports.parseSignature = parseSignature;

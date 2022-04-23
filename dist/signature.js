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
        let value = args.shift();
        if (parameter.default) {
            if (parameter.default instanceof Function) {
                value = value || (await parameter.default(context));
            }
            else {
                value = value || parameter.default;
            }
        }
        if (parameter.required !== false && value === undefined) {
            errors[key] = new TypeError(`Missing required parameter '${name}'`);
            continue;
        }
        if (parameter.type) {
            try {
                result[key] = await parameter.type(value, context);
            }
            catch (error) {
                errors[key] = error;
                continue;
            }
        }
        else {
            result[key] = value;
            if (parameter.choices) {
                const choices = await (0, types_1.resolve)(parameter.choices);
                if (!choices.includes(result[key])) {
                    errors[key] = new TypeError(`Invalid value for "${name}": ${value} (must be one of [${choices.join(", ")}])`);
                    continue;
                }
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

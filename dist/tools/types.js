"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = void 0;
async function resolve(value, ...args) {
    if (value instanceof Function) {
        return await value(...args);
    }
    return await value;
}
exports.resolve = resolve;

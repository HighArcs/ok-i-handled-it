import { Message } from "discord.js";

export interface Parameter<T, R extends boolean = true> {
  name?: string;
  type: (
    value: R extends true ? string : string | undefined,
    context: Message
  ) => T;
  required?: R;
  default?: T | ((value: string, context: Message) => T);
  choices?: Array<T>;
}

export type Signature<T> = {
  [K in keyof T]: Parameter<T[K]>;
};

export function parseSignature<T>(
  context: Message,
  args: Array<string>,
  signature: Signature<T>
): T {
  const result: any = {};

  const entries = Object.entries(signature);
  for (let key = 0; key < args.length; key++) {
    const arg = args[key];
    const entry = entries[key];
    if (!entry) {
      break;
    }

    const [name, p] = entry;
    const parameter = p as Parameter<any>;
    if (parameter.required && !arg) {
      throw new Error(`Missing required parameter: ${name}`);
    }
    const value = parameter.type(arg, context);
    if (parameter.choices && parameter.choices.indexOf(value) === -1) {
      throw new Error(`Invalid choice: ${value}`);
    }
    result[name] = value;
  }

  return result;
}

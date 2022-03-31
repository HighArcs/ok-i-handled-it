import { Message } from "discord.js";
import { Arrayable, Awaitable, Resolvable, resolve } from "./tools/types";

export type ParameterType<T> = (
  value: string,
  context?: Message
) => Awaitable<T>;

export interface Parameter<T> {
  name?: string;
  type: ParameterType<T>;
  required?: boolean;
  default?: Resolvable<T | ParameterType<T>>;
  choices?: Resolvable<Arrayable<T>>;
}

export type Signature<T> = {
  [K in keyof T]: Parameter<T[K]>;
};

export async function parseSignature<T>(
  context: Message,
  args: Array<string>,
  signature: Signature<T>
): Promise<T> {
  const result: any = {};

  const entries: Array<[string, Parameter<any>]> = Object.entries(signature);
  for (const [key, parameter] of entries) {
    let name = parameter.name || key;
    const value = args.shift();
    check: if (value === undefined) {
      if (parameter.default) {
        const def = await resolve(parameter.default);
        result[key] = def;
        break check;
      }
      if (parameter.required === true) {
        throw new Error(`Missing required parameter '${name}'`);
      }
    }
    if (value !== undefined) {
      if (parameter.choices) {
        const choices = [...(await resolve<Arrayable<any>>(parameter.choices))];
        if (!choices.includes(value)) {
          throw new Error(
            `Invalid value for parameter ${name}: ${value} (must be one of [ ${parameter.choices.join(
              ", "
            )} ])`
          );
        }
      }
      if (parameter.type) {
        result[name] = await parameter.type(value, context);
      } else {
        result[name] = value;
      }
    }
  }

  return result;
}

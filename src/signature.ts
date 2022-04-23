import { Message } from "discord.js";
import { Awaitable, Resolvable, resolve } from "./tools/types";

export type ParameterType<T> = (
  value: string,
  context: Message
) => Awaitable<T>;

export type ParameterDefault<T> = (context: Message) => Awaitable<T>;

export interface Parameter<T> {
  name?: string;
  type: ParameterType<T>;
  required?: boolean;
  default?: ParameterDefault<string> | string;
  choices?: Resolvable<Array<T>>;
}

export type Signature<T> = {
  [K in keyof T]: Parameter<T[K]> | ParameterType<T[K]>;
};

export interface SignatureResult<T> {
  signature: Signature<T>;
  raw: Array<string>;
  context: Message;
  output: T;
  errors: Record<string, TypeError>;
}

export async function parseSignature<T>(
  context: Message,
  args: Array<string>,
  signature: Signature<T>
): Promise<SignatureResult<T>> {
  const result: any = {};
  const errors: Record<string, TypeError> = {};

  const entries: Array<[string, Parameter<any> | ParameterType<any>]> =
    Object.entries(signature);
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
      } else {
        value = value || parameter.default;
      }
    }

    if (parameter.required !== false && value === undefined) {
      errors[key] = new TypeError(`Missing required parameter '${name}'`);
      continue;
    }

    if (parameter.type) {
      try {
        result[key] = await parameter.type(value!, context);
      } catch (error) {
        errors[key] = error as TypeError;
        continue;
      }
    } else {
      result[key] = value;

      if (parameter.choices) {
        const choices = await resolve(parameter.choices);
        if (!choices.includes(result[key])) {
          errors[key] = new TypeError(
            `Invalid value for "${name}": ${value} (must be one of [${choices.join(
              ", "
            )}])`
          );
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

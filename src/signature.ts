import { Message } from "discord.js";
import { Builtin, Parameters } from "./parameters";
import { Arrayable, Awaitable, Resolvable, resolve } from "./tools/types";

export type ParameterType<T> = (
  value: string,
  context: Message
) => Awaitable<T>;
// | Builtin;
// | keyof typeof Builtin;

export interface Parameter<T> {
  name?: string;
  type: ParameterType<T>;
  required?: boolean;
  default?: Resolvable<T | ParameterType<T>>;
  choices?: Resolvable<Arrayable<T>>;
}

export type Signature<T> = {
  [K in keyof T]: Parameter<T[K]> | ParameterType<T[K]> | Builtin;
};

export interface SignatureResult<T> {
  signature: Signature<T>;
  raw: Array<string>;
  context: Message;
  output: T;
  errors: Record<string, Error>;
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
    if (typeof parameter === "string") {
      parameter = { type: Parameters[parameter] };
    }
    if (parameter instanceof Function) {
      parameter = {
        type: parameter,
      };
    }
    let name = parameter.name || key;
    const value = args.shift();
    check: if (value === undefined) {
      if (parameter.default) {
        const def = await resolve(parameter.default);
        result[key] = def;
        break check;
      }
      if (parameter.required === true) {
        errors[name] = new TypeError(`Missing required parameter '${name}'`);
      }
    }
    if (value !== undefined) {
      if (parameter.choices) {
        const choices = [...(await resolve<Arrayable<any>>(parameter.choices))];
        if (!choices.includes(value)) {
          errors[name] = new TypeError(
            `Invalid value for parameter ${name}: ${value} (must be one of [ ${parameter.choices.join(
              ", "
            )} ])`
          );
        }
      }
      if (parameter.type) {
        try {
          result[key] = parameter.type(value, context);
        } catch (error) {
          errors[name] = error as TypeError;
        }
      } else {
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

export type T = true;
export type F = false;
export type B = T | F;
export type U = undefined;

export type If<Condition, Then, Else> = Condition extends T ? Then : Else;
export type Not<X> = X extends T ? F : T;
export type And<X, Y> = X extends true
  ? Y extends true
    ? true
    : false
  : false;
export type Or<X, Y> = X extends true ? true : Y extends true ? true : false;
export type Xor<X, Y> = X extends true
  ? Y extends true
    ? false
    : true
  : Y extends true
  ? true
  : false;

export type Awaitable<X> = X | Promise<X>;
export type Nullable<X> = X | null;
export type Optional<X> = X | undefined;
export type Required<X> = X extends undefined ? never : X;
export type Functional<X> = ((...args: any[]) => X) | X;
export type Recordable<X> = Record<string | number | symbol, X> | X;
export type Arrayable<X> = Array<X> | X;

export type Intersection<X, Y> = X & Y;
export type Union<X, Y> = X | Y;

export type Resolvable<X> = Functional<Awaitable<X>>;
export async function resolve<T>(
  value: Resolvable<T>,
  ...args: any[]
): Promise<T> {
  if (value instanceof Function) {
    return await value(...args);
  }
  return await value;
}

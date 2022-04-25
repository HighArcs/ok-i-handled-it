export type Awaitable<X> = X | Promise<X>;
export type Functional<X> = ((...args: any[]) => X) | X;
export type Arrayable<X> = Array<X> | X;

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
// robbing sern lol
export type ParseType<T> = {
  [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

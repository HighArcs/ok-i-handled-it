export declare type Awaitable<X> = X | Promise<X>;
export declare type Functional<X> = ((...args: any[]) => X) | X;
export declare type Arrayable<X> = Array<X> | X;
export declare type Resolvable<X> = Functional<Awaitable<X>>;
export declare function resolve<T>(value: Resolvable<T>, ...args: any[]): Promise<T>;
export declare type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

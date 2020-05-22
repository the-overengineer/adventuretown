type Fn<A, B> = (x: A) => B;

export function compose<A>(): Fn<A, A>;
export function compose<A, B>(a: Fn<A, B>): Fn<A, B>;
export function compose<A, B, C>(a: Fn<A, B>, b: Fn<B, C>): Fn<A, C>;
export function compose<A, B, C, D>(a: Fn<A, B>, b: Fn<B, C>, c: Fn<C, D>): Fn<A, D>;
export function compose<A, B, C, D, E>(a: Fn<A, B>, b: Fn<B, C>, c: Fn<C, D>, d: Fn<D, E>): Fn<A, E>;
export function compose<A, B, C, D, E, F>(a: Fn<A, B>, b: Fn<B, C>, c: Fn<C, D>, d: Fn<D, E>, e: Fn<E, F>): Fn<A, F>;
export function compose<A, B, C, D, E, F, G>(a: Fn<A, B>, b: Fn<B, C>, c: Fn<C, D>, d: Fn<D, E>, e: Fn<E, F>, f: Fn<F, G>): Fn<A, G>;
export function compose<A, R>(...fns: Array<Fn<any, any>>): Fn<A, R>;
export function compose(...fns: Array<Fn<any, any>>) {
  return (a: any) => fns.reduce((arg, currFn) => currFn(arg), a);
}

export const inject = <T, R, F extends (x: T) => R>(f: F, consumer: (result: R) => (x: T) => T) =>
  (it: T): T => consumer(f(it))(it);

export const enumValues = <E>(enumeration: any): E[] =>
  Object.keys(enumeration).filter((it) => typeof (enumeration as any)[it] === 'string') as unknown as E[];

export const clamp = (value: number, min?: number, max?: number) => {
  const valueWithMin = min != null ? Math.max(value, min) : value;
  return max != null ? Math.min(max, valueWithMin) : value;
}

export const stableSort = <T>(xs: T[], compare: (x: T, y: T) => number) => xs
  .map((item, index) => ({ item, index }))
  .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
  .map(({ item }) => item);

export const compose = <A>(...fns: Array<(a: A) => A>) =>
  (a: A): A => fns.reduce((arg, fn) => fn(arg), a);

export const enumValues = <E>(enumeration: any): E[] =>
  Object.keys(enumeration).filter((it) => typeof (enumeration as any)[it] === 'string') as unknown as E[];

export const clamp = (value: number, min?: number, max?: number) => {
  const valueWithMin = min != null ? Math.max(value, min) : value;
  return max != null ? Math.min(max, valueWithMin) : value;
}

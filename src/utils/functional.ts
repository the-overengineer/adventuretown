export const compose = <A>(...fns: Array<(a: A) => A>) =>
  (a: A): A => fns.reduce((arg, fn) => fn(arg), a);

export const enumValues = <E>(enumeration: any): E[] =>
  Object.keys(enumeration).filter((it) => typeof (enumeration as any)[it] === 'string') as unknown as E[];

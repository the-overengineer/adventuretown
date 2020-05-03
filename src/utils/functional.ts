export const compose = <A>(...fns: Array<(a: A) => A>) =>
  (a: A): A => fns.reduce((arg, fn) => fn(arg), a);

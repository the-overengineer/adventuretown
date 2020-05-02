import { IGameState } from 'types/state';

type Transformer = (gameState: IGameState, tickNumber: number) => IGameState;

const compose = <A, B>(...fns: Array<(a: A, b: B) => A>) =>
  (a: A, b: B): A => fns.reduce((arg, fn) => fn(arg, b), a);

const handlers: Transformer[] = [

];

export const processTick = compose<IGameState, number>(...handlers);
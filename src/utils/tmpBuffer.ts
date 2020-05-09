import { IGameState } from 'types/state';


export const getTmp = <T>(key: string, defaultValue: T) => (state: IGameState): T =>
  (state.tmp?.get(key) as T) ?? defaultValue;

export const hasTmp = (key: string) => (state: IGameState): boolean =>
  (state.tmp?.has(key)) ?? false;

export const setTmp = <T>(key: string, value: T) => (state: IGameState): IGameState => {
  const tmp = state.tmp ?? new Map<string, any>();
  tmp.set(key, value);

  return {
    ...state,
    tmp,
  };
};

export const updateTmp = <T>(key: string, defaultValue: T, update: (it: T) => T) => (state: IGameState): IGameState =>
  setTmp(key, update(getTmp(key, defaultValue)(state)))(state)

export const removeTmp = (key: string) => (state: IGameState): IGameState => {
  if (state.tmp == null || !state.tmp.has(key)) {
    return state;
  }

  const tmp = state.tmp;
  tmp.delete(key);

  return {
    ...state,
    tmp,
  };
};

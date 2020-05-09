import { IGameState } from 'types/state';

const KEY: string = '_adventureTownState';

interface IMapObject<V> {
  [key: string]: V;
}

const mapToObj = <V>(map: Map<string, V>): IMapObject<V> => {
  const obj: IMapObject<V> = {};
  for (let [k, v] of Array.from(map.entries())) {
    obj[k] = v;
  }
  return obj;
}

const objToMap = <V>(obj: IMapObject<V>): Map<string, V> => {
  const map: Map<string, V> = new Map();
  Object.keys(obj).forEach((key) => {
    map.set(key, obj[key]);
  });
  return map;
}

export const saveGame = (state: IGameState) => {
  const storedState = JSON.stringify({
    ...state,
    tmp: state.tmp ? mapToObj(state.tmp) : undefined,
  });
  localStorage.setItem(
    KEY,
    storedState,
  );
}

export const hasSavedGame = (): boolean =>
  localStorage.getItem(KEY) != null;

export const loadGame = (): IGameState => {
  const baseGameState = JSON.parse(localStorage.getItem(KEY)!) as IGameState;
  console.log({
    ...baseGameState,
    tmp: baseGameState.tmp ? objToMap(baseGameState.tmp as any) : undefined,
  });
  return {
    ...baseGameState,
    tmp: baseGameState.tmp ? objToMap(baseGameState.tmp as any) : undefined,
  };
};

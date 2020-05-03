import { IGameState } from 'types/state';

const KEY: string = '_adventureTownState';

export const saveGame = (state: IGameState) => {
  localStorage.setItem(
    KEY,
    JSON.stringify(state),
  );
}

export const hasSavedGame = (): boolean => {
  return localStorage.getItem(KEY) != null;
}

export const loadGame = (): IGameState => {
  return JSON.parse(localStorage.getItem(KEY)!) as IGameState;
}

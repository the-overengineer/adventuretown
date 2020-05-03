import { IGameState, CharacterFlag, WorldFlag } from 'types/state';

export const setCharacterFlag = (flag: CharacterFlag, to: boolean) =>
  (state: IGameState): IGameState => ({
    ...state,
    characterFlags: {
      ...state.characterFlags,
      [flag]: to || undefined,
    },
  });

export const setWorldFlag = (flag: WorldFlag, to: boolean) =>
  (state: IGameState): IGameState => ({
    ...state,
    worldFlags: {
      ...state.worldFlags,
      [flag]: to || undefined,
    },
  });

import { IGameState, CharacterFlag, WorldFlag, Gender } from 'types/state';

export const setCharacterFlag = (flag: CharacterFlag, to: boolean = true) =>
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

export const pregnancyChance = (flag: 'pregnantLover' | 'spousePregnant') => (state: IGameState): IGameState => {
  const chance = state.characterFlags.focusFamily!
    ? 0.35
    : 0.2;

  if (Math.random() > chance) {
    return state; //No baby here
  }

  if (state.character.gender === Gender.Male) {
    return setWorldFlag(flag, true)(state);
  } else if (state.characterFlags.unknowinglyPregnant !== true && state.characterFlags.pregnant !== true) {
    return setCharacterFlag('unknowinglyPregnant', true)(state);
  } else {
    return state;
  }
}

import {
  IGameState,
  StateTransformer,
} from 'types/state';
import { notify } from 'utils/message';
import { saveGame as saveGameLocally } from 'utils/storage';

export const saveGame: StateTransformer = (state: IGameState): IGameState => {
  if (state.daysPassed % 30 === 0) {
    try {
      const updatedState = notify('Game saved')(state);
      saveGameLocally(updatedState);
      return updatedState;
    } catch (error) {
      console.error(error);
      return notify('Saving the game failed')(state);
    }
  }

  return state;
}
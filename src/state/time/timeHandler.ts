import {
  IGameState,
  StateTransformer,
} from 'types/state';

export const incrementTime: StateTransformer = (state: IGameState): IGameState =>
  ({ ...state, daysPassed: state.daysPassed + 1 });
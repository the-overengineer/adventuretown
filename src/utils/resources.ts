import { IGameState, IResources, ICharacterFinances } from 'types/state';

export const changeResource = (resource: keyof IResources, amount: number) =>
  (state: IGameState): IGameState => ({
    ...state,
    resources: {
      ...state.resources,
      [resource]: Math.max(0, state.resources[resource] + amount),
    },
  });

export const changeFinance = (finance: keyof ICharacterFinances, amount: number) =>
  (state: IGameState): IGameState => ({
    ...state,
    finances: {
      ...state.finances,
      [finance]: state.finances[finance] + amount,
    },
  });

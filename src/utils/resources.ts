import { IGameState, IResources } from 'types/state';

export const changeResource = (resource: keyof IResources, amount: number) =>
  (state: IGameState): IGameState => ({
    ...state,
    resources: {
      ...state.resources,
      [resource]: state.resources[resource] + amount,
    },
  });

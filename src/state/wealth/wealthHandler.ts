import {
  IGameState,
  Profession,
  ProfessionLevel,
  StateTransformer,
} from 'types/state';

import { getProfessionMap } from 'utils/employment';
import { changeFinance } from 'utils/resources';
import { compose } from 'utils/functional';

const coinsFromProfession = getProfessionMap({
  [Profession.BarWorker]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 2,
    [ProfessionLevel.Leadership]: 3,
  },
  [Profession.Farmer]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 2,
    [ProfessionLevel.Leadership]: 3,
  },
  [Profession.Guard]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 2,
    [ProfessionLevel.Leadership]: 3,
  },
  [Profession.Trader]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 3,
    [ProfessionLevel.Leadership]: 5,
  },
  [Profession.Politician]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 2,
    [ProfessionLevel.Leadership]: 4,
  },
}, 0);

const foodFromProfession = getProfessionMap({
  [Profession.BarWorker]: {
    [ProfessionLevel.Entry]: 0,
    [ProfessionLevel.Medium]: 1,
    [ProfessionLevel.Leadership]: 1,
  },
  [Profession.Farmer]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 2,
    [ProfessionLevel.Leadership]: 3,
  },
  [Profession.Guard]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 1,
    [ProfessionLevel.Leadership]: 2,
  },
  [Profession.Trader]: {
    [ProfessionLevel.Entry]: 0,
    [ProfessionLevel.Medium]: 1,
    [ProfessionLevel.Leadership]: 2,
  },
  [Profession.Politician]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 1,
    [ProfessionLevel.Leadership]: 2,
  },
}, 0);

const renownFromProfession = getProfessionMap({
  [Profession.BarWorker]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 1,
    [ProfessionLevel.Leadership]: 4,
  },
  [Profession.Farmer]: {
    [ProfessionLevel.Entry]: 0,
    [ProfessionLevel.Medium]: 0,
    [ProfessionLevel.Leadership]: 2,
  },
  [Profession.Guard]: {
    [ProfessionLevel.Entry]: 0,
    [ProfessionLevel.Medium]: 1,
    [ProfessionLevel.Leadership]: 3,
  },
  [Profession.Trader]: {
    [ProfessionLevel.Entry]: 0,
    [ProfessionLevel.Medium]: 1,
    [ProfessionLevel.Leadership]: 3,
  },
  [Profession.Politician]: {
    [ProfessionLevel.Entry]: 1,
    [ProfessionLevel.Medium]: 2,
    [ProfessionLevel.Leadership]: 5,
  },
}, 0);

export const calculateResourceAllocation = (state: IGameState): IGameState => ({
  ...state,
  finances: {
    coinIncome: coinsFromProfession(state.character),
    foodIncome: foodFromProfession(state.character),
    renownIncome: renownFromProfession(state.character),
    coinExpenses: 0,
    foodExpenses: 1 + state.relationships.children.length, // You and all your children need to be fed
    renownExpenses: 0,
  },
});

export const updateWealth = (state: IGameState): IGameState => ({
  ...state,
  resources: {
    coin: Math.max(0, state.resources.coin + state.finances.coinIncome - state.finances.coinExpenses),
    food: Math.max(0, state.resources.food + state.finances.foodIncome - state.finances.foodExpenses),
    renown: Math.max(0, state.resources.renown + state.finances.renownIncome - state.finances.renownExpenses),
  },
});

export const modifyIncomeExpensesFromTraits = (state: IGameState): IGameState => compose(...[
  state.characterFlags.criminalActivity ? changeFinance('coinIncome', 1) : undefined,
  state.characterFlags.focusFun ? changeFinance('coinExpenses', 1) : undefined,
  state.characterFlags.focusFun ? changeFinance('renownIncome', 1) : undefined,
  state.characterFlags.gardener ? changeFinance('foodIncome', 1) : undefined,
  state.characterFlags.poet ? changeFinance('renownIncome', 1) : undefined,
].filter(_ => _ != null) as StateTransformer[])(state);

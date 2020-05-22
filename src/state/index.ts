import {
  IGameState,
  StateTransformer,
} from 'types/state';

import {
  updateActiveEvent,
  updateEventQueue,
} from './event/event';
import { incrementTime } from './time/timeHandler';
import {
  calculateResourceAllocation,
  updateWealth,
  modifyIncomeExpensesFromTraits,
} from './wealth/wealthHandler';
import { compose } from 'utils/functional';
import { saveGame } from './storage/storage';

const handlers: StateTransformer[] = [
  incrementTime,
  calculateResourceAllocation,
  modifyIncomeExpensesFromTraits,
  updateWealth,
  updateEventQueue,
  updateActiveEvent,
  saveGame,
];

export const processTick = compose<IGameState, IGameState>(...handlers);
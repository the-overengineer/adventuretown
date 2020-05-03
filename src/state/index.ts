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
} from './wealth/wealthHandler';
import { compose } from 'utils/functional';

const handlers: StateTransformer[] = [
  incrementTime,
  calculateResourceAllocation,
  updateEventQueue,
  updateActiveEvent,
  updateWealth,
];

export const processTick = compose<IGameState>(...handlers);
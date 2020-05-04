import { IEvent } from 'types/state';
import { collectEvents } from 'utils/events';

import * as adventure from './adventure';

export const events: IEvent[] = [
  ...collectEvents(adventure),
]
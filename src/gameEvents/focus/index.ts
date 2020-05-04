import { IEvent } from 'types/state';
import { collectEvents } from 'utils/events';

import * as focus from './focus';

export const events: IEvent[] = [
  ...collectEvents(focus),
];

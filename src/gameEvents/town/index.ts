import { IEvent } from 'types/state';

import * as general from './general';
import { collectEvents } from 'utils/events';

export const events: IEvent[] = [
  ...collectEvents(general),
];
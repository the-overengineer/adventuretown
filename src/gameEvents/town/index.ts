import { IEvent } from 'types/state';

import * as general from './general';
import * as attacks from './attacks';
import { collectEvents } from 'utils/events';

export const events: IEvent[] = [
  ...collectEvents(general),
  ...collectEvents(attacks),
];
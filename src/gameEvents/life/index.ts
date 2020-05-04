import { IEvent } from 'types/state';
import { collectEvents } from 'utils/events';

import * as children from './children';

export const events: IEvent[] = [
  ...collectEvents(children)
];

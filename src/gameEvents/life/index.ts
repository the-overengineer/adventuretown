import { IEvent } from 'types/state';
import { collectEvents } from 'utils/events';

import * as children from './children';
import * as general from './general';

export const events: IEvent[] = [
  ...collectEvents(children),
  ...collectEvents(general),
];
import { IEvent } from 'types/state';
import { collectEvents } from 'utils/events';

import * as adventurers from './adventurers';
import * as children from './children';
import * as general from './general';
import * as spouse from './spouse';

export const events: IEvent[] = [
  ...collectEvents(children),
  ...collectEvents(general),
  ...collectEvents(spouse),
  ...collectEvents(adventurers),
];

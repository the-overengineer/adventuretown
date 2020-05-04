import { IEvent } from 'types/state';

import { collectEvents } from 'utils/events';

import * as general from './general';
import * as bar from './bar';
import * as farm from './farm';
import * as guard from './guard';

export const events: IEvent[] = [
  ...collectEvents(general),
  ...collectEvents(bar),
  ...collectEvents(farm),
  ...collectEvents(guard),
];

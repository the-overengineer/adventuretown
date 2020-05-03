import { IEvent } from 'types/state';

import {
  changeCurrentJob,
  seekJob,
  promotedFromEntry,
} from './general';

export const events: IEvent[] = [
  seekJob,
  changeCurrentJob,
  promotedFromEntry,
];

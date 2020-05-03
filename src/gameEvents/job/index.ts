import { IEvent } from 'types/state';

import {
  changeCurrentJob,
  seekJob,
  promotedFromEntry,
  firedEntry,
  anythingToKeepTheJobFailure,
  anythingToKeepTheJobSuccess,
  doYouKnowWhoIAmFailure,
  doYouKnowWhoIAmSuccess,
} from './general';

export const events: IEvent[] = [
  seekJob,
  changeCurrentJob,
  promotedFromEntry,
  firedEntry,
  anythingToKeepTheJobFailure,
  anythingToKeepTheJobSuccess,
  doYouKnowWhoIAmFailure,
  doYouKnowWhoIAmSuccess,
];

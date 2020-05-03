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
import {
  secretOverheard,
  aGoodNightAtWork,
  barFight,
  barFightFightBad,
  barFightFightOk,
  barFightHideBad,
  barFightHideOk,
  barFightTalkBad,
  barFightTalkOk,
} from './bar';

export const events: IEvent[] = [
  seekJob,
  changeCurrentJob,
  promotedFromEntry,
  firedEntry,
  anythingToKeepTheJobFailure,
  anythingToKeepTheJobSuccess,
  doYouKnowWhoIAmFailure,
  doYouKnowWhoIAmSuccess,
  secretOverheard,
  aGoodNightAtWork,
  barFight,
  barFightFightBad,
  barFightFightOk,
  barFightHideBad,
  barFightHideOk,
  barFightTalkBad,
  barFightTalkOk,
];

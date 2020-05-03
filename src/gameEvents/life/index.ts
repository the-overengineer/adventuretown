import { IEvent } from 'types/state';

import {
  pregnancyDiscovered,
  pregnancyFailed,
  giveBirthToChild,
  loverGivesBirth,
  loverPregnancyFails,
  loverPregnantDiscovered,
  wifePregnancyFails,
  wifePregnantDiscovered,
  wifeGivesBirth,
} from './children';

export const events: IEvent[] = [
  pregnancyDiscovered,
  pregnancyFailed,
  giveBirthToChild,
  loverGivesBirth,
  loverPregnancyFails,
  loverPregnantDiscovered,
  wifePregnancyFails,
  wifePregnantDiscovered,
  wifeGivesBirth,
];

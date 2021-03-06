import { IEvent } from 'types/state';

import { events as adventure } from './adventure';
import { events as focus } from './focus';
import { events as job } from './job';
import { events as life } from './life';
import { events as town } from './town';

export const events: IEvent[] = [
  ...adventure,
  ...focus,
  ...job,
  ...life,
  ...town,
];

interface IEventMap {
  [id: number]: IEvent;
}

export const eventMap: IEventMap = events.reduce((map, event) => ({ ...map, [event.id]: event }), {});

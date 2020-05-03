import {
  ID,
  IEvent,
} from 'types/state';
import { setCharacterFlag } from 'utils/setFlag';
import { compose } from 'utils/functional';
import { changeResource } from 'utils/resources';
import { notify } from 'utils/message';

export const ADVENTURE_PREFIX = 2_000;

export const goOnAdventure: IEvent = {
  id: ADVENTURE_PREFIX + 1 as ID,
  meanTimeToHappen: 0,
  condition: () => false, // This is only triggered manually
  title: 'Adventure Time!',
  getText: (state) => `
    You look longingly out of the window. So many adventurers pass through
    ${state.town.name}, talking of their riches and exciting adventures.

    Why can't you do that? Of course, the world outside is dangerous, but maybe
    it's worth trying it. A few more coins or a statue built in your likeness could
    hardly set you back, could they?`,
  actions: [
    {
      text: `Riches and fame await!`,
      perform: compose(
        setCharacterFlag('adventuring', true),
        notify('You go adventuring outside of town'),
      ),
    },
    {
      text: `Let's stay at home where it's safe`,
      perform: notify(`You stay at home. It's less risky here.`),
    },
    {
      condition: state => state.resources.coin > 25,
      text: `I will go, but invest in better equipment`,
      perform: compose(
        setCharacterFlag('adventuring', true),
        changeResource('coin', -25),
        notify('You have equipped yourself well and gone adventuring'),
      ),
    },
  ],
}
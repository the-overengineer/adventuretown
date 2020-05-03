import {
  ID,
  IEvent,
  CharacterFlag,
} from 'types/state';
import { compose } from 'utils/functional';
import { setCharacterFlag } from 'utils/setFlag';
import { notify } from 'utils/message';

export const FOCUS_PREFIX = 3_000;

const focusFlags: CharacterFlag[] = [
  'focusPhysical',
  'focusIntelligence',
  'focusEducation',
  'focusCharm',
  'focusWealth',
  'focusFood',
  'focusRenown',
  'focusFamily',
  'focusFun',
  'focusCity',
]

export const lowerFocusFlags = compose(
  ...focusFlags.map(flag => setCharacterFlag(flag, false)),
);

export const setFocusFlag = (flag: CharacterFlag) => compose(
  lowerFocusFlags,
  setCharacterFlag(flag, true),
);

export const chooseFocus: IEvent = {
  id: FOCUS_PREFIX + 1 as ID,
  meanTimeToHappen: 0,
  condition: () => false, // This is only triggered manually
  title: 'Choose a focus',
  getText: () => `
    It's time to decide what your direction in life will be. Where will most of
    your free time be spent?`,
  actions: [
    {
      text: 'Physical prowess',
      perform: compose(
        setFocusFlag('focusPhysical'),
        notify('You start working on becoming stronger and better equipped'),
      ),
    },
    {
      text: 'Challenging your mind',
      perform: compose(
        setFocusFlag('focusIntelligence'),
        notify('Much of your time is spent on puzzles and discussions'),
      ),
    },
    {
      text: 'Educating yourself',
      perform: compose(
        setFocusFlag('focusEducation'),
        notify('Much can be acquired from books and learned men'),
      ),
    },
    {
      text: 'Social skills',
      perform: compose(
        setFocusFlag('focusCharm'),
        notify('Much can be achieved if you can just learn to talk to people'),
      ),
    },
    {
      text: 'Acquiring wealth',
      perform: compose(
        setFocusFlag('focusWealth'),
        notify(`Money makes the world go 'round`),
      ),
    },
    {
      text: 'Stockpiling food',
      perform: compose(
        setFocusFlag('focusFood'),
        notify('Never go hungry again'),
      ),
    },
    {
      text: 'Fame and renown',
      perform: compose(
        setFocusFlag('focusRenown'),
        notify(`Hopefully your fame will grow soon`),
      ),
    },
    {
      text: 'Family and children',
      perform: compose(
        setFocusFlag('focusFamily'),
        notify('Children are the future, after all'),
      ),
    },
    {
      text: 'Having fun',
      perform: compose(
        setFocusFlag('focusFun'),
        notify('What is there to life if you do not enjoy yourself?'),
      ),
    },
    {
      text: 'Changing things around town',
      perform: compose(
        setFocusFlag('focusCity'),
        notify(`It's about time things changed around here.`),
      ),
    },
  ],
}
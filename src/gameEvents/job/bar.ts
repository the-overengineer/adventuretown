import { IEvent, ID, Profession } from 'types/state';
import { compose } from 'utils/functional';
import { changeResource } from 'utils/resources';
import { notify } from 'utils/message';
import { eventChain } from 'utils/eventChain';
import { changeStat } from 'utils/person';
import { setCharacterFlag } from 'utils/setFlag';

const BAR_JOB_PREFIX: number = 31_000;

export const secretOverheard: IEvent = {
  id: BAR_JOB_PREFIX + 1 as ID,
  meanTimeToHappen: 4 * 30,
  condition: _ => _.character.profession === Profession.BarWorker,
  title: 'Secret overheard',
  getText: _ => `While working at the tavern you overhear a few members of the council, well in their cups, talking about
    a fellow corrupt politician. This could be bad for the politician if it was publicised.`,
  actions: [
    {
      text: 'Ask for money to keep quiet',
      perform: compose(
        changeResource('coin', 20),
        notify('You got a corrupt politician to pay you money to keep their dirty secrets'),
      ),
    },
    {
      text: 'Spread rumours',
      perform: compose(
        changeResource('renown', 20),
        setCharacterFlag('spreadRumoursAboutPolitician', true),
        notify('You spread rumours, which turn out to be true, about a politician. People think well of you for revealing this'),
      ),
    },
    {
      text: 'Keep your mouth shut',
    },
  ],
};

export const aGoodNightAtWork: IEvent = {
  id: BAR_JOB_PREFIX + 2 as ID,
  meanTimeToHappen: 3 * 30,
  condition: _ => _.character.profession === Profession.BarWorker,
  title: 'Busy night',
  getText: _ => `The tavern was unusually full tonight. Though you end up exhausted, you have made good earnings tonight.`,
  actions: [
    {
      text: 'More money never hurts',
      perform: compose(
        changeResource('coin', 10),
      )
    }
  ]
}

export const barFightHideOk: IEvent = {
  id: BAR_JOB_PREFIX + 4 as ID,
  meanTimeToHappen: 0,
  condition: _ => false, // chain only
  title: 'Bar fight ends',
  getText: _ => `A few people are bruised, a few glasses smashed, but no serious harm was done`,
  actions: [
    {
      text: `That's a relief`,
    },
  ],
};

export const barFightHideBad: IEvent = {
  id: BAR_JOB_PREFIX + 5 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'Bar smashed',
  getText: _ => `By the time the situation clears, the bar looks like a battlefield. People are bleeding on the ground, tables and chairs smashed.
    It looks like some of the damage will be coming out of your paycheck`,
  actions: [
    {
      text: 'Curses!',
      perform: compose(
        changeResource('coin', -10),
        notify(`You are forced to pay for some of the damages during your shift`),
      ),
    },
  ],
};

export const barFightFightOk: IEvent = {
  id: BAR_JOB_PREFIX + 6 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'Cracking skulls',
  getText: _ => `You go in with your own bottle in hand, waving around. When the coast clear, the rowdiest of the bunch are on the ground and the rest scatter`,
  actions: [
    {
      condition: _ => _.character.physical < 8,
      text: 'I feel stronger!',
      perform: compose(
        changeStat('physical', 1),
        notify('You broke up a bar fight and got a bit fitter')
      ),
    },
    {
      condition: _ => _.character.physical >= 8,
      text: 'That was easy',
      perform: notify('You broke up a bar fight without breaking a sweat'),
    },
  ],
};

export const barFightTalkBad: IEvent = {
  id: BAR_JOB_PREFIX + 7 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'Negotiations failed',
  getText: _ => `You climb the bar and start trying to convince everybody to calm down. You are not two sentences in before somebody
    tackles you to the ground and starts beating you`,
  actions: [
    {
      text: 'Everything hurts',
      perform: compose(
        changeStat('physical', -1),
        notify(`You got beaten up quite badly. Your arm doesn't quite bend like it used to`),
      ),
    },
  ],
};

export const barFightTalkOk: IEvent = {
  id: BAR_JOB_PREFIX + 8 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'Silver tongue',
  getText: _ => `You climb the bar and start talking. Just a few sentences are all it takes for the people to calm down and throw out the
    instigator of the fight`,
  actions: [
    {
      condition: _ => _.character.charm < 8,
      text: 'I feel like a smoother talker now',
      perform: compose(
        changeStat('charm', 1),
        notify('You broke up a bar fight with just words and learned something')
      ),
    },
    {
      condition: _ => _.character.charm >= 8,
      text: 'That was easy',
      perform: notify('You talked a bar fight out of happening without any issue'),
    },
  ],
};

export const barFightFightBad: IEvent = {
  id: BAR_JOB_PREFIX + 9 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'Skull cracked',
  getText: _ => `You go in with your own bottle in hard, waving around. When the coast clears your head is ringing and your arm bends at an odd angle`,
  actions: [
    {
      text: 'Everything hurts',
      perform: compose(
        changeStat('physical', -1),
        notify(`You got beaten up quite badly. Your arm doesn't quite bend like it used to`),
      ),
    },
  ],
};

export const barFight: IEvent = {
  id: BAR_JOB_PREFIX + 3 as ID,
  meanTimeToHappen: 4 * 30,
  condition: _ => _.character.profession === Profession.BarWorker,
  title: 'Bar fight!',
  getText: _ => `This night in the bar, a lot of drinking is happening and the guests are getting rowdy. Before you know what's going on,
    people start sounding, tables are overturned, and teeth start flying around.`,
  actions: [
    {
      text: 'Hide and wait for it to end',
      perform: eventChain([
        { id: barFightHideBad.id, weight: 2 },
        { id: barFightHideOk.id, weight: 3 },
      ])
    },
    {
      condition: _ => _.character.physical >= 2,
      text: 'Join the fight',
      perform: eventChain([
        { id: barFightFightBad.id, weight: 2 },
        { id: barFightFightOk.id, weight: 3},
        { id: barFightFightOk.id, weight: 3, condition: _ => _.character.physical >= 5 } //extra change due to experience
      ]),
    },
    {
      condition: _ => _.character.charm >= 2,
      text: 'Talk them out of it',
      perform: eventChain([
        { id: barFightTalkBad.id, weight: 2 },
        { id: barFightTalkOk.id, weight: 3},
        { id: barFightTalkOk.id, weight: 3, condition: _ => _.character.charm >= 5 } //extra change due to experience
      ]),
    },
  ],
};
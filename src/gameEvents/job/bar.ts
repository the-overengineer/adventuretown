import { Profession, Gender } from 'types/state';
import { compose } from 'utils/functional';
import { changeResource } from 'utils/resources';
import { notify } from 'utils/message';
import { triggerEvent } from 'utils/eventChain';
import { changeStat } from 'utils/person';
import { setCharacterFlag, pregnancyChance } from 'utils/setFlag';
import { eventCreator } from 'utils/events';

const BAR_JOB_PREFIX: number = 31_000;

const createEvent = eventCreator(BAR_JOB_PREFIX);

export const secretOverheard = createEvent.regular({
  meanTimeToHappen: 9 * 30,
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
        setCharacterFlag('enemiesInHighPlaces', true),
        notify('You spread rumours, which turn out to be true, about a politician. People think well of you for revealing this'),
      ),
    },
    {
      text: 'Keep your mouth shut',
    },
  ],
});

export const aGoodNightAtWork = createEvent.regular({
  meanTimeToHappen: 4 * 30,
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
});

export const barFightHideOk = createEvent.triggered({
  title: 'Bar fight ends',
  getText: _ => `A few people are bruised, a few glasses smashed, but no serious harm was done`,
  actions: [
    {
      text: `That's a relief`,
    },
  ],
});

export const barFightHideBad = createEvent.triggered({
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
});

export const barFightFightOk = createEvent.triggered({
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
});

export const barFightTalkBad = createEvent.triggered({
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
});

export const barFightTalkOk = createEvent.triggered({
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
});

export const barFightFightBad = createEvent.triggered({
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
});

export const barFight = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.character.profession === Profession.BarWorker,
  title: 'Bar fight!',
  getText: _ => `This night in the bar, a lot of drinking is happening and the guests are getting rowdy. Before you know what's going on,
    people start sounding, tables are overturned, and teeth start flying around.`,
  actions: [
    {
      text: 'Hide and wait for it to end',
      perform:  triggerEvent(barFightHideBad).withWeight(2)
        .orTrigger(barFightHideOk).withWeight(3)
        .toTransformer(),
    },
    {
      condition: _ => _.character.physical >= 2,
      text: 'Join the fight',
      perform: triggerEvent(barFightFightBad).withWeight(2)
        .orTrigger(barFightFightOk).withWeight(3).multiplyByFactor(2, _ => _.character.physical >= 5)
        .toTransformer(),
    },
    {
      condition: _ => _.character.charm >= 2,
      text: 'Talk them out of it',
      perform: triggerEvent(barFightTalkBad).withWeight(2)
        .orTrigger(barFightTalkOk).withWeight(3).multiplyByFactor(2, _ => _.character.charm >= 5)
        .toTransformer(),
    },
  ],
});

export const aNightOfFun = createEvent.triggered({
  title: 'A night of fun',
  getText: _ => `You had an enjoyable night, but when you wake up your lover is gone, without you ever having even learned their name`,
  actions: [
    {
      text: 'Pleasurable, at least',
      perform: compose(
        pregnancyChance('pregnantLover'),
        notify('A fun night with a fit adventurer'),
      ),
    },
  ],
});

export const adventurerLover = createEvent.triggered({
  title: 'Adventurer lover',
  getText: _ => `You spend an enjoyable night. In the morning, when the drink has cleared from your heads, the lust is still there.
    The cocky adventurer and you keep enjoying each others' company well into the next morning, and when you are forced to part the
    adventurer suggests that this should become a regular occurrence.`,
  actions: [
    {
      text: 'Reject them',
      perform: compose(
        pregnancyChance('pregnantLover'),
        notify('A fun night with a fit adventurer'),
      ),
    },
    {
      text: 'A lover would be nice',
      perform: compose(
        pregnancyChance('pregnantLover'),
        setCharacterFlag('lover', true),
        notify('You liked last night very much, hopefully it will happen again'),
      ),
    },
  ],
});

export const potentialAdventurerLover = createEvent.regular({
  condition: _ => _.characterFlags.lover !== true && (
    _.character.profession === Profession.BarWorker ||
    _.characterFlags.focusFun === true ||
    _.character.charm >= 5
  ) && (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!),
  meanTimeToHappen: 9 * 30, // 9 months
  title: 'Admired at the bar',
  getText: (s) => {
    const otherPronoun = s.character.gender === Gender.Female ? 'He': 'She';
    const beautyAdjective = s.character.gender === Gender.Male ? 'handsome' : 'beautiful';
    return `
      One day at the tavern, you notice a youthful adventurer catching your eye now and then.
      ${otherPronoun} seems to be the leader of the group, decked out in expensive equipment,
      spending coin like there is no tomorrow, and drawing attention from most other patrons.
      ${otherPronoun} is a bit in the cups as ${otherPronoun.toLocaleLowerCase()} approaches you
      with a confident smile. "I saw you from across the tavern and couldn't help but notice how
      ${beautyAdjective} you are. Maybe you'd like to join me in my room later?" ${otherPronoun}
      says without a hint of shame and a cocky smiles besides.
    `;
  },
  actions: [
    {
      text: 'Reject the advances',
      perform: notify(`You chose not to entangle yourself with a visiting adventurer`),
    },
    {
      text: 'Welcome the advances',
      perform: triggerEvent(aNightOfFun)
        .orTrigger(adventurerLover).multiplyByFactor(3, _ => _.character.charm >= 5)
        .toTransformer(),
    },
  ],
});

export const charmImproved = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.character.profession === Profession.BarWorker
    && _.character.charm < 6,
  title: 'Social interactions',
  getText: _ => `Working in the tavern, you frequently have opportunities to interact with others.
    Though they are not always pleasant, you have learned to be better at handling people`,
  actions: [
    {
      text: `It rubs off on you`,
      perform: compose(
        changeStat('charm', 1),
        notify('Working at the tavern has improved your social skills'),
      ),
    },
  ],
});

export const leftovers = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.character.profession === Profession.BarWorker
    && _.resources.food <= 25,
  title: 'Leftovers',
  getText: _ => `You do not quite have large stockpiles of food, and a chance has presented itself
    for you to take some leftovers from the tavern`,
  actions: [
    {
      text: 'Excellent!',
      perform: compose(
        changeResource('food', 10),
        notify('You picked up some leftovers from the tavern to eat'),
      ),
    },
  ],
});

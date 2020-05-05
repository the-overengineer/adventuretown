import { Profession } from 'types/state';
import { compose } from 'utils/functional';
import { changeResource } from 'utils/resources';
import { notify } from 'utils/message';
import { triggerEvent } from 'utils/eventChain';
import { changeStat } from 'utils/person';
import { eventCreator } from 'utils/events';

const FARM_JOB_PREFIX: number = 32_000;

const createEvent = eventCreator(FARM_JOB_PREFIX);

export const verminFightSuccess = createEvent.triggered({
  title: 'Blood everywhere',
  getText: _ => `By the time you are done smashing the vermin with a cudgel, the floor is sprayed with blood and tiny guts.
    It was a lot of running around and smacking, and the result isn't pretty, but they seem to frightened to come back`,
  actions: [
    {
      condition: _ => _.character.physical < 8,
      text: 'Good exercise!',
      perform: compose(
        changeStat('physical', 1),
        notify('You scared the vermin away and got fitter in the process'),
      ),
    },
    {
      condition: _ => _.character.physical >= 8,
      text: 'Easy work',
      perform: notify('You easily got rid of the vermin'),
    },
  ],
});

export const verminFightFailure = createEvent.triggered({
  title: 'Too slow',
  getText: _ => `You keep trying to smack the vermin scurrying around, but to no avail. They are just too small and too fast.
    You give up, exhausted and huffing for breath. The cheeky buggers are eating grain not a few metres from you, and you are
    too exhausted to stand up and give chase`,
  actions: [
    {
      text: 'Defeated!',
      perform: compose(
        changeResource('food', -5),
        notify('The vermin eat some of your food, as well, adding insult to injury'),
      ),
    },
  ],
});

export const verminPoisonSuccess = createEvent.triggered({
  title: 'Poison worked',
  getText: _ => `You check the traps the next morning, and you find a mess of dead rodents, lying around. The food is untouched!
    Your brilliant plan seems to have worked.`,
  actions: [
    {
      condition: _ => _.character.intelligence < 8,
      text: 'Good mental exercise',
      perform: compose(
        changeStat('intelligence', 1),
        notify('You defeated the rodents and grew your mind. Who thought poisoning could do that?'),
      ),
    },
    {
      condition: _ => _.character.intelligence >= 8,
      text: 'What anyone with a brain would do',
      perform: notify('You easily outsmarted and poisoned the rodents'),
    },
  ],
});

export const verminPoisonFailure = createEvent.triggered({
  title: 'Outsmarted by mice',
  getText: _ => `You check the traps the next morning, and you find them untouched. The same cannot be said for the sacks of grain
    around them, many of which have been chewed through. You have been outsmarted by rodents`,
  actions: [
    {
      text: 'How?!',
      perform: compose(
        changeResource('food', -5),
        notify('The vermin eat some of your food, as well, adding insult to injury'),
      )
    },
  ],
});

export const verminFound = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.character.profession === Profession.Farmer,
  title: 'Vermin strike!',
  getText: _ => `
    As you're working around the farm, you notice that some of the stores have been partially eaten.
    There are vermin on the farm destroying your stores! What to do?
  `,
  actions: [
    {
      text: 'Do nothing',
      perform: compose(
        changeResource('food', -5),
        notify('The vermin eat some of your food, as well'),
      ),
    },
    {
      condition: _ => _.character.physical >= 2,
      text: 'Chase the vermin down yourself',
      perform:  triggerEvent(verminFightFailure).withWeight(3)
        .orTrigger(verminFightSuccess).multiplyByFactor(4, _ => _.character.physical >= 5)
        .toTransformer(),
    },
    {
      condition: _ => _.character.intelligence >= 2,
      text: 'Place poison',
      perform: triggerEvent(verminPoisonFailure)
        .orTrigger(verminPoisonSuccess).multiplyByFactor(3, _ => _.character.intelligence >= 5)
        .toTransformer(),
    },
  ],
});

export const bountifulHarvest = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.character.profession === Profession.Farmer,
  title: 'Bountiful harvest',
  getText: _ => `This season's harvest has been especially bountiful. Everybody who had their hand in this
    will get an additional share of the food to take home`,
  actions: [
    {
      text: 'Hard work pays off',
      perform: compose(
        changeResource('food', 20),
        notify('You receive your share of a bountiful harvest'),
      ),
    },
  ],
});

export const herbologyLearned = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.education < 5,
  title: 'Learned about plants',
  getText: _ => `Working on a farm has had an unexpected benefit. In your daily work, you have learned more about plants,
    animals, and the natural world than you have known before`,
  actions: [
    {
      text: 'What a world we live in',
      perform: compose(
        changeStat('education', 1),
        notify('Working on the farm, you have learned a lot about the natural world'),
      ),
    },
  ],
});

export const toughWork = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.physical < 6,
  title: 'Tough work',
  getText: _ => `Working on a farm is seldom easy, and as time passes you notice that all the tough work seems to
    have made you stronger and fitter`,
  actions: [
    {
      text: 'I feel great!',
      perform: compose(
        changeStat('physical', 1),
        notify('Working on the farm has toughened up your muscles'),
      ),
    },
  ],
});

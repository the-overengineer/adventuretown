import { Profession, ProfessionLevel } from 'types/state';
import { changeResource } from 'utils/resources';
import { triggerEvent } from 'utils/eventChain';
import { changeStat, setLevel } from 'utils/person';
import { eventCreator, action } from 'utils/events';
import { setWorldFlag, setCharacterFlag } from 'utils/setFlag';
import { inIntRange } from 'utils/random';

const FARM_JOB_PREFIX: number = 32_000;

const createEvent = eventCreator(FARM_JOB_PREFIX);

export const verminFightSuccess = createEvent.triggered({
  title: 'Blood everywhere',
  getText: _ => `By the time you are done smashing the vermin with a cudgel, the floor is sprayed with blood and tiny guts.
    It was a lot of running around and smacking, and the result isn't pretty, but they seem to frightened to come back`,
  actions: [
    action('Good exercise!').when(_ => _.character.physical < 6).log('You scared the vermin away and got some exercise'),
    action('Easy work').when(_ => _.character.physical >= 6).log('You easily disposed of the vermin'),
  ],
});

export const verminFightFailure = createEvent.triggered({
  title: 'Too slow',
  getText: _ => `You keep trying to smack the vermin scurrying around, but to no avail. They are just too small and too fast.
    You give up, exhausted and huffing for breath. The cheeky buggers are eating grain not a few metres from you, and you are
    too exhausted to stand up and give chase`,
  actions: [
    action('Defeated!').resourceLosePercentage('food', 5).log('The vermin eat some of your food, adding insult to injury'),
  ],
});

export const verminPoisonSuccess = createEvent.triggered({
  title: 'Poison worked',
  getText: _ => `You check the traps the next morning, and you find a mess of dead rodents, lying around. The food is untouched!
    Your brilliant plan seems to have worked.`,
  actions: [
    action('Good planning!').when(_ => _.character.intelligence < 5).do(changeStat('intelligence', 1)).log(
      'You defeated the rodents and grew your mind. Who thought poisoning could do that?'
    ),
    action('What anyone with a brain would do').when(_ => _.character.intelligence >= 5).log(
      'You easily outsmarted and poisoned the rodents',
    ),
  ],
});

export const verminPoisonFailure = createEvent.triggered({
  title: 'Outsmarted by mice',
  getText: _ => `You check the traps the next morning, and you find them untouched. The same cannot be said for the sacks of grain
    around them, many of which have been chewed through. You have been outsmarted by rodents`,
  actions: [
    action('How?!').resourceLosePercentage('food', 5).log('The vermin eat some of your food, as well, adding insult to injury'),
  ],
});

export const verminFound = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.character.profession === Profession.Farmer && _.worldFlags.vermin!,
  title: 'Vermin strike!',
  getText: _ => `
    As you're working around the farm, you notice that some of the stores have been partially eaten.
    There are vermin on the farm destroying your stores! What to do?
  `,
  actions: [
    action('Do nothing').resourceLosePercentage('food', 5).and(setCharacterFlag('jobNeglect')).log('Some of your food gets eaten by the vermin as well'),
    action('Chase the vermin down').when(_ => _.character.physical >= 2).do(
      triggerEvent(verminFightFailure).withWeight(3)
        .orTrigger(verminFightSuccess).multiplyByFactor(4, _ => _.character.physical >= 5),
    ),
    action('Place poison').when(_ => _.character.intelligence >= 2).do(
      triggerEvent(verminPoisonFailure)
        .orTrigger(verminPoisonSuccess).multiplyByFactor(3, _ => _.character.intelligence >= 5),
    ),
  ],
});

export const bountifulHarvest = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.profession === Profession.Farmer,
  title: 'Bountiful harvest',
  getText: _ => `This season's harvest has been especially bountiful. Everybody who had their hand in this
    will get an additional share of the food to take home`,
  actions: [
    action('Hard work pays off').do(changeResource('food', inIntRange(10, 50))).log('You receive your share of a bountiful harvest'),
  ],
});

export const herbologyLearned = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.education < 4,
  title: 'Learned about plants',
  getText: _ => `Working on a farm has had an unexpected benefit. In your daily work, you have learned more about plants,
    animals, and the natural world than you have known before`,
  actions: [
    action('What a world we live in!').do(changeStat('education', 1)).log('Working on the farm, you have learned a lot about the natural world'),
  ],
});

export const toughWork = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.physical < 6,
  title: 'Tough work',
  getText: _ => `Working on a farm is seldom easy, and as time passes you notice that all the tough work seems to
    have made you stronger and fitter`,
  actions: [
    action('I feel great!').do(changeStat('physical', 1)).log('Working on the farm has toughened up your muscles'),
  ],
});

export const famineFoodStolen = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.worldFlags.famine!,
  title: 'Farm robbed due to famine',
  getText: _ => `With the famine going on, people have started getting more and more desperate. Last night, they
    seem to have broken into your farm while everybody was asleep and stolen large quantities of your stores.
    This will be a huge financial loss to you`,
  actions: [
    action('Blasted thieves!').resourceLosePercentage('coin', 10).log(
      'Large amounts of supplies were stolen from your farm, incurring a large loss for you',
    ),
  ],
});

export const sellAgriculturalRevolution = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.worldFlags.agriculturalRevolution!,
  title: 'Sell agricultural secrets',
  getText: _ => `Representatives of a neighbouring town approach you with a proposal.
    If you sell to them to secrets of your town's agricultural success, they will pay you
    500 coins. While this will fatten your purse, it will also equalise the agricultural
    advantage you have over the region`,
  actions: [
    action('Accept').gainResource('coin', 500).and(setWorldFlag('agriculturalRevolution', false)).log(
      'You have sold agricultural secrets to a neighbouring town'
    ),
    action('Refuse'),
  ],
});

export const harshSeason = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.professionLevel === ProfessionLevel.Medium,
  title: 'Harsh season',
  getText: `The last season has been harsh, and you did not manage to do much on the farm. You will have to work as a mere farm hand
    again until your land recovers`,
  actions: [
    action('Damned weather').do(setLevel(ProfessionLevel.Entry)).log('Due to poor weather, you are a farm hand again'),
  ],
});

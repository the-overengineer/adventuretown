import {
  Profession,
  ProfessionLevel,
} from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import {
  action,
  eventCreator,
  time,
} from 'utils/events';
import { changeStat, generateLoverDescription } from 'utils/person';
import { pickOne, inIntRange } from 'utils/random';
import { changeResource } from 'utils/resources';
import {
  pregnancyChance,
  setCharacterFlag,
} from 'utils/setFlag';

const BAR_JOB_PREFIX: number = 31_000;

const createEvent = eventCreator(BAR_JOB_PREFIX);

export const secretOverheard = createEvent.regular({
  meanTimeToHappen: 24 * 30,
  condition: _ => _.character.profession === Profession.BarWorker,
  title: 'Secret overheard',
  getText: `While working at the tavern you overhear a few members of the council, well in their cups, talking about
    a fellow corrupt politician. This could be bad for the politician if it was publicised.`,
  actions: [
    action('Ask for money to keep quiet').changeResource('coin', 25).and(setCharacterFlag('enemiesInHighPlaces')).log(
      'You got a corrupt politician to pay you money to keep their dirty secrets',
    ),
    action('Spread rumours').changeResource('renown', 20).and(setCharacterFlag('enemiesInHighPlaces')).log(
      'You spread rumours, which turn out to be true, about a politician. People think well of you for revealing this'
    ),
    action('Keep your mouth shut'),
  ],
});

export const aGoodNightAtWork = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.character.profession === Profession.BarWorker && _.character.professionLevel! < ProfessionLevel.Leadership,
  title: 'Busy night',
  getText: `The tavern was unusually full tonight. Though you end up exhausted, you have made good earnings tonight.`,
  actions: [
    action('More money never hurts').changeResource('coin', 20),
  ]
});

export const barFightHideOk = createEvent.triggered({
  title: 'Bar fight ends',
  getText: `A few people are bruised, a few glasses smashed, but no serious harm was done`,
  actions: [
    action(`That's a relief`),
  ],
});

export const barFightHideBad = createEvent.triggered({
  title: 'Bar smashed',
  getText: _ => `By the time the situation clears, the bar looks like a battlefield. People are bleeding on the ground, tables and chairs smashed.
    It looks like some of the damage will be coming out of your pay`,
  actions: [
    action('Curses!').do(changeResource('coin', -15)).log('You are forced to pay for part of the damages done in a bar fight'),
  ],
});

export const barFightFightOk = createEvent.triggered({
  title: 'Cracking skulls',
  getText: _ => `You go in with your own bottle in hand, waving around. When the coast clears, the rowdiest of the bunch are on the ground and the rest scatter`,
  actions: [
    action('I feel stronger!').when(_ => _.character.physical < 6).do(changeStat('physical', 1)).log('You broke up a fight, learning something of fighting in the process'),
    action('That was easy!').when(_ => _.character.physical >= 6).log('You broke up a fight without breaking a sweat'),
  ],
});

export const barFightTalkBad = createEvent.triggered({
  title: 'Negotiations failed',
  getText: _ => `You climb the bar and start trying to convince everybody to calm down. You are not two sentences in before somebody
    tackles you to the ground and starts beating you`,
  actions: [
    action('Everything hurts').do(changeStat(pickOne(['physical', 'charm']), -1)).log(`You got beaten up quite badly`),
  ],
});

export const barFightTalkOk = createEvent.triggered({
  title: 'Silver tongue',
  getText: _ => `You climb the bar and start talking. Just a few sentences are all it takes for the people to calm down and throw out the
    instigator of the fight`,
  actions: [
    action('I feel like a smoother talker now').when(_ => _.character.charm < 6).do(changeStat('charm', 1)).log(
      'You broke up a bar fight with just words and learned something',
    ),
    action('That was easy!').when(_ => _.character.charm >= 6).log('You easily talked people out of a bar fight'),
  ],
});

export const barFightFightBad = createEvent.triggered({
  title: 'Skull cracked',
  getText: _ => `You go in with your own bottle in hard, waving around. When the coast clears your head is ringing and your arm bends at an odd angle`,
  actions: [
    action('Everything hurts').do(changeStat(pickOne(['physical', 'charm']), -1)).log(`You got beaten up quite badly`),
  ],
});

export const barFight = createEvent.regular({
  meanTimeToHappen: time(1, 'year'),
  condition: _ => _.character.profession === Profession.BarWorker,
  title: 'Bar fight!',
  getText: _ => `This night in the bar, a lot of drinking is happening and the guests are getting rowdy. Before you know what's going on,
    people start sounding, tables are overturned, and teeth start flying around.`,
  actions: [
    action('Hide and wait it out').do(triggerEvent(barFightHideBad).withWeight(2).orTrigger(barFightHideOk).withWeight(3)),
    action('Join the fight').do(
      triggerEvent(barFightFightBad).withWeight(2)
        .orTrigger(barFightFightOk).withWeight(3).multiplyByFactor(2, _ => _.character.physical >= 5),
    ),
    action('Talk them out of it').do(
      triggerEvent(barFightTalkBad).withWeight(2)
        .orTrigger(barFightTalkOk).withWeight(3).multiplyByFactor(2, _ => _.character.charm >= 5),
    ),
  ],
});

export const aNightOfFun = createEvent.triggered({
  title: 'A night of fun',
  getText: _ => `You had an enjoyable night, but when you wake up your lover is gone, without you ever having even learned their name`,
  actions: [
    action('Pleasurable, at least').do(pregnancyChance('pregnantLover')).log('A fun night with an adventurer'),
  ],
});

export const adventurerLover = createEvent.triggered({
  title: 'Lover',
  getText: _ => `You spend an enjoyable night. In the morning, when the drink has cleared from your heads, the lust is still there.
    Your lover from last night and you keep enjoying each others' company well into the next morning, and when you are forced to part the
    person suggests that this should become a regular occurrence.`,
  actions: [
    action('Reject them').do(pregnancyChance('pregnantLover')).log('A fun night with a lover'),
    action('A lover would be nice').do(pregnancyChance('pregnantLover')).and(setCharacterFlag('lover')).log(
      'You liked last night very much, hopefully it will happen again',
    ),
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
    const description = generateLoverDescription(s);
    return `One day at the tavern, while the group of adventurers are there, you notice that
      one of them is glancing at you every now and then. After some time, the adventurer moves
      away from the group and approaches you. ${description} After some initial words, the
      adventurer proposes that you join them in their room later for some late-night activities.
    `;
  },
  actions: [
    action(`I'm married!`).when(_ => _.relationships.spouse != null),
    action('Reject the advances').log(`You chose not to entangle yourself with a visiting adventurer`),
    action('Welcome the advances').do(
      triggerEvent(aNightOfFun).orTrigger(adventurerLover).multiplyByFactor(3, _ => _.character.charm >= 5),
    ),
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
    action('It rubs off on you').do(changeStat('charm', 1)).log('Working at the tavern has improved your social skills'),
  ],
});

export const leftovers = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.character.profession === Profession.BarWorker
    && _.resources.food <= 25,
  title: 'Leftovers',
  getText: _ => `You do not quite have large stockpiles of food, and a chance has presented itself
    for you to take some leftovers from the tavern`,
  actions: [
    action('Excellent!').changeResource('food', 2).log('You picked up some leftovers from the tavern'),
  ],
});

export const adventurersSeekInformation = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.character.profession === Profession.BarWorker && (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!),
  title: 'Adventurers seek information',
  getText: `A group of adventurers stops you as you work in the tavern and try to ask you some questions, assuming that you keep
    an ear on the ground`,
  actions: [
    action('I tell them what they want to know').when(_ => _.character.education >= 5).changeResource('coin', 25).changeResource('renown', 25).log(
      'You give the adventurers some information, and they pay you for it, and tell everybody how helpful you were',
    ),
    action(`I don't know nuthin`),
  ],
});

export const adventuringPartyFormsAtTavern = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.character.profession === Profession.BarWorker
    && !_.worldFlags.adventurerKeep
    && !_.worldFlags.adventurers,
  title: `Adventuring party formed`,
  getText: `You're working your regular shift at the tavern, when you see an unusual group enter, one by one. A gruff dwarf with a hammer pendant,
    a beautiful tiefling bard, and a man in dark clothing who keeps to the corner and eyes everybody nervously. You realise that they are a new
    adventuring party about to form. This doesn't happen very often, and you'll surely get quite a few drinks from friends telling them this story`,
  actions: [
    action('What a wonderful sight!').changeResource('renown', 50).log('You get to see an adventuring party form and tell the tale'),
  ],
});

export const rumours = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.character.profession === Profession.BarWorker && _.character.education < 6,
  title: 'Rumours overheard',
  getText: `Working at a bar, you get to learn a lot from various visitors, especially a few drinks in`,
  actions: [
    action('I learned a thing').and(changeStat('education', 1)),
  ],
});

export const famineTavernRobbed = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.profession === Profession.Farmer
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.worldFlags.famine!,
  title: 'Tavern robbed due to famine',
  getText: _ => `With the famine going on, people have started getting more and more desperate. Last night, they
    seem to have broken into your tavern and stolen your food, drink, and even some of your stored coins. The damages will
    be significant`,
  actions: [
    action('Blasted thieves!').resourceLosePercentage('coin', 10).log(
      'Large amounts of supplies were stolen from your tavern, incurring a large loss for you',
    ),
  ],
});

export const ramblingDrunk = createEvent.triggered({
  title: 'Rambling drunk',
  getText: `The person you started talking to turns out to be a drunk, just rambling about their life`,
  actions: [
    action('A waste of time'),
  ],
});

export const talkInvestmentBetrayed = createEvent.triggered({
  title: 'Failed investment',
  getText: `The person whom you supported vanished, and seemingly has no plan to return your investment`,
  actions: [
    action('Curses!').log('Your investment was a failure, and the person skipped town'),
  ],
});

export const talkInvestmentFailed = createEvent.triggered({
  title: 'Failed investment',
  getText: `The person whom you supported failed to make any profit out of their investment, and you will not see the money`,
  actions: [
    action('Curses!').log('Your investment was a failure, and the person did not manage to start their business'),
  ],
});

export const talkInvestmentWorked = createEvent.triggered({
  title: 'Investment returned',
  getText: `The person in whom you invested returns and informs you that their business idea succeeded! They hand you some of the profits`,
  actions: [
    action('Excellent!').changeResource('coin', inIntRange(75, 100)).log('Your investment was returned and you made some money'),
  ],
});

export const talkInvestmentOpportunity = createEvent.triggered({
  title: 'Investment opportunity',
  getText: `After a drink, the person you started talking to mentions a business idea that they have. They seem to want you to invest in them. The
    idea sounds plausible to you, but not a guaranteed success`,
  actions: [
    action('Invest').spendResource('coin', 50).and(
      triggerEvent(talkInvestmentBetrayed)
        .orTrigger(talkInvestmentFailed).withWeight(2)
        .orTrigger(talkInvestmentWorked)
          .multiplyByFactor(0.5, _ => _.character.intelligence < 2)
          .multiplyByFactor(2, _ => _.character.intelligence >= 4)
          .multiplyByFactor(2, _ => _.character.intelligence >= 6)
          .multiplyByFactor(2, _ => _.character.intelligence >= 8)
          .delayAll(14),
    ),
    action('Convince other to invest').spendResource('renown', 75).and(
      triggerEvent(talkInvestmentBetrayed)
        .orTrigger(talkInvestmentFailed).withWeight(2)
        .orTrigger(talkInvestmentWorked)
          .multiplyByFactor(0.5, _ => _.character.intelligence < 2)
          .multiplyByFactor(2, _ => _.character.intelligence >= 4)
          .multiplyByFactor(2, _ => _.character.intelligence >= 6)
          .multiplyByFactor(2, _ => _.character.intelligence >= 8)
          .delayAll(14),
    ),
    action('Do not invest'),
  ],
});

export const talkWisePerson = createEvent.triggered({
  title: 'Interesting conversation',
  getText: `The person you talked to starts some interesting conversations about things that you never considered. It goes on for a while,
    and is fairly interesting`,
  actions: [
    action('Educational!').when(_ => _.character.education < 4).and(changeStat('intelligence', 1)).log('You learned something conversing to a stranger'),
    action('A good talk').when(_ => _.character.intelligence >= 4).log('You had an interesting conversation with a stranger in a tavern'),
  ],
});

export const talkMocked = createEvent.triggered({
  title: 'Mocked!',
  getText: `The person you started talking to is very unpleasant to you and keeps mocking you. The other tavern patrons start laughing at you`,
  actions: [
    action('Rude!').resourceLosePercentage('renown', 5, 25, 100)
  ],
});

export const talkLoverOpportunity = createEvent.triggered({
  title: 'Interesting talk',
  getText: `You have a long and interesting talk with this person, and at the end of the conversation they propose that you move this conversation
    to their room. You have a feeling that they mean to do more than just talk`,
  actions: [
    action(`I'm married!`).when(_ => _.relationships.spouse != null),
    action('Reject the advances').log(`You chose not to entangle yourself with a person in the tavern`),
    action('Welcome the advances').do(
      triggerEvent(aNightOfFun).orTrigger(adventurerLover).multiplyByFactor(3, _ => _.character.charm >= 5),
    ),
  ],
});

export const pleasantTalk = createEvent.triggered({
  title: 'Pleasant conversation',
  getText: `You spend an enjoyable few hours in conversation, discussing mundane matters`,
  actions: [
    action('It was nice!'),
  ],
});

export const talkComplaints = createEvent.triggered({
  title: 'Complaints',
  getText: 'The other person keeps complaining about their life, their troubles having brought them to the tavern in the first place',
  actions: [
    action('Give them advice').when(_ => _.character.intelligence >= 4 || _.character.education >= 4).log('You give some advice to a troubled patron'),
    action('Comfort them').when(_ => _.character.charm >= 4).log('You offer some comforting words to a troubled patron'),
    action('Leave them to it'),
  ],
});

export const barConversationStarted = createEvent.regular({
  meanTimeToHappen: time(9, 'months'),
  condition: _ => _.character.profession === Profession.BarWorker || _.characterFlags.focusFun!,
  title: 'Conversation started',
  getText: `A patron at the tavern seems eager to start a conversation with you`,
  actions: [
    action('Talk to them').do(
      triggerEvent(talkComplaints)
        .orTrigger(pleasantTalk)
        .orTrigger(talkLoverOpportunity)
        .orTrigger(talkMocked)
        .orTrigger(talkWisePerson)
        .orTrigger(talkInvestmentOpportunity)
        .orTrigger(ramblingDrunk),
    ),
    action('Ignore them'),
  ],
});

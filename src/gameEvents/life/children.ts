import { GenderEquality } from 'types/state';
import { eventCreator, action } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import { createChild, findEmployableChild, hireEmployableChild, findFireableChild, fireFireableChild, removeRandomChild, isEmployable, worsenSpouseRelationship, marryOffRandomChild, changeRandomChildStat } from 'utils/person';
import { changeResource } from 'utils/resources';
import { isOppressed } from 'utils/town';
import {
  setCharacterFlag,
  setWorldFlag,
} from 'utils/setFlag';
import { getAge } from 'utils/time';
import { triggerEvent } from 'utils/eventChain';

export const CHILDREN_PREFIX = 5_000;

const createEvent = eventCreator(CHILDREN_PREFIX);

export const pregnancyDiscovered = createEvent.regular({
  meanTimeToHappen: 21,
  condition: _ => _.characterFlags.unknowinglyPregnant! && !_.characterFlags.pregnant,
  title: 'One in the oven',
  getText: _ => `
    You wake up queasy several mornings in a row. You feel different.
    It takes you a few hours before you muster the courage to consult the local priestess, and she confirms your doubts.
    You are with child.`,
  actions: [
    {
      condition: _ => !isOppressed(_, _.character) && _.resources.coin >= 5,
      text: `I don't want this child!`,
      perform: compose(
        setCharacterFlag('unknowinglyPregnant', false),
        changeResource('coin', -5),
        changeResource('renown', -5),
        notify(`You paid the priestess to take care of your little problem, but she did not keep quiet. You keep getting odd looks on the streets`),
      ),
    },
    {
      text: 'Delightful!',
      perform: compose(
        setCharacterFlag('unknowinglyPregnant', false),
        setCharacterFlag('pregnant', true),
        notify('You are with child. Get some sleep while you still can'),
      ),
    },
  ],
});

export const pregnancyFailed = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => Boolean(_.characterFlags.unknowinglyPregnant || _.characterFlags.pregnant),
  title: 'Pregnancy lost',
  getText: _ => `Through a tragedy of biology, you discover that you will not give birth to a child you were expecting.`,
  actions: [
    {
      text: 'Life is cruel',
      perform: compose(
        setCharacterFlag('unknowinglyPregnant', false),
        setCharacterFlag('pregnant', false),
        notify(`Tragically, you have lost the child you were expecting`),
      ),
    },
  ],
});

export const giveBirthToChild = createEvent.regular({
  meanTimeToHappen: 8 * 30, // 8 months, to account for late discovery
  condition: _ => _.characterFlags.pregnant!,
  title: 'A child is born!',
  getText: _ => `The delivery takes hours, but in the end, though exhausted, sweaty, and soiled, you can smile. You have given birth to a child!`,
  actions: [
    {
      text: 'How exciting!',
      perform: compose(
        setCharacterFlag('pregnant', false),
        createChild,
        notify('A healthy child was born to you'),
      ),
    },
  ],
});

export const loverPregnantDiscovered = createEvent.regular({
  meanTimeToHappen: 21,
  condition: _ => _.worldFlags.pregnantLover! && !_.worldFlags.pregnantLoverKnown,
  title: 'One in the oven',
  getText: _ => 'You meet the person you recently had an amorous affair with. She smiles at you nervously and informs you that she is with child',
  actions: [
    {
      condition: _ => _.town.genderEquality === GenderEquality.FemaleOppression,
      text: '"You must get rid of it',
      perform: compose(
        setWorldFlag('pregnantLover', false),
        notify('You made your lover get rid of the child'),
      ),
    },
    {
      text: `"Delightful!`,
      perform: compose(
        setWorldFlag('pregnantLover', false),
        setWorldFlag('pregnantLoverKnown', true),
        worsenSpouseRelationship,
        notify('Your lover informed you that you have a child on the way'),
      ),
    },
  ],
});

export const loverPregnancyFails = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.worldFlags.pregnantLover! || _.worldFlags.pregnantLoverKnown!,
  title: 'Pregnancy lost',
  getText: _ => `"Come, quick!" one of your neighbours seems panicked. You find the expected mother of your child in tears on a bloody bed. She has lost the child`,
  actions: [
    {
      text: `Life is cruel`,
      perform: compose(
        setWorldFlag('pregnantLover', false),
        setWorldFlag('pregnantLoverKnown', false),
        notify('Your lover has lost your child during her pregnancy'),
      ),
    },
  ],
});

export const loverGivesBirth = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.worldFlags.pregnantLover! || _.worldFlags.pregnantLoverKnown!,
  title: 'A child is born!',
  getText: _ => `"Come, quick!" one of your neighbours seems delighted, if nervous.
    You find your lover with a tired smile on her face, holding your new child in her arms.`,
  actions: [
    {
      text: `How exciting!`,
      perform: compose(
        setWorldFlag('pregnantLover', false),
        setWorldFlag('pregnantLoverKnown', false),
        createChild,
        worsenSpouseRelationship,
        notify('Your lover has given birth to your child'),
      ),
    },
  ],
});

export const childFindsWorks = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => findEmployableChild(_) != null,
  title: 'Child finds work',
  getText: _ => `A child of yours is at an age where they can find work, and they readily proceed to
    do so, ready to give back into the household that fed them`,
  actions: [
    {
      text: 'Good on you',
      perform: compose(
        hireEmployableChild,
        notify('One of your children finds a job and starts earning'),
      ),
    },
  ],
});

export const childFired = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => findFireableChild(_) != null,
  title: 'Child loses work',
  getText: _ => `A child of yours comes home grim today. It would appear that they have lost their job,
    and therefore their way of helping the household`,
  actions: [
    {
      text: 'A shame!',
      perform: compose(
        fireFireableChild,
        notify('A child of yours has lost work'),
      ),
    },
  ],
});

export const childDiesInAccident = createEvent.regular({
  meanTimeToHappen: 40 * 365,
  condition: _ => _.relationships.children.length > 0,
  title: 'A child dies',
  getText: _ => `You receive terrible news. A child of yours has lost their life in a terrible accident.
    Healers were summed to them in haste, but they were too late. Your child is with the gods now`,
  actions: [
    {
      text: 'Why, gods?!',
      perform: compose(
        removeRandomChild,
        notify('A child of yours has perished in an accident'),
      ),
    },
  ],
});

export const childDiesFromSickness = createEvent.regular({
  meanTimeToHappen: 1.5 * 365,
  condition: _ => _.relationships.children.length > 0 && _.worldFlags.sickness!,
  title: 'A child dies',
  getText: _ => `In this time of sickness, you go to wake up a child of yours. They do not respond to your voice, and when
    you shake them, they do not move. You notice they are cold to your touch. The sickness has taken them`,
  actions: [
    {
      text: 'Why, gods?!',
      perform: compose(
        removeRandomChild,
        notify('A child of yours has perished from the sickness'),
      ),
    },
  ],
});

export const childCosts = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.relationships.children.filter(c => isEmployable(_, c)).length > 0,
  title: 'Child costs',
  getText: _ => `Children can be a joy, but apparently they incur some extra costs every now and then.
    You have no choice but to pay them`,
  actions: [
    {
      text: 'When will they move out?',
      perform: compose(
        (_) => changeResource('coin', -10 * _.relationships.children.filter(c => isEmployable(_, c)).length)(_),
        notify(`You have to spend some money on your children. You almost regret having them`),
      ),
    },
  ],
});

export const childStarves = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.relationships.children.length > 0 && _.resources.food === 0 && _.finances.foodExpenses > _.finances.foodIncome,
  title: 'Child starves',
  getText: _ => `Without anything to eat, your children have been becoming less and less lively, and their usual running around and
    noise have become merely listless moaning and complaints. It is not a surprise, but still a tragedy, when you discover that one of
    them can no longer rise in the morning due to hunger. By nightfall, they are gone`,
  actions: [
    {
      text: 'Goodbye, little one',
      perform: compose(
        removeRandomChild,
        notify('Being without food for so long, your child has starved to death'),
      ),
    },
  ],
});

export const marryOffChild = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.relationships.children.filter((it) => isOppressed(_, it) && getAge(it.dayOfBirth, _.daysPassed) >= 14).length > 0,
  title: 'Marry off a child',
  getText: `You have a child of an age to marry who cannot find work and contribute to the household. They could be married off so somebody else
    has the responsibility of taking care of them`,
  actions: [
    action('Marry them off').do(marryOffRandomChild).log('You marry off one of your children and no longer need to take care of them'),
    action('Keep them with me'),
  ],
});

export const childrenAreExpensive = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.relationships.children.filter((it) => getAge(it.dayOfBirth, _.daysPassed) < 14).length > 2,
  title: 'Child expenses',
  getText: `Having some many children turns out to be quite expensive at times. Recently they have incurred additional costs`,
  actions: [
    action('I still love them').resourceLosePercentage('coin', 5).log('Your children incur additional costs'),
  ],
});

export const shamedByChildren = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.relationships.children.filter((it) => getAge(it.dayOfBirth, _.daysPassed) < 14).length > 0,
  title: 'Shamed by children',
  getText: `"Why is that man so fat?" your child asks while pointing at one of the town council members`,
  actions: [
    action('Shhh!').resourceLosePercentage('renown', 5).log('One of your children shames you in public'),
  ],
});

export const childDiesDueToNeglect = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.relationships.children.filter((it) => getAge(it.dayOfBirth, _.daysPassed) < 14).length >= 3 // small kids
    && _.relationships.children.filter((it) => getAge(it.dayOfBirth, _.daysPassed) >= 14).length === 0
    && _.relationships.spouse == null
    && !_.characterFlags.slaves
    && _.character.profession != null,
  title: 'Child dies due to neglect',
  getText: `With you at work most of the day, and with no spouse or help at home, you would often neglect the children, assuming that they
    would take care of themselves. This time, it ended in tragedy, as you find that one of your children has perished in an easily
    preventable accident`,
  actions: [
    action('Oh, no!').and(removeRandomChild).log('One of your children has died due to neglect'),
  ],
});

export const childOkay = createEvent.triggered({
  title: 'Full recovery',
  getText: `Though it seemed bad at first, your child seems to have fully recovered from their injury in a few days, and will
    surely be proudly showing their scar to the other kids in weeks to come`,
  actions: [
    action('It ended well...').log('Your child suffered no serious harm due to their accident'),
  ],
});

export const childDies = createEvent.triggered({
  title: 'Child dies',
  getText: `A few days after their injury, your child was getting worse and worse. Finally, as you hold them in your arms,
    they perish.`,
  actions: [
    action('No!').and(removeRandomChild).log('Your child has died as a result of an accident'),
  ],
});

export const childBrokeBone = createEvent.triggered({
  title: 'Bone heals poorly',
  getText: `Your child suffered a broken limb. At first, you hoped that they would recover, but the bone seems to be settling poorly. Your
    child might be crippled for life`,
  actions: [
    action('Pay for a priest').when(_ => _.worldFlags.temple!).spendResource('coin', 100).and(triggerEvent(childOkay).delayAll(2)),
    action('Upsetting...').and(_ => changeRandomChildStat(_, 'physical', -2)).log('Your child broke a bone, and it is not setting right'),
  ],
});

export const childHeadWound = createEvent.triggered({
  title: 'Child suffers head wound',
  getText: `Your child suffered a head wound, and though at first you thought they would recover, it would seem that they are
    much duller than they used to be`,
  actions: [
    action('Pay for a priest').when(_ => _.worldFlags.temple!).spendResource('coin', 100).and(triggerEvent(childOkay)),
    action('Upsetting...').and(_ => changeRandomChildStat(_, 'intelligence', -2)).log('Your child injured their head and seemingly their wits'),
  ],
});

export const seeWhatHappens = createEvent.triggered({
  title: 'Child in pain',
  getText: `You see your child curled up on the floor, sobbing in agony. It would appear that they suffered an injury. Even more horrifyingly, after the
    initial shock they go pale and are mostly quiet, just occasionally sobbing`,
  actions: [
    action('Pay for a priest').when(_ => _.worldFlags.temple!).spendResource('coin', 100).and(triggerEvent(childOkay)),
    action('Try to help yourself').do(triggerEvent(childDies)
      .orTrigger(childOkay).multiplyByFactor(2, _ => _.character.education >= 6)
      .orTrigger(childBrokeBone)
      .orTrigger(childHeadWound)
      .delayAll(5),
    ),
  ],
});

export const childPlaying = createEvent.triggered({
  title: `Child's play`,
  getText: `It would appear that your child was engaged in some sort of a game where they playing they were captured
    by other children. Absolutely nothing was wrong`,
  actions: [
    action('Let it go').log('Your child was overly dramatic, but you let it go'),
    action('Cane them').log('Your child was overly dramatic, and got caned for it'),
  ],
});

export const childAccidentOrPlay = createEvent.regular({
  meanTimeToHappen: 6 * 365,
  condition: _ => _.relationships.children.length > 0,
  title: 'An accident?',
  getText: `You are in your home when you hear a horrible scream from outside! It is your child screaming, you realise with dread`,
  actions: [
    action('Run out').and(triggerEvent(seeWhatHappens)),
  ],
});

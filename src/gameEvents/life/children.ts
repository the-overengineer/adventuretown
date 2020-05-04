import { GenderEquality, Gender } from 'types/state';
import { eventCreator } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import { createChild } from 'utils/person';
import { changeResource } from 'utils/resources';
import { isOppressed } from 'utils/town';
import {
  setCharacterFlag,
  setWorldFlag,
  pregnancyChance,
} from 'utils/setFlag';

export const CHILDREN_PREFIX = 5_000;

const createEvent = eventCreator(CHILDREN_PREFIX);

export const pregnancyDiscovered = createEvent.regular({
  meanTimeToHappen: 21,
  condition: _ => _.characterFlags.unknowinglyPregnant === true && _.resources.coin >= 5,
  title: 'One in the oven',
  getText: _ => `
    You wake up queasy several mornings in a row. You feel different.
    It takes you a few hours before you muster the courage to consult the local priestess, and she confirms your doubts.
    You are with child.`,
  actions: [
    {
      condition: _ => !isOppressed(_, _.character),
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
  meanTimeToHappen: 10 * 30, // 10 months, uncommon therefore
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
  condition: _ => _.characterFlags.pregnant === true,
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
  condition: _ => _.worldFlags.pregnantLover === true,
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
        notify('Your lover informed you that you have a child on the way'),
      ),
    },
  ],
});

export const loverPregnancyFails = createEvent.regular({
  meanTimeToHappen: 10 * 30,
  condition: _ => _.worldFlags.pregnantLover === true || _.worldFlags.pregnantLoverKnown === true,
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
  condition: _ => _.worldFlags.pregnantLover === true || _.worldFlags.pregnantLoverKnown === true,
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
        notify('Your lover has given birth to your child'),
      ),
    },
  ],
});

export const wifePregnantDiscovered = createEvent.regular({
  meanTimeToHappen: 21,
  condition: _ => _.worldFlags.spousePregnant === true,
  title: 'One in the oven',
  getText: _ => `Your wife awaits your return home in the evening with a nervous smile and glinting eyes. "${_.character.name}, my love! We will have a child!"`,
  actions: [
    {
      condition: _ => _.town.genderEquality === GenderEquality.FemaleOppression,
      text: '"You must get rid of it',
      perform: compose(
        setWorldFlag('spousePregnant', false),
        notify('You made your wife get rid of the child'),
      ),
    },
    {
      text: `"Delightful!`,
      perform: compose(
        setWorldFlag('spousePregnant', false),
        setWorldFlag('spousePregnantDiscovered', true),
        notify('Your wife informed you that you have a child on the way'),
      ),
    },
  ],
});

export const wifePregnancyFails = createEvent.regular({
  meanTimeToHappen: 10 * 30,
  condition: _ => _.worldFlags.spousePregnant === true || _.worldFlags.spousePregnantDiscovered === true,
  title: 'Pregnancy lost',
  getText: _ => `"Come, quick!" one of your neighbours seems panicked. You find your wife in tears on a bloody bed. She has lost the child`,
  actions: [
    {
      text: `Life is cruel`,
      perform: compose(
        setWorldFlag('spousePregnant', false),
        setWorldFlag('spousePregnantDiscovered', false),
        notify('Your wife has lost your child during her pregnancy'),
      ),
    },
  ],
});

export const wifeGivesBirth = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.worldFlags.spousePregnant === true || _.worldFlags.spousePregnantDiscovered === true,
  title: 'A child is born!',
  getText: _ => `"Come, quick!" one of your neighbours seems delighted, if nervous.
    You find your wife with a tired smile on her face, holding your new child in her arms.`,
  actions: [
    {
      text: `How exciting!`,
      perform: compose(
        setWorldFlag('spousePregnant', false),
        setWorldFlag('spousePregnantDiscovered', false),
        createChild,
        notify('Your wife has given birth to your child'),
      ),
    },
  ],
});

export const becomePregnantWithSpouse = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.character.gender === Gender.Female
    && _.relationships.spouse != null,
  title: 'Bliss in bed',
  getText: _ => `You and your husband have been quite active in bed recently. Not only is it a good way
    to spend time, it might leave you with child as well!`,
  actions: [
    {
      text: 'Who knows?',
      perform: compose(
        pregnancyChance,
        notify('Beds are not just for sleeping'),
      ),
    },
  ],
});

export const spouseBecomesPregnant = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.character.gender === Gender.Male
    && _.relationships.spouse != null,
  title: 'Bliss in bed',
  getText: _ => `You and your wife have been quite active in bed recently. Not only is it a good way
    to spend time, it might leave her with child as well!`,
  actions: [
    {
      text: 'Who knows?',
      perform: compose(
        pregnancyChance,
        notify('Beds are not just for sleeping'),
      ),
    },
  ],
});

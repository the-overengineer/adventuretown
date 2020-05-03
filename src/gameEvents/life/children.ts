import {
  ID,
  IEvent,
  GenderEquality,
} from 'types/state';
import { setCharacterFlag, setWorldFlag } from 'utils/setFlag';
import { compose } from 'utils/functional';
import { changeResource } from 'utils/resources';
import { notify } from 'utils/message';
import { isOppressed } from 'utils/rights';
import { createChild } from 'utils/person';

export const CHILDREN_PREFIX = 5_000;

export const pregnancyDiscovered: IEvent = {
  id: CHILDREN_PREFIX + 1 as ID,
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
}

export const pregnancyFailed: IEvent = {
  id: CHILDREN_PREFIX + 2 as ID,
  meanTimeToHappen: 10 * 30, // 10 months
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
};

export const giveBirthToChild: IEvent = {
  id: CHILDREN_PREFIX + 3 as ID,
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
};

export const loverPregnantDiscovered: IEvent = {
  id: CHILDREN_PREFIX + 4 as ID,
  meanTimeToHappen: 21,
  condition: _ => _.worldFlags.pregnantLover === true,
  title: 'One in the oven',
  getText: _ => 'You meet the person you recently had an amorous affair with. She smiles at you nervously and informs you that she is wish child',
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
};

export const loverPregnancyFails: IEvent = {
  id: CHILDREN_PREFIX + 5 as ID,
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
};

export const loverGivesBirth: IEvent = {
  id: CHILDREN_PREFIX + 6 as ID,
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
};

export const wifePregnantDiscovered: IEvent = {
  id: CHILDREN_PREFIX + 7 as ID,
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
};

export const wifePregnancyFails: IEvent = {
  id: CHILDREN_PREFIX + 8 as ID,
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
};

export const wifeGivesBirth: IEvent = {
  id: CHILDREN_PREFIX + 9 as ID,
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
};

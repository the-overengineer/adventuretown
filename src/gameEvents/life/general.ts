import { eventCreator } from 'utils/events';
import { ClassEquality, Gender } from 'types/state';
import { eventChain } from 'utils/eventChain';
import { compose } from 'utils/functional';
import { changeResource } from 'utils/resources';
import { notify } from 'utils/message';
import { getAge } from 'utils/time';
import { changeStat, newCharacter, eldestInherits, removeLastChild, addSpouse } from 'utils/person';
import { setCharacterFlag } from 'utils/setFlag';
import { inIntRange } from 'utils/random';

const GENERAL_LIFE_EVENT_PREFIX: number = 41_000;

const createEvent = eventCreator(GENERAL_LIFE_EVENT_PREFIX);

export const death = createEvent.triggered({
  title: 'Death comes knocking',
  getText: _ => `
    At the age of ${getAge(_.character.dayOfBirth, _.daysPassed)}, ${_.character.name} has died.
    A ceremony is organised in the local temple, to pray that ${_.character.name} will be warmly received
    in the halls of the gods. For everybody else, however, life goes on.
  `,
  actions: [
    {
      condition: _ => _.relationships.children.length > 0,
      text: 'My eldest inherits',
      perform: compose(
        eldestInherits(),
        notify('With your death, your eldest child inherits your possessions'),
      ),
    },
    {
      text: 'Start anew',
      perform: compose(
        newCharacter,
        notify('The story continues for another person in the town'),
      ),
    },
  ],
});

export const banishment = createEvent.triggered({
  title: 'Banished!',
  getText: _ => `
    ${_.character.name} has been banished from ${_.town.name} for their wrongdoings.
    Their name is now spoken only as a curse, and they will never be allowed into the
    town again. For everyone else, life goes on.
  `,
  actions: [
    {
      condition: _ => _.relationships.children.length > 0,
      text: 'Continue as my eldest',
      perform: compose(
        eldestInherits(false),
        notify('With your banishment, your eldest child remains, but your possessions have been confiscated'),
      ),
    },
    {
      text: 'Start anew',
      perform: compose(
        newCharacter,
        notify('The story continues for another person in the town'),
      ),
    },
  ]
})

export const noMoney = createEvent.regular({
  meanTimeToHappen: 7,
  condition: _ => _.resources.coin === 0,
  title: 'Out of money',
  getText: _ => `You have no more money. You have nowhere to sleep, no way to get resources.
    Life cannot go on like this for much longer`,
  actions: [
    {
      text: 'Give up on life',
      perform: eventChain(death.id),
    },
    {
      condition: _ => _.resources.food >= 50,
      text: 'Sell food urgently',
      perform: compose(
        changeResource('food', -50),
        changeResource('coin', 15),
        notify('You sell food at a discount to get some coin'),
      ),
    },
    {
      condition: _ => _.resources.renown >= 50,
      text: 'Beg for coin',
      perform: compose(
        changeResource('renown', -50),
        changeResource('coin', 15),
        notify('You shame yourself begging for coin in front of the local temple'),
      ),
    },
    {
      condition: _ => _.relationships.children.length > 0 && _.town.equality === ClassEquality.GeneralSlavery,
      text: 'Sell your youngest into slavery',
      perform: compose(
        changeResource('coin', 50),
        removeLastChild,
        notify('You have sold your youngest child into slavery. Their life will not be pleasant, but you can survive another day'),
      ),
    },
  ],
});

export const noFood = createEvent.regular({
  meanTimeToHappen: 7,
  condition: _ => _.resources.food === 0,
  title: 'Out of food',
  getText: _ => `You have not eaten more than scraps in days. You have no food in your stores. You feel your body weakening,
    but you cannot go on like this any more`,
  actions: [
    {
      condition: _ => _.character.physical > 0,
      text: 'Endure',
      perform: compose(
        changeStat('physical', -1),
        notify('Your body weakens, but you survive another day without food'),
      ),
    },
    {
      text: 'Give up on life',
      perform: eventChain(death.id),
    },
    {
      condition: _ => _.resources.coin >= 20,
      text: 'Buy food urgently',
      perform: compose(
        changeResource('coin', -20),
        changeResource('food', 15),
        notify('You buy food, at a high price'),
      ),
    },
    {
      condition: _ => _.resources.renown >= 30,
      text: 'Beg for food',
      perform: compose(
        changeResource('renown', -30),
        changeResource('coin', 15),
        notify('You shame yourself begging for food in front of the local temple'),
      ),
    },
    {
      condition: _ => _.relationships.children.length > 0 && _.town.equality === ClassEquality.GeneralSlavery,
      text: 'Sell your youngest into slavery',
      perform: compose(
        changeResource('food', 50),
        removeLastChild,
        notify('You have sold your youngest child into slavery. Their life will not be pleasant, but you can survive another day'),
      ),
    },
  ],
});

export const sicknessFullRecovery = createEvent.triggered({
  title: 'Full recovery',
  getText: _ => `You wake up in the morning feeling much better. You have made a full recovery from your sickness`,
  actions: [
    {
      text: 'Finally!',
      perform: compose(
        setCharacterFlag('sickness', false),
        notify('You have made a full recovery from the sickness'),
      ),
    },
    {
      condition: _ => _.resources.coin >= 10,
      text: 'Donate to the temple in thanks',
      perform: compose(
        changeResource('coin', -10),
        setCharacterFlag('sickness', false),
        notify('You have recovered from the sickness and made a donation to the gods to thank them'),
      ),
    },
  ],
});

export const sicknessDifficultRecovery = createEvent.triggered({
  title: 'Difficult recovery',
  getText: _ => `You wake up in the morning feeling better, but not like before. You have made a recovery,
    but the sickness has left a mark on your body.`,
    actions: [
      {
        text: 'Finally!',
        perform: compose(
          setCharacterFlag('sickness', false),
          changeStat('physical', -1 * inIntRange(1, 2)),
          notify('You have made a partial recovery from the sickness'),
        ),
      },
      {
        condition: _ => _.resources.coin >= 10,
        text: 'Donate to the temple in thanks',
        perform: compose(
          changeResource('coin', -10),
          setCharacterFlag('sickness', false),
          changeStat('physical', -1),
          notify('You have recovered from the sickness, with difficulty, and made a donation to the gods to thank them'),
        ),
      },
    ],
});

export const sickness = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.sickness !== true
    && (_.character.physical < 2 || _.worldFlags.sickness === true),
  title: 'Sick!',
  getText: _ => `In the morning, you barely get out of bed. Everything hurts, you feel tired,
    and you are coughing. You don't remember when you have last felt this ill.`,
  actions: [
    {
      condition: _ => _.resources.coin >= 100,
      text: 'Pay for priests to heal you',
      perform: compose(
        changeResource('coin', -100),
        notify('It was expensive, but priests heal you completely with divine magic'),
      ),
    },
    {
      condition: _ => _.resources.coin >= 25,
      text: 'Buy herbs',
      perform: compose(
        changeResource('coin', -25),
        notify('You buy herbs, hoping to help your recovery'),
        eventChain([
          { id: death.id, weight: 1 },
          { id: sicknessDifficultRecovery.id, weight: 2 },
          { id: sicknessFullRecovery.id, weight: 3 },
          { id: sicknessDifficultRecovery.id, weight: 2, condition: _ => _.character.physical >= 6 },
          { id: sicknessFullRecovery.id, weight: 3, condition: _ => _.character.physical >= 6 },
        ]),
      ),
    },
    {
      text: 'Walk it off',
      perform: eventChain([
        { id: death.id, weight: 1 },
        { id: sicknessDifficultRecovery.id, weight: 1 },
        { id: sicknessFullRecovery.id, weight: 1 },
        { id: sicknessDifficultRecovery.id, weight: 1, condition: _ => _.character.physical >= 6 },
        { id: sicknessFullRecovery.id, weight: 1, condition: _ => _.character.physical >= 6 },
      ]),
    },
  ],
});

export const wishStrength = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually strong`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        changeStat('physical', 10),
        setCharacterFlag('djinnFound', true),
        notify('A djinn has granted you great strength'),
      ),
    },
  ],
});

export const wishIntelligence = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually clever`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        changeStat('intelligence', 10),
        setCharacterFlag('djinnFound', true),
        notify('A djinn has granted you great cunning'),
      ),
    },
  ],
});

export const wishEducation = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually knowledgeable`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        changeStat('education', 10),
        setCharacterFlag('djinnFound', true),
        notify('A djinn has granted you great knowledge'),
      ),
    },
  ],
});

export const wishCharm = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually attractive and talkative`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        changeStat('charm', 10),
        setCharacterFlag('djinnFound', true),
        notify('A djinn has granted you great charm and... uh... assets'),
      ),
    },
  ],
});

export const wishCoin = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you see a huge chest of gold stand before you`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        changeResource('coin', 1_000),
        setCharacterFlag('djinnFound', true),
        notify('A djinn has granted you great wealth'),
      ),
    },
  ],
});

export const wishFame = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you hear the crowds cheering your name with joy`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        changeResource('renown', 1_000),
        setCharacterFlag('djinnFound', true),
        notify('A djinn has granted you great fame'),
      ),
    },
  ],
});

export const wishGenderChange = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel your body and realise that it is much different`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        (state) => ({
          ...state,
          character: {
            ...state.character,
            gender: state.character.gender === Gender.Male ? Gender.Female : Gender.Male,
          },
        }),
        setCharacterFlag('djinnFound', true),
        notify('A djinn has changed your gender'),
      ),
    },
  ],
});

export const wishLove = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. You turn to see a beautiful
    ${_.character.gender === Gender.Male ? 'woman' : 'man'} on your bed, smiling and calling you by name to join them`,
  actions: [
    {
      text: 'A wish well spent',
      perform: compose(
        addSpouse,
        setCharacterFlag('djinnFound', true),
        notify('A djinn has granted you love'),
      ),
    },
  ],
});

export const djinnFound = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.characterFlags.djinnFound !== true,
  title: 'A lamp found',
  getText: _ => `
    As you are digging in your garden, your shovel hits something. You take a few moments to dig it out.
    You see that it is some sort of a lamp, with something written on it, but you find it hard to read with
    all the dirt on it. You use your sleeve to wipe it off.
    As you do, a great spirit, a djinn, surges out of the lamp. In a booming voice, it tells you that you may
    make one wish, and it shall grant it. You are both excited, and disappointed that you do not get three`,
  actions: [
    {
      condition: _ => _.character.physical < 10,
      text: 'Wish for strength',
      perform: eventChain(wishStrength.id),
    },
    {
      condition: _ => _.character.intelligence < 10,
      text: 'Wish for cunning',
      perform: eventChain(wishIntelligence.id),
    },
    {
      condition: _ => _.character.education < 10,
      text: 'Wish for knowledge',
      perform: eventChain(wishEducation.id),
    },
    {
      condition: _ => _.character.charm < 10,
      text: 'Wish for beauty and charm',
      perform: eventChain(wishCharm.id),
    },
    {
      text: 'Wish for wealth',
      perform: eventChain(wishCoin.id),
    },
    {
      text: 'Wish for fame',
      perform: eventChain(wishFame.id),
    },
    {
      condition: _ => _.relationships.spouse == null,
      text: 'Wish for love',
      perform: eventChain(wishLove.id),
    },
    {
      text: 'Wish to change your gender',
      perform: eventChain(wishGenderChange.id),
    },
  ],
});
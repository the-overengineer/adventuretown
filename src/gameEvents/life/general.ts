import {
  ClassEquality,
  Gender,
  IGameState,
  Profession,
  ProfessionLevel,
  Prosperity,
  Size,
} from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import {
  action,
  eventCreator,
  time,
} from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import {
  addSpouse,
  changeStat,
  eldestInherits,
  newCharacter,
  removeJob,
  removeLastChild,
  setLevel,
  worsenSpouseRelationship,
  generateLoverDescription,
} from 'utils/person';
import {
  inIntRange,
  pickOne,
} from 'utils/random';
import {
  changeResource,
  changeResourcePercentage,
} from 'utils/resources';
import {
  pregnancyChance,
  setCharacterFlag,
  setWorldFlag,
} from 'utils/setFlag';
import { getAge } from 'utils/time';
import { hasLimitedRights } from 'utils/town';

const GENERAL_LIFE_EVENT_PREFIX: number = 41_000;

const createEvent = eventCreator(GENERAL_LIFE_EVENT_PREFIX);

export const death = createEvent.triggered({
  title: 'Death comes knocking',
  getText: _ => `
    At the age of ${getAge(_.character.dayOfBirth, _.daysPassed)}, ${_.character.name} has died.
    A ceremony is organised by the priests, to pray that ${_.character.name} will be warmly received
    in the halls of the gods. For everybody else, however, life goes on.
  `,
  actions: [
    action('My eldest adult child inherits')
      .when(_ => _.relationships.children.filter(child => getAge(child.dayOfBirth, _.daysPassed) >= 14).length > 0)
      .do(eldestInherits())
      .log('With your death, your belongings are split between your children, and your eldest child is the head of the family'),
    action('Start anew').do(newCharacter).log(`The story continues for another person in the town`),
  ],
});

export const resurrectedByTemple = createEvent.triggered({
  title: 'Resurrection',
  getText: _ => `Though you have died, your family has decided to pay the local priests a large sum of
    money to ask the gods to bring you back to life. You open your eyes and find yourself back amongst
    the living`,
  actions: [
    action('Did I see the gods?').do(changeResource('coin', -1_000)).log(`Your have been resurrected by the local temple`),
  ],
});

export const dying = createEvent.triggered({
  title: 'The world fades',
  getText: _ => `The world is fading fast before your eyes, Physical draining out of you`,
  actions: [
    action('Is this it?').do(
      triggerEvent(death).withWeight(2)
        .orTrigger(resurrectedByTemple)
          .onlyWhen(_ => _.resources.coin >= 1_000 && _.worldFlags.temple! && (_.relationships.spouse != null || _.relationships.children.length > 0))
    ),
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
    action('My eldest adult child inherits')
      .when(_ => _.relationships.children.filter(child => getAge(child.dayOfBirth, _.daysPassed) >= 14).length > 0)
      .do(eldestInherits())
      .log('With your banishment, your belongings are confiscated, but your eldest child is the head of the family'),
    action('Start anew').do(newCharacter).log(`The story continues for another person in the town`),
  ]
})

export const noMoney = createEvent.regular({
  meanTimeToHappen: 7,
  condition: _ => _.resources.coin === 0,
  title: 'Out of money',
  getText: _ => `You have no more money. You have nowhere to sleep, no way to get resources.
    Life cannot go on like this for much longer`,
  actions: [
    action('Give up on life').do(triggerEvent(death)),
    action('Sell food urgently').spendResource('food', 30).changeResource('coin', 15).log(
      'You sell some of your food at low prices to get coin',
    ),
    action('Beg for coin').spendResource('renown', 50).changeResource('coin', 15).log(
      'You shame yourself begging for coin in the town square',
    ),
    action('Sell your youngest into slavery').when(_ => _.relationships.children.length > 0).changeResource('coin', 50).and(removeLastChild).log(
      'You have sold your youngest child into slavery. Their life will not be pleasant, but you can survive another day',
    ),
  ],
});

export const noFood = createEvent.regular({
  meanTimeToHappen: 7,
  condition: _ => _.resources.food === 0,
  title: 'Out of food',
  getText: _ => `You have not eaten more than scraps in days. You have no food in your stores. You feel your body weakening,
    but you cannot go on like this any more`,
  actions: [
    action('Endure').when(_ => _.character.physical > 0).do(changeStat('physical', -1)).log('Your body weakens, but you survive another day without food'),
    action('Give up on life').do(triggerEvent(death)),
    action('Buy food urgently').spendResource('coin', 20).changeResource('food', 15).log('You buy food, at a high price'),
    action('Beg for food').spendResource('renown', 30).changeResource('food', 15).log('You shame yourself by begging for food in the town square'),
    action('Sell your youngest into slavery').when(_ => _.relationships.children.length > 0).changeResource('food', 50).and(removeLastChild).log(
      'You have sold your youngest child into slavery. Their life will not be pleasant, but you can survive another day',
    ),
  ],
});

export const sicknessFullRecovery = createEvent.triggered({
  title: 'Full recovery',
  getText: _ => `You wake up in the morning feeling much better. You have made a full recovery from your sickness`,
  actions: [
    action('Finally!').log('You have made a full recovery from the sickness'),
    action('Donate to the gods in thanks').spendResource('coin', 10).changeResource('renown', 5).log(
      `You have recovered fully from the sickness, and donate to the temple in thanks`,
    ),
  ],
});

export const sicknessDifficultRecovery = createEvent.triggered({
  title: 'Difficult recovery',
  getText: _ => `You wake up in the morning feeling better, but not like before. You have made a recovery,
    but the sickness has left a mark on your body and mind`,
    actions: [
      action('Finally!').do(
        pickOne([
          changeStat('physical', -1 * inIntRange(1, 2)),
          changeStat('intelligence', -1 * inIntRange(1, 2)),
          changeStat('charm', -1 * inIntRange(1, 2)),
        ]),
      ).log('You have made a partial recovery from the sickness'),
      action('Donate to the gods in thanks').spendResource('coin', 10).changeResource('renown', 5).and(
        pickOne([
          changeStat('physical', -1 * inIntRange(1, 2)),
          changeStat('intelligence', -1 * inIntRange(1, 2)),
          changeStat('charm', -1 * inIntRange(1, 2)),
        ]),
      ).log('You have made a partial recovery from the sickness'),
    ],
});

export const sickness = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.character.physical < 1 || _.worldFlags.sickness!,
  title: 'Sick!',
  getText: _ => `In the morning, you barely get out of bed. Everything hurts, you feel tired,
    and you are coughing. You don't remember when you have last felt this ill.`,
  actions: [
    action('Pay for the priests to heal you').when(_ => _.worldFlags.temple!).spendResource('coin', 100).log(
      'It was expensive, but priests heal you completely with divine magic',
    ),
    action('Buy herbs').spendResource('coin', 25).and(
      triggerEvent(death)
          .orTrigger(sicknessDifficultRecovery).withWeight(3).multiplyByFactor(2, _ => _.character.physical >= 6)
          .orTrigger(sicknessFullRecovery).withWeight(3).multiplyByFactor(2, _ => _.character.physical >= 6)
    ).log('You buy herbs, hoping to speed up your recovery'),
    action('Walk it off').do(
      triggerEvent(death)
        .orTrigger(sicknessDifficultRecovery).multiplyByFactor(2, _ => _.character.physical >= 6)
        .orTrigger(sicknessFullRecovery).multiplyByFactor(2, _ => _.character.physical >= 6),
    ),
  ],
});

export const wishStrength = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually strong`,
  actions: [
    action('A wish well spent').do(changeStat('physical', 10)).and(setCharacterFlag('djinnFound')).log(
      'A djinn has granted you great strength',
    ),
  ],
});

export const wishIntelligence = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually clever`,
  actions: [
    action('A wish well spent').do(changeStat('intelligence', 10)).and(setCharacterFlag('djinnFound')).log(
      'A djinn has granted you great cunning',
    ),
  ],
});

export const wishEducation = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually knowledgeable`,
  actions: [
    action('A wish well spent').do(changeStat('education', 10)).and(setCharacterFlag('djinnFound')).log(
      'A djinn has granted you great knowledge',
    ),
  ],
});

export const wishCharm = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel... unusually attractive and talkative`,
  actions: [
    action('A wish well spent').do(changeStat('charm', 10)).and(setCharacterFlag('djinnFound')).log(
      'A djinn has granted you great charm and... uh... assets',
    ),
  ],
});

export const wishCoin = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you see a huge chest of gold stand before you`,
  actions: [
    action('A wish well spent').changeResource('coin', 2_500).and(setCharacterFlag('djinnFound')).log(
      'A djinn has granted you great wealth',
    ),
  ],
});

export const wishFame = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you hear the crowds cheering your name with joy`,
  actions: [
    action('A wish well spent').changeResource('renown', 2_500).and(setCharacterFlag('djinnFound')).log(
      'A djinn has granted you great fame',
    ),
  ],
});

const changeGender = (state: IGameState) => ({
  ...state,
  character: {
    ...state.character,
    gender: state.character.gender === Gender.Male ? Gender.Female : Gender.Male,
  },
});

export const wishGenderChange = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. As he does, you feel your body and realise that it is much different`,
  actions: [
    action('A wish well spent').do(changeGender).and(setCharacterFlag('djinnFound')).log(
      'A djinn has changed your gender',
    ),
  ],
});

export const wishLove = createEvent.triggered({
  title: 'Wish granted',
  getText: _ => `The djinn roars something out in a booming voice before he vanishes. You turn to see a beautiful
    ${_.character.gender === Gender.Male ? 'woman' : 'man'} on your bed, smiling and calling you by name to join them`,
  actions: [
    action('A wish well spent').do(addSpouse).and(setCharacterFlag('djinnFound')).log(
      'A djinn has granted you love',
    ),
  ],
});

export const djinnFound = createEvent.regular({
  meanTimeToHappen: 100 * 365,
  condition: _ => _.characterFlags.djinnFound !== true,
  title: 'A lamp found',
  getText: `
    As you are digging in your garden, your shovel hits something. You take a few moments to dig it out.
    You see that it is some sort of a lamp, with something written on it, but you find it hard to read with
    all the dirt on it. You use your sleeve to wipe it off.
    As you do, a great spirit, a djinn, surges out of the lamp. In a booming voice, it tells you that you may
    make one wish, and it shall grant it. You are both excited, and disappointed that you do not get three`,
  actions: [
    action('Wish for strength').when(_ => _.character.physical < 10).do(triggerEvent(wishStrength)),
    action('Wish for cunning').when(_ => _.character.intelligence < 10).do(triggerEvent(wishIntelligence)),
    action('Wish for knowledge').when(_ => _.character.education < 10).do(triggerEvent(wishEducation)),
    action('Wish for beauty and charm').when(_ => _.character.charm < 10).do(triggerEvent(wishCharm)),
    action('Wish for wealth').do(triggerEvent(wishCoin)),
    action('Wish for fame').do(triggerEvent(wishFame)),
    action('Wish for love').when(_ => _.relationships.spouse == null).do(triggerEvent(wishLove)),
    action('Wish to change your gender').do(triggerEvent(wishGenderChange)),
  ],
});

export const deathOfOldAge = createEvent.regular({
  meanTimeToHappen: 15 * 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 50,
  title: 'Time waits for nobody',
  getText: _ => `You have lived a long life, and it has come to an end`,
  actions: [
    action('It was a good life').do(triggerEvent(death)),
  ],
});

export const scandal = createEvent.regular({
  meanTimeToHappen: time(3, 'years'),
  condition: _ => _.character.profession != null && _.resources.renown >= 50,
  title: 'Scandal at work!',
  getText: _ => `A bit of a mess happened in your place of business, and somehow you were the
    one blamed for it. This won't look good!`,
  actions: [
    action(`It's not my fault!`).spendResource('renown', 50).log('You get blamed for a disaster at your place of business'),
  ],
});

export const minorRepairs = createEvent.regular({
  meanTimeToHappen: time(2.5, 'years'),
  condition: _ => _.resources.coin >= 20,
  title: 'Minor repairs',
  getText: _ => `As you look around your home, you notice that you need to do minor repairs. The door is tilted, the roof is leaking,
    and the straw on your bed is starting to rot`,
  actions: [
    action('Better be worth it').spendResource('coin', 20).log('You spend some money doing repairs around the house'),
  ],
});

export const roofCollapsed = createEvent.regular({
  meanTimeToHappen: time(15, 'years'),
  condition: _ => _.resources.coin >= 100,
  title: 'Roof collapsed!',
  getText: _ => `You knew your house wasn't the sturdiest building in the world, but you were very unpleasantly surprised when the latest
    storm collapsed it, very nearly pinning your under it! This will take money to repair`,
  actions: [
    action('Not much choice').spendResource('coin', 100).log('Your roof collapsed and you had to spend a pretty penny repairing it'),
  ],
});

export const foodRots = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.resources.food >= 50,
  title: 'Food rots',
  getText: _ => `You've made more than sufficient supplies of food, and it is maddening to learn that some of it has rotten and is inedible`,
  actions: [
    action('Curses').resourceLosePercentage('food', 20).log('Some of your food has rotten and become inedible'),
  ],
});

export const breakIn = createEvent.regular({
  meanTimeToHappen: 24 * 30,
  condition: _ => (_.resources.coin >= 100 && _.resources.food >= 100) && _.town.size > Size.Small,
  title: 'Break-in',
  getText: _ => `While nobody is in your house, somebody who must have heard rumours of your wealth broke in and stole some of your supplies`,
  actions: [
    action('Scoundrels!').resourceLosePercentage('coin', 15).resourceLosePercentage('food', 5).log('You were a victim of theft. Some of your coin and food are gone'),
  ],
});

export const loversToSpouses = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.characterFlags.lover! && _.relationships.spouse == null,
  title: `Lover's proposal`,
  getText: _ => `Your affair with your lover has lasted for a while, and after all this time they start discussing the topic of marriage.
    They seem to be as much, if not more, in love with you as when this started`,
  actions: [
    {
      text: '"I thought you would never ask"',
      perform: compose(
        addSpouse,
        setCharacterFlag('lover', false),
        notify('You have married your lover, making your love official'),
      ),
    },
    {
      text: '"This is all I need"',
      perform: notify('Your lover is disappointed but understands'),
    },
    {
      text: 'Break up with them',
      perform: compose(
        setCharacterFlag('lover', false),
        notify('Your lover asked for too much and you broke up with them'),
      ),
    },
  ],
});

export const buySlaves = createEvent.regular({
  meanTimeToHappen: 1.5 * 365,
  condition: _ => _.town.equality === ClassEquality.GeneralSlavery
    && !_.characterFlags.slaves
    && _.resources.coin >= 50,
  title: 'Purchasing slaves',
  getText: _ => `You see fresh, young slaves being sold at the slave market. Not too expensive, either.
    You are sure you can afford a few. They would consume some of your food, but would also
    earn money and prestige for you`,
  actions: [
    {
      text: 'Buy some slaves',
      perform: compose(
        setCharacterFlag('slaves', true),
        setCharacterFlag('abusedSlaves', false),
        setCharacterFlag('treatedSlavesWell', false),
        changeResource('coin', -50),
        notify('You purchased some slaves'),
      ),
    },
    {
      text: `I'd rather not`,
    },
  ],
});

export const sellSlaves = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.town.equality === ClassEquality.GeneralSlavery
    && _.characterFlags.slaves!,
  title: 'Selling slaves',
  getText: _ => `A visitor to your home is looking at your slaves with envy. You have fed them well,
    and they are strong and attractive. Licking their lips, the visitor offers some coin for your slaves.
    It is another half on top of what you paid for them originally`,
  actions: [
    {
      text: 'Sell the slaves',
      perform: compose(
        setCharacterFlag('slaves', false),
        setCharacterFlag('abusedSlaves', false),
        setCharacterFlag('treatedSlavesWell', false),
        changeResource('coin', 75),
        notify('You sold your slaves for a tidy profit'),
      ),
    },
    {
      text: 'Keep them',
    },
  ],
});

export const attractiveSlave = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.slaves!,
  title: 'Attractive slave',
  getText: _ => `One of your slaves has filled out nicely since you purchased ${_.character.gender === Gender.Male ? 'her' : 'him'}. They would
    surely give you an enjoyable tumble, and they have no choice but to obey you`,
  actions: [
    {
      text: 'Command them to follow',
      perform: compose(
        setCharacterFlag('abusedSlaves', true),
        pregnancyChance('pregnantLover'),
        worsenSpouseRelationship,
        notify(`You've taken your slave to your bedroom and used them in all kinds of ways`),
      ),
    },
    {
      text: 'Leave them to their work',
    },
  ],
});

export const beatingSlaves = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.slaves! && _.characterFlags.focusPhysical! && _.character.physical < 8,
  title: 'Punching bags',
  getText: _ => `You realise that your slaves could be a good way to exercise. You could stage fights with them and punch
    them all you want, and they would not be allowed to hurt you`,
  actions: [
    {
      text: 'Come here, slave!',
      perform: compose(
        changeStat('physical', 1),
        setCharacterFlag('abusedSlaves', true),
        notify('You beat your slaves as a form of exercise'),
      ),
    },
    {
      text: 'That seems too much',
    },
  ],
});

export const slaveRuinsLunch = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.slaves!,
  title: 'Lunch ruined',
  getText: _ => `One of your slaves has neglected their duties, and in the process ruined your lunch`,
  actions: [
    {
      text: 'Beat them',
      perform: compose(
        setCharacterFlag('abusedSlaves', true),
        changeResource('food', -1),
        notify('You have beaten your slave for ruining food'),
      ),
    },
    {
      text: 'Forgive them',
      perform: compose(
        setCharacterFlag('treatedSlavesWell', true),
        changeResource('food', -1),
        notify('You have forgiven your slave for ruining lunch'),
      ),
    },
  ],
});

export const slaveHoliday = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.slaves!,
  title: 'Slave holiday',
  getText: _ => `Your slaves come to you, fearful. The bravest of them steps out and asks if you would allow
    then a day off and some food to celebrate some holiday of their`,
  actions: [
    {
      text: 'Allow it and grant food',
      perform: compose(
        changeResource('food', -10),
        setCharacterFlag('treatedSlavesWell', true),
        notify('You have allowed your slaves to celebrate, they will be thankful'),
      ),
    },
    {
      text: 'Forbid it',
      perform: notify('You have not allowed your slaves to celebrate. They retreat, disappointed'),
    },
    {
      text: 'Beat them for asking',
      perform: compose(
        setCharacterFlag('abusedSlaves', true),
        notify('You savagely beat your slaves for asking you stupid questions'),
      ),
    },
  ],
});

export const slavesSick = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.slaves! && _.worldFlags.sickness!,
  title: 'Slaves sick',
  getText: _ => `The sickness ravaging the town hasn't even spared your slaves.
    Most of them are groaning in pain and sweating, unable to work`,
  actions: [
    {
      condition: _ => _.resources.coin >= 25,
      text: 'Buy herbs for them',
      perform: compose(
        changeResource('coin', -25),
        setCharacterFlag('treatedSlavesWell', true),
        notify('You pay to heal your slaves and most survive. They will be thankful'),
      ),
    },
    {
      text: 'Let them die',
      perform: compose(
        setCharacterFlag('slaves', false),
        notify('The sickness carries away your slaves with it'),
      ),
    },
  ],
});

export const slavesRewardKindness = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.slaves! && _.characterFlags.treatedSlavesWell!,
  title: 'Slaves reward kindness',
  getText: _ => `The slaves pool their meagre resources to make a gift to you for treating
    them so well`,
  actions: [
    {
      text: 'You are human beings, after all',
      perform: compose(
        changeResource('coin', 10),
        notify('Your slaves make a gift to you for your kindness'),
      ),
    },
  ],
});

export const slavesRestrained = createEvent.triggered({
  title: 'Rebellion stopped',
  getText: _ => `You easily stop the slave rebellion. You are better equipped and better fed.
    The slaves are thrown back into their pens, after a quick beating to teach them their place`,
  actions: [
    {
      text: 'Ungrateful swine',
      perform: notify('You nipped the slave rebellion in the bud'),
    },
  ],
});

export const slavesKilled = createEvent.triggered({
  title: 'Slaves killed',
  getText: _ => `In the ensuing conflict, you were forced to kill your slaves, for they would rather
    die than return to their miserable lives`,
  actions: [
    {
      text: `Now I have to buy new ones`,
      perform: compose(
        setCharacterFlag('slaves', false),
        setCharacterFlag('abusedSlaves', false),
        setCharacterFlag('treatedSlavesWell', false),
        notify('Your slaves were slain in an attempt to rebel against you'),
      ),
    },
  ],
});

export const slavesEscape = createEvent.triggered({
  title: 'Slaves escape',
  getText: _ => `In the chaos that ensues, most of the slaves manage to escape, never to be seen
    again`,
  actions: [
    {
      text: `Now I have to buy new ones`,
      perform: compose(
        setCharacterFlag('slaves', false),
        setCharacterFlag('abusedSlaves', false),
        setCharacterFlag('treatedSlavesWell', false),
        notify('Your slaves have escaped'),
      ),
    },
  ],
});

export const slavesRebel = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.characterFlags.slaves! && _.characterFlags.abusedSlaves!,
  title: 'Slaves rebel',
  getText: _ => `Sick of getting treated poorly, your slaves rebel against you, picking up the
    tools of the trade and trying to kill you or escape`,
  actions: [
    {
      text: 'Stop them!',
      perform: triggerEvent(slavesRestrained).withWeight(3)
        .orTrigger(slavesKilled)
        .orTrigger(slavesEscape)
        .orTrigger(death).onlyWhen(_ => _.character.physical < 4)
        .toTransformer()
    },
  ],
});

export const slavesMustBeFreed = createEvent.regular({
  meanTimeToHappen: 5,
  condition: _ => _.characterFlags.slaves! && _.town.equality !== ClassEquality.GeneralSlavery,
  title: 'Slaves freed',
  getText: _ => `The laws have changed, no longer allowing you to keep slaves. You are forced to
    release them, under the watchful eye of the magistrate`,
  actions: [
    {
      text: `It was good while it lasted`,
      perform: compose(
        setCharacterFlag('slaves', false),
        setCharacterFlag('abusedSlaves', false),
        setCharacterFlag('treatedSlavesWell', false),
        notify('Your slaves had to be released'),
      ),
    },
  ],
});

export const costsOfLiving = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.resources.coin >= 20,
  title: 'Costs of living',
  getText: _ => `Life costs a bit extra every now and then`,
  actions: [
    action('So it does').resourceLosePercentage('coin', 5).log('You have incurred some regular costs of living'),
  ],
});

export const fameFades = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _=> _.resources.renown >= 200,
  title: 'Fame fades',
  getText: `The fame and renown you have acquired over the years is not what it used to be. Some of the old tales are no longer
    being told, and some have been associated with other people, who had nothing to do with it`,
  actions: [
    action(`But I'm still important, right?`).resourceLosePercentage('renown', 15).log('Some of your old fame has faded away with time'),
  ],
});

export const slandered = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.resources.renown >= 150,
  title: 'Slandered!',
  getText: `You discover that you have been a victim of slander. Though the tales they tell of you are... probably not true, it will affect
    your standing in society`,
  actions: [
    action('Why, if I find them...').changeResource('renown', -100).log('You have been a victim of slander, affecting your standing in the community'),
  ],
});

export const buryGold = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.resources.coin >= 500 && !_.worldFlags.buriedGold,
  title: 'Burying gold',
  getText: _ => `You have gold aplenty, but you are not certain you always will have. What if you get robbed,
    or if you get banished and your children are left with nothing? It might be a good idea to bury a few coins
    for rainy days`,
  actions: [
    {
      text: 'Bury the gold',
      perform: compose(
        changeResource('coin', -100),
        setWorldFlag('buriedGold', true),
        notify('You bury some gold for rainy days'),
      ),
    },
    {
      text: 'I would rather keep it',
    },
  ],
});

export const digOutGold = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.resources.coin < 100 && _.worldFlags.buriedGold!,
  title: 'Buried gold',
  getText: _ => `You are not exactly the richest person in town right now. And then it hits you - the buried gold!
    It was stashed exactly for situations like this one`,
  actions: [
    {
      text: 'Dig it out',
      perform: compose(
        changeResource('coin', 100),
        setWorldFlag('buriedGold', false),
        notify('You dig up the stash of gold'),
      ),
    },
    {
      text: 'Leave it',
    },
  ],
});

export const buriedGoldStolen = createEvent.regular({
  meanTimeToHappen: 150 * 365,
  condition: _ => _.worldFlags.buriedGold!,
  title: 'Buried gold stolen',
  getText: _ => `Somebody somehow managed to find the gold that was buried, and stole it. You will have
    nothing left for rainy days`,
  actions: [
    {
      text: 'Curses!',
      perform: compose(
        setWorldFlag('buriedGold', false),
        notify('Somebody dug up your gold'),
      ),
    },
  ],
});

export const verminEatGrain = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.vermin!,
  title: 'Mice get into grain',
  getText: _ => `You find that some of the sacks of grain in your basement have been bitten through
    and the grain eaten. It looks like mice got to them`,
  actions: [
    {
      text: 'They are everywhere!',
      perform: compose(
        changeResource('food', -50),
        notify('Mice got into your grain supplies'),
      ),
    },
  ],
});

export const templeHelpsFood = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.temple! && _.resources.food < 25,
  title: 'Temple gives food',
  getText: _ => `The priests from the local temple have been going around and donating food to those unfortunate enough
    not to have much. You have been judged to be one of those and offered some`,
  actions: [
    {
      text: 'Take it',
      perform: compose(
        changeResource('food', 25),
        notify('The local temple has given you some food'),
      ),
    },
    {
      text: 'My pride does not allow it',
      perform: compose(
        changeResource('renown', 5),
        notify('You pridefully rejected a food donation from the local temple'),
      ),
    },
  ],
});

export const loverAtWorkRejected = createEvent.triggered({
  title: 'Rejected',
  getText: _ => `You approach your colleague and tell them what you had on your mind. They are outraged that you
    would think so, and do not seem to share your attraction`,
  actions: [
    {
      text: 'But I was certain!',
      perform: compose(
        changeResource('renown', -10),
        notify('You have been rejected by a lover at work'),
      ),
    },
  ],
});

export const loverAtWorkOneTime = createEvent.triggered({
  title: 'Pleasurable',
  getText: _ => `You spend a fun hour or so with your colleague-turned-lover, but it looks like that is all there
    will be to it for the time being`,
  actions: [
    {
      text: 'It was fun!',
      perform: compose(
        pregnancyChance('pregnantLover'),
        notify('You had a fun tumble with a co-worker'),
      ),
    },
  ],
});

export const loverAtWorkAThing = createEvent.triggered({
  title: 'Is this love?',
  getText: _ => `After the brief time you spend together (when you should have been working), your infatuation seems to
    only grow. Your lover looks at you adoringly and suggests that this should be a regular occurrence.`,
  actions: [
    {
      text: 'Agree',
      perform: compose(
        pregnancyChance('pregnantLover'),
        setCharacterFlag('lover', true),
        notify('You have started a relationship with somebody you work with'),
      )
    },
    {
      text: 'This was enough for me',
      perform: compose(
        pregnancyChance('pregnantLover'),
        notify('You had a fun time with a person you work with, but that is it'),
      ),
    },
  ],
});

export const loverAtWorkFired = createEvent.triggered({
  title: 'Discovered',
  getText: _ => `To your dismay, your superior discovers you and your lover when you are just a mess of naked, sweaty bodies.
    They are furious that you would do this instead of working, and immediately fire you`,
  actions: [
    {
      text: 'Uh-oh',
      perform: compose(
        pregnancyChance('pregnantLover'),
        removeJob,
        notify('You lost your job for focusing on things other than work'),
      ),
    },
  ],
});

export const loverAtWorkDemoted = createEvent.triggered({
  title: 'Discovered',
  getText: _ => `To your dismay, your superior discovers you and your lover when you are just a mess of naked, sweaty bodies.
    They are furious that you would do this instead of working, and immediately demote you`,
  actions: [
    {
      text: 'Uh-oh',
      perform: compose(
        pregnancyChance('pregnantLover'),
        setLevel(ProfessionLevel.Entry),
        notify('You lost your position at work for focusing on things other than work'),
      ),
    },
  ],
});

export const loverAtWork = createEvent.regular({
  meanTimeToHappen: 4 * 365,
  condition: _ => !_.characterFlags.lover
    && _.character.profession != null,
  title: 'Working together',
  getText: _ => {
    const otherNoun = _.character.gender === Gender.Male ? 'woman' : 'man';
    const otherPronoun = _.character.gender === Gender.Male ? 'she' : 'he';

    return `You find yourself working together with a ${otherNoun} whom you are slowly starting to fancy.
      You could not say ${otherPronoun} is especially exotic or well-off, but you feel drawn. ${generateLoverDescription(_)}`;
  },
  actions: [
    {
      text: 'Approach them at work',
      perform: triggerEvent(loverAtWorkRejected).multiplyByFactor(3, _ => _.character.charm < 3 && _.character.physical < 3 && _.resources.coin < 250)
        .orTrigger(loverAtWorkOneTime).withWeight(3).multiplyByFactor(2, _ => _.character.charm >= 6)
        .orTrigger(loverAtWorkAThing).withWeight(2).multiplyByFactor(2, _ => _.character.charm >= 6)
        .orTrigger(loverAtWorkFired).onlyWhen(_ => _.character.professionLevel === ProfessionLevel.Entry)
        .orTrigger(loverAtWorkDemoted).onlyWhen(_ => _.character.professionLevel === ProfessionLevel.Medium)
        .toTransformer(),
    },
    {
      text: 'Leave it be',
    },
  ],
});

export const briberyFine = createEvent.triggered({
  title: 'Hefty fine',
  getText: _ => `You are forced to pay a significant fine to the town due to your engaging in bribery`,
  actions: [
    {
      text: 'No choice',
      perform: compose(
        changeResource('coin', -250),
        changeResource('renown', -250),
        setCharacterFlag('bribery', false),
        notify('You pay a large fine due to the fact you engaged in bribery'),
      ),
    }
  ],
});

export const briberyBanished = createEvent.triggered({
  title: 'Banished for bribery',
  getText: _ => `The town considers your actions very serious, and have decided on the ultimate punishment of having you banished from
    the town and your belongings taken away`,
  actions: [
    {
      text: `That's a bit much`,
      perform: triggerEvent(banishment).toTransformer(),
    },
  ],
});

export const briberyBribe = createEvent.triggered({
  title: 'Double bribe',
  getText: _ => `You see the guards smile as you offer them a bribe to let this one slide. It seems that was all they were after`,
  actions: [
    {
      text: 'How deep does it go?',
      perform: compose(
        changeResource('coin', -100),
        notify('You bribed the guards to forget about all the bribery you engaged in'),
      ),
    },
  ],
});

export const briberyFired = createEvent.triggered({
  title: 'Position lost',
  getText: _ => `Due to the fact that you have engaged in bribery, you have been stripped of your prestigious position completely`,
  actions: [
    {
      text: `Damn it`,
      perform: compose(
        changeResource('renown', -250),
        removeJob,
        notify('You have lost your cushy job due to engaging in bribery'),
      ),
    },
  ],
});

export const briberyDiscovered = createEvent.regular({
  meanTimeToHappen: 20 * 365,
  condition: _ => _.characterFlags.bribery! && _.worldFlags.townGuard!,
  title: 'Bribery discovered',
  getText: _ => `The town guard corner you. They have irrefutable evidence that you have engaged in giving or taking
    of bribes, and mean to have you punished for it`,
  actions: [
    {
      text: 'Admit it',
      perform: triggerEvent(briberyFine).withWeight(4).onlyWhen(_ => _.resources.coin >= 250).multiplyByFactor(3, _ => _.resources.renown >= 250)
        .orTrigger(briberyBanished)
          .onlyWhen(_ => _.character.professionLevel !== ProfessionLevel.Leadership && _.resources.renown < 1000)
          .multiplyByFactor(3, _ => _.characterFlags.enemiesInHighPlaces!)
        .orTrigger(briberyFired).onlyWhen(_ => _.character.professionLevel === ProfessionLevel.Leadership || _.character.profession === Profession.Politician)
        .toTransformer(),
    },
    {
      condition: _ => _.resources.coin >= 100,
      text: 'Um... bribe them?',
      perform: triggerEvent(briberyFine).withWeight(4).onlyWhen(_ => _.resources.coin >= 250).multiplyByFactor(3, _ => _.resources.renown >= 250)
      .orTrigger(briberyBanished).onlyWhen(_ => _.character.professionLevel !== ProfessionLevel.Leadership && _.resources.renown < 1000)
      .orTrigger(briberyFired).onlyWhen(_ => _.character.professionLevel === ProfessionLevel.Leadership || _.character.profession === Profession.Politician)
      .orTrigger(briberyBribe).withWeight(5).multiplyByFactor(3, _ => _.resources.renown >= 250 || _.character.charm >= 6)
      .toTransformer(),
    },
  ],
});

export const briberyForgotten = createEvent.regular({
  meanTimeToHappen: 15 * 365,
  condition: _ => _.characterFlags.bribery!,
  title: 'Bribery forgotten',
  getText: _ => `You have engaged into bribery in the past, but apparently nobody cares that you are corrupt. You doubt this
    will come to haunt you in the future`,
  actions: [
    {
      text: 'Excellent!',
      perform: compose(
        setCharacterFlag('bribery', false),
        notify('Nobody seems to care that you have engaged in bribery and corruption'),
      ),
    },
  ],
});

export const sellSlavesFoodTight = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.characterFlags.slaves!
    && _.resources.food < 50
    && (_.finances.foodIncome - _.finances.foodExpenses) <= 1,
  title: 'Selling slaves',
  getText: _ => `You have considered selling your slaves, though at a lower price than you bought them for, in an effort
    to preserve your food stores, which are currently low`,
  actions: [
    {
      text: 'Sell them',
      perform: compose(
        changeResource('coin', 35),
        setCharacterFlag('slaves', false),
        notify('You have sold your slaves in an effort to preserve your food stores'),
      ),
    },
    {
      text: 'Keep them',
    },
  ],
});

export const purchaseFarmland = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => !_.characterFlags.farmland && _.resources.coin >= 500,
  title: 'Purchase farmland',
  getText: _ => `A farmer approaches you with the idea of selling his farmland to you. He needs investment
    in his land, and in return you would be receiving a sizable chunk of his produce`,
  actions: [
    {
      text: 'Invest',
      perform: compose(
        changeResource('coin', -500),
        setCharacterFlag('farmland', true),
        notify('You have purchased arable farmland, and farmers will work it fo you'),
      ),
    },
    {
      text: 'Seems like a poor investment',
    },
  ],
});

export const farmlandStruggles = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.characterFlags.farmland! && (_.worldFlags.famine! || _.worldFlags.sickness! || _.town.prosperity < Prosperity.Average || _.town.size <= Size.Modest),
  title: 'Farm struggles',
  getText: _ => `The farm you own has been going through some hard times recently. If they are not invested in, they will go out
    of business`,
  actions: [
    {
      condition: _ => _.resources.coin >= 100,
      text: 'Invest in them',
      perform: compose(
        changeResource('coin', -100),
        notify('You invested into your farm to keep it going'),
      ),
    },
    {
      text: 'Let it fail',
      perform: compose(
        setCharacterFlag('farmland', false),
        notify('The arable land you own has gone to ruin due to lack of financial support'),
      ),
    },
  ],
});

export const farmlandRuined = createEvent.regular({
  meanTimeToHappen: 50 * 365,
  condition: _ => _.characterFlags.farmland!,
  title: 'Farm fails',
  getText: _ => `The farms you have purchased are getting less and less fruitful, and are no longer providing enough food
    to pay their debt to you. Before long, they will be but a memory`,
  actions: [
    {
      text: 'Disappointing',
      perform: compose(
        setCharacterFlag('farmland', false),
        notify('The farms you purchased have failed, the lands no longer bearing fruit'),
      ),
    },
  ],
});

export const farmlandsGoodSeason = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.characterFlags.farmland!,
  title: 'Farms produce surplus',
  getText: _ => `The farms you own have produced a large surplus this season, and some of it goes directly
    to your stores`,
  actions: [
    {
      text: 'A good investment!',
      perform: compose(
        changeResource('food', 50),
        notify('Your farms have had a good year, and you receive some of their food surplus'),
      ),
    },
  ],
});

export const civilWarRobbed = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.civilWar!,
  title: 'Looting',
  getText: _ => `With the civil war raging in the streets, nobody is safe, you included. It was a stroke of luck that nobody
    was home when the enraged looters went into your home and stole many of your belongings`,
  actions: [
    {
      text: 'You call this luck?',
      perform: compose(
        changeResourcePercentage('coin', -0.2),
        notify('Looters broke into your home and stole many of your belongings'),
      ),
    },
  ],
});

export const meetLover = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.lover!,
  title: 'Meeting a lover',
  getText: `After some time, you have an opportunity to meet up with your lover again for some enjoyable times`,
  actions: [
    action('Gladly!').do(pregnancyChance('pregnantLover')).log('You enjoy a pleasurable day with your lover'),
    action('Pass up on it'),
    action('Break up').do(setCharacterFlag('lover', false)).log('You break up with your lover'),
  ],
});

export const ageLosePhysical = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 40 && !_.characterFlags.focusPhysical && _.character.physical > 4,
  title: 'Body weakens',
  getText: `You are no longer as young as you were. With age, you notice that your body is not as fit and strong as it was before`,
  actions: [
    action('I feel older').and(changeStat('physical', -1)).log('Your body is slowly starting to go with age'),
  ],
});

export const ageLoseIntelligence = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 40 && !_.characterFlags.focusIntelligence && _.character.intelligence > 4,
  title: 'Mind weakens',
  getText: `You are no longer as young as you were. With age, you notice that your mind is less nimble`,
  actions: [
    action('I feel older').and(changeStat('intelligence', -1)).log('Your mind is slowly starting to slow down with age'),
  ],
});

export const ageLoseEducation = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 40 && !_.characterFlags.focusEducation && _.character.education > 4,
  title: 'Memory weakens',
  getText: `You are no longer as young as you were. With age, you notice that your memory isn't want it once was`,
  actions: [
    action('I feel older').and(changeStat('education', -1)).log('You sometimes forget things'),
  ],
});

export const ageLoseCharm = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 40 && !_.characterFlags.focusCharm && _.character.charm > 4,
  title: 'Looks fade',
  getText: `You are no longer as young as you were. With age, you notice that you are less attractive than in your youth`,
  actions: [
    action('I feel older').and(changeStat('charm', -1)).log('Your looks slowly starting to go with age'),
  ],
});

export const oldLosePhysical = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 60 && !_.characterFlags.focusPhysical && _.character.physical > 0,
  title: 'Body weakens',
  getText: `You are one of the oldest people in town. With advanced age, you notice that your body is not as fit and strong as it was before`,
  actions: [
    action('I feel ancient').and(changeStat('physical', -1)).log('Your body is old and rickety'),
  ],
});

export const oldLoseIntelligence = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 60 && !_.characterFlags.focusIntelligence && _.character.intelligence > 0,
  title: 'Mind weakens',
  getText: `You are one of the oldest people in town. With advanced age, you notice that your mind is less nimble`,
  actions: [
    action('I feel ancient').and(changeStat('intelligence', -1)).log('Your mind is going quickly'),
  ],
});

export const oldLoseEducation = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 60 && !_.characterFlags.focusEducation && _.character.education > 0,
  title: 'Memory weakens',
  getText: `You are one of the oldest people in town. With advanced age, you notice that your memory isn't want it once was`,
  actions: [
    action('I feel ancient').and(changeStat('education', -1)).log('You often forget things'),
  ],
});

export const oldLoseCharm = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 60 && !_.characterFlags.focusCharm && _.character.charm > 0,
  title: 'Looks fade',
  getText: `You are one of the oldest people in town. With advanced age, you notice that you are less attractive than in your youth`,
  actions: [
    action('I feel ancient').and(changeStat('charm', -1)).log('Your looks decay rapidly'),
  ],
});

export const shamefulNotMarried = createEvent.regular({
  meanTimeToHappen: time(5, 'years'),
  condition: _ => getAge(_.character.dayOfBirth, _.daysPassed) >= 25 && _.relationships.spouse == null,
  title: 'Unmarried',
  getText: `The fact that you are not married at your age is causing some people to question what is wrong with you`,
  actions: [
    action('I should not be judger').resourceLosePercentage('renown', 10, 50, 500).log('People are questioning why you are still unmarried'),
  ],
});

export const aGoodCatchMarriageProposal = createEvent.regular({
  meanTimeToHappen: time(5, 'years')
    .modify(0.5, _ => _.resources.renown >= 500)
    .modify(0.5, _ => _.resources.coin >= 500)
    .modify(0.5, _ => _.character.charm >= 6)
    .modify(2, _ => _.resources.coin < 200)
    .modify(2, _ => _.resources.renown < 200)
    .modify(2, _ => _.character.charm < 4),
  condition: _ => (_.resources.coin > 200 || _.resources.renown > 200) && _.relationships.spouse == null && hasLimitedRights(_, _.character),
  title: 'A proposal',
  getText: _ => `Due to your position in society, while still remaining unmarried, you have started catching the eye of potential suitors. Finally,
    one of them approaches you and proposes marriage to you. ${generateLoverDescription(_)}`,
  actions: [
    action('Accept').and(addSpouse).log('You have accepted a marriage proposal'),
    action('Refuse').log('You have rejected a proposal of marriage'),
  ],
})

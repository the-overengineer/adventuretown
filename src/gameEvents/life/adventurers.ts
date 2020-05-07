import {
  civilWarLost,
  civilWarWon,
} from 'gameEvents/town/general';
import { triggerEvent } from 'utils/eventChain';
import { eventCreator } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import {
  changeStat,
  createNonBabyChild,
} from 'utils/person';
import { changeResource } from 'utils/resources';
import { setWorldFlag } from 'utils/setFlag';
import { death } from './general';

const ADVENTURERS_EVENT_PREFIX: number = 43_000;

const createEvent = eventCreator(ADVENTURERS_EVENT_PREFIX);

export const adventurersFail = createEvent.triggered({
  title: 'Adventurer quest fails',
  getText: _ => `The adventurers try their best, but they fail to complete their assigned
    quest. They return alive, but ragged and defeated`,
  actions: [
    {
      text: 'I thought they were better',
      perform: notify('The band of adventurers fails their quest'),
    },
  ],
});

export const adventurersDie = createEvent.triggered({
  title: 'Adventurers perish',
  getText: _ => `The adventurers go boldly on their assigned quest. The next day, you hear
    that they have found all of their bodies arranged near the road`,
  actions: [
    {
      text: 'I thought they were better',
      perform: compose(
        setWorldFlag('adventurerKeep', false),
        setWorldFlag('adventurers', false),
        setWorldFlag('adventurersQuestCompleted', false),
        notify('The adventuring party have died while on their quest'),
      ),
    },
  ],
});

export const adventurersRescueChild = createEvent.triggered({
  title: 'Child rescued',
  getText: _ => `The adventurers return proudly from their quest, bringing with them a child. It... could be yours?
    It is very thin and grimy, but it does look vaguely familiar. It's been a while since you've seen your child`,
  actions: [
    {
      text: '"Thank you, brave adventurers"',
      perform: compose(
        createNonBabyChild,
        setWorldFlag('adventurersQuestCompleted', true),
        notify('The adventurers have rescued a child. It could be yours'),
      ),
    },
    {
      text: '"You can keep it"',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', true),
        notify('The adventurers have rescued some child, and you let them keep it'),
      ),
    },
  ],
});

export const adventurersHandleVermin = createEvent.triggered({
  title: 'Vermin defeated',
  getText: _ => `The adventurers have returned from their quest victorious, and the vermin that have plagued
    ${_.town.name} are no more. For some reason they are offering to give you 10 rat tails, which you politely
    refuse`,
  actions: [
    {
      text: 'Thank you, brave adventurers',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', true),
        setWorldFlag('vermin', false),
        notify('The adventurers have rid the town of vermin'),
      ),
    },
  ],
});

export const adventurersHandleGoblins = createEvent.triggered({
  title: 'Goblins defeated',
  getText: _ => `The adventurers have returned from their quest victorious, having scattered the goblin
    tribe that has plageud the town`,
  actions: [
    {
      text: 'Thank you, brave adventurers',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', true),
        setWorldFlag('goblins', false),
        notify('The adventurers have rid the town of goblins'),
      ),
    },
  ],
});

export const adventurersHandleBandits = createEvent.triggered({
  title: 'Bandits defeated',
  getText: _ => `The adventurers have returned from their quest victorious, and the leader of the bandits that
    have plagued the town has been slain, with the rest escaping`,
  actions: [
    {
      text: 'Thank you, brave adventurers',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', true),
        setWorldFlag('bandits', false),
        notify('The adventurers have rid the town of bandits'),
      ),
    },
  ],
});

export const adventurersHandleOrcs = createEvent.triggered({
  title: 'Orcs defeated',
  getText: _ => `The adventurers have returned from their quest victorious, and after all this time ${_.town.name} is
    free of the vicious orcs that have been mounting attacks on it`,
  actions: [
    {
      text: 'Thank you, brave adventurers',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', true),
        setWorldFlag('orcs', false),
        notify('The adventurers have defeated the orcish tribe plaguing the town'),
      ),
    },
  ],
});

export const adventurersFarawayQuest = createEvent.triggered({
  title: 'Adventurers leave for quest',
  getText: _ => `You have told the adventurers of a great quest on another continent, where they can find great fame
    and riches. Despite the fact that you made it all up on the spot, they believe you and depart immediately`,
  actions: [
    {
      text: `"And don't come back!"`,
      perform: compose(
        setWorldFlag('adventurerKeep', false),
        setWorldFlag('adventurers', false),
        setWorldFlag('adventurersQuestCompleted', false),
        notify('The adventurers have departed after being fooled by you into thinking there is some epic quest for them'),
      ),
    },
  ],
});

export const adventurersSeekQuest = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!)
    && !_.worldFlags.adventurersQuestCompleted,
  title: 'Adventurers seek quest',
  getText: _ => `The adventuring party has learned that you have a name, and that has excited them very much for some
    reason. They come to you and ask if you have a quest for them`,
  actions: [
    {
      condition: _ => _.characterFlags.kidnappedChild!,
      text: `"My child has been kidnapped"`,
      perform: triggerEvent(adventurersFail).withWeight(2)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersRescueChild).withWeight(3)
        .toTransformer(),
    },
    {
      condition: _ => _.worldFlags.vermin!,
      text: '"Kill the giant rats"',
      perform: triggerEvent(adventurersFail).withWeight(3)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleVermin).withWeight(6)
        .toTransformer(),
    },
    {
      condition: _ => _.worldFlags.goblins!,
      text: '"Scatter the goblins"',
      perform: triggerEvent(adventurersFail).withWeight(3)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleGoblins).withWeight(3)
        .toTransformer(),
    },
    {
      condition: _ => _.worldFlags.orcs!,
      text: '"Slay the orcs"',
      perform: triggerEvent(adventurersFail).withWeight(2)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleOrcs).withWeight(2)
        .toTransformer(),
    },
    {
      condition: _ => _.worldFlags.bandits!,
      text: '"Defeat the bandit chief"',
      perform: triggerEvent(adventurersFail).withWeight(2)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleBandits).withWeight(2)
        .toTransformer(),
    },
    {
      condition: _ => _.character.charm >= 6,
      text: 'Invent quest in faraway land',
      perform: triggerEvent(adventurersFarawayQuest).toTransformer(),
    },
    {
      text: '"I have nothing for you"',
      perform: notify(`You had no quest for the adventurers. They leave confused. "But you have a name" one of them says sadly`),
    },
  ],
});

export const adventurersFightSuccess = createEvent.triggered({
  title: 'Adventurers defeated',
  getText: _ => `You beat up the adventurers and they scurry away, muttering something about class levels and
    railroading. You are not sure what they mean by that. Everybody is impressed by your victory`,
  actions: [
    {
      text: 'I am a legend',
      perform: compose(
        setWorldFlag('adventurerKeep', false),
        setWorldFlag('adventurers', false),
        setWorldFlag('adventurersQuestCompleted', false),
        changeResource('renown', 200),
        notify('You have defeated the adventurers that picked a fight with you. As they flee the town, you bask in glory'),
      ),
    },
  ],
});

export const adventurersFightWounded = createEvent.triggered({
  title: 'Beaten up by adventurers',
  getText: _ => `The adventurers beat you handily, and would have surely killed you had one of their number not started
    saying that they are Lawful Good and that they can't kill somebody who has submitted. They leave you bleeding on the
    floor`,
  actions: [
    {
      text: 'Everything hurts',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', false),
        changeStat('physical', -1),
        notify('The adventurers beat you up, but leave you alive. It will take some time to recover from this'),
      ),
    },
  ],
});

export const adventurersFightKilled = createEvent.triggered({
  title: 'Killed by adventurers',
  getText: _ => `The adventuring band keeps hitting you and just doesn't stop. The last words you hear in this life
    are "Fireball"`,
  actions: [
    {
      text: 'Nooooo!',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', false),
        triggerEvent(death).toTransformer(),
      ),
    },
  ],
});

export const adventurersAttack = createEvent.triggered({
  title: 'Adventurers attack',
  getText: _ => `Discussion has proven fruitless and the adventurers surge to attack you`,
  actions: [
    {
      text: 'Fight the best you can',
      perform: triggerEvent(adventurersFightKilled)
        .orTrigger(adventurersFightWounded).withWeight(3)
        .orTrigger(adventurersFightSuccess).onlyWhen(_ => _.character.physical >= 6).multiplyByFactor(2, _ => _.character.physical >= 8)
        .toTransformer(),
    },
  ],
});

export const adventurersAccuseCharmSuccess = createEvent.triggered({
  title: 'Charming the adventurers',
  getText: _ => `You use your charms to convince the adventurers to leave you alone`,
  actions: [
    {
      text: 'Good riddance',
      perform: notify('The adventurers leave you alone after you use your charms on them'),
    }
  ],
});

export const adventurersAccuseCharmFailure = createEvent.triggered({
  title: 'Not charming enough',
  getText: _ => `Your charms were insufficient to sway the adventurers and they reach for their weapons`,
  actions: [
    {
      text: 'Uh-oh',
      perform: triggerEvent(adventurersAttack).toTransformer(),
    },
  ],
});

export const adventurersAccuseDebateSuccess = createEvent.triggered({
  title: 'Reasoned debate',
  getText: _ => `You easily dissuade the adventures with reason and they leave you be`,
  actions: [
    {
      text: 'Good riddance',
      perform: notify('The adventurers leave you alone after you use logical arguments'),
    }
  ],
});

export const adventurersAccuseDebateFailure = createEvent.triggered({
  title: 'Debating failed',
  getText: _ => `Your reasoning was insufficient to sway the adventurers and they reach for their weapons`,
  actions: [
    {
      text: 'Uh-oh',
      perform: triggerEvent(adventurersAttack).toTransformer(),
    },
  ],
});

export const adventurersAccuse = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.worldFlags.adventurerKeep! || _.worldFlags.adventurers!,
  title: 'Ambushed by adventurers',
  getText: _ => `A group of adventurers ambushes you in your home, looking quite cross with you. They claim that
    you are an evildoer who is behind the disappearance of the children in the town. You have literally no idea
    what they are talking about, but they seem intent on fighting you`,
  actions: [
    {
      condition: _ => _.character.intelligence >= 4,
      text: 'Reason with them',
      perform: triggerEvent(adventurersAccuseDebateSuccess)
          .multiplyByFactor(1.5, _ => _.character.intelligence >= 6)
          .multiplyByFactor(2, _ => _.character.intelligence >= 8)
        .orTrigger(adventurersAccuseDebateFailure).withWeight(2)
        .toTransformer(),
    },
    {
      condition: _ => _.character.charm >= 4,
      text: 'Charm with them',
      perform: triggerEvent(adventurersAccuseCharmSuccess)
          .multiplyByFactor(1.5, _ => _.character.charm >= 6)
          .multiplyByFactor(2, _ => _.character.charm >= 8)
        .orTrigger(adventurersAccuseCharmFailure).withWeight(2)
        .toTransformer(),
    },
    {
      text: 'Fight them',
      perform: triggerEvent(adventurersAttack).toTransformer(),
    },
  ],
});

export const adventurersSeekAdvice = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!)
    && (_.character.intelligence >= 6 || _.character.education >= 6),
  title: 'Adventurers seek advice',
  getText: _ => `Due to your local reputation as an intellectual, adventurers come to you
    seeking advice on some matter or other`,
  actions: [
    {
      text: 'If you pay me',
      perform: compose(
        changeResource('coin', 100),
        notify('The adventurers pay you for you sage advice, and leave satisfied'),
      ),
    },
    {
      text: 'If you feed me',
      perform: compose(
        changeResource('food', 150),
        notify('The adventurers give you large stores of food you for you sage advice, and leave satisfied'),
      ),
    },
    {
      text: 'If you tell everybody',
      perform: compose(
        changeResource('renown', 75),
        notify('The adventurers agree to tell everybody that you gave them sage advice'),
      ),
    },
    {
      text: 'Of course',
      perform: notify('You have given the adventurers some advice for free'),
    },
    {
      text: 'Not a chance',
      perform: notify('Adventurers came to you for advice, but left without learning anything'),
    },
  ],
});

export const adventurersWantReward = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.worldFlags.adventurersQuestCompleted! && (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!),
  title: 'Adventurers want reward',
  getText: _ => `The adventurers who have recently aided you appear at your door, demanding a reward for their heroic deeds`,
  actions: [
    {
      text: 'Pay them',
      perform: compose(
        changeResource('coin', -100),
        setWorldFlag('adventurersQuestCompleted', false),
        notify('You paid the adventurers handsomely for their services'),
      ),
    },
    {
      condition: _ => _.character.intelligence >= 4,
      text: 'Reason with them',
      perform: triggerEvent(adventurersAccuseDebateSuccess)
          .multiplyByFactor(1.5, _ => _.character.intelligence >= 6)
          .multiplyByFactor(2, _ => _.character.intelligence >= 8)
        .orTrigger(adventurersAccuseDebateFailure).withWeight(2)
        .toTransformer(),
    },
    {
      condition: _ => _.character.charm >= 4,
      text: 'Charm with them',
      perform: triggerEvent(adventurersAccuseCharmSuccess)
          .multiplyByFactor(1.5, _ => _.character.charm >= 6)
          .multiplyByFactor(2, _ => _.character.charm >= 8)
        .orTrigger(adventurersAccuseCharmFailure).withWeight(2)
        .toTransformer(),
    },
    {
      text: 'Refuse them',
      perform: triggerEvent(adventurersAttack).toTransformer(),
    },
  ]
});

export const adventurersWantMoreQuests = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.worldFlags.adventurersQuestCompleted! && (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!),
  title: 'Adventurers seek quest',
  getText: _ => `Having spent some time focusing on their rest and other affairs, the local group of adventurers announce
    their intent to start finding work again`,
  actions: [
    {
      text: 'I see',
      perform: compose(
        setWorldFlag('adventurersQuestCompleted', false),
        notify('A local adventuring party is looking for work once more'),
      ),
    },
  ],
});

export const civilWarTakeSide = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.civilWar! && (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!),
  title: 'Adventurers take side',
  getText: _ => `The adventurers in town take a side in the civil war. Their skills quickly bring it to a close`,
  actions: [
    {
      text: 'Who won?',
      perform: triggerEvent(civilWarWon).withWeight(2)
        .orTrigger(civilWarLost)
        .toTransformer(),
    },
  ],
});

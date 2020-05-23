import {
  civilWarLost,
  civilWarWon,
} from 'gameEvents/town/general';
import { triggerEvent } from 'utils/eventChain';
import { eventCreator, action, time } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import {
  changeStat,
  createNonBabyChild,
} from 'utils/person';
import { changeResource } from 'utils/resources';
import { setWorldFlag } from 'utils/setFlag';
import { death } from './general';
import { setTmp, getTmp, removeTmp } from 'utils/tmpBuffer';
import { Size } from 'types/state';
import { increaseSize } from 'utils/town';

const ADVENTURERS_EVENT_PREFIX: number = 43_000;

const REWARD = '@tmp/REWARD';
const setReward = (amount: number) => setTmp(REWARD, amount);
const getReward = getTmp(REWARD, 100);
const clearReward = removeTmp(REWARD);

const createEvent = eventCreator(ADVENTURERS_EVENT_PREFIX);

export const adventurersFail = createEvent.triggered({
  title: 'Adventurer quest fails',
  getText: _ => `The adventurers try their best, but they fail to complete their assigned
    quest. They return alive, but ragged and defeated`,
  actions: [
    action('I thought they were better').do(clearReward).log('The band of adventurers fails their quest'),
  ],
});

export const adventurersDie = createEvent.triggered({
  title: 'Adventurers perish',
  getText: _ => `The adventurers go boldly on their assigned quest. The next day, you hear
    that they have found their corpses not far from where you hear their target was`,
  actions: [
    action('I thought they were better')
      .and(setWorldFlag('adventurerKeep', false))
      .and(setWorldFlag('adventurers', false))
      .and(setWorldFlag('adventurersQuestCompleted', false))
      .and(clearReward)
      .log('The adventuring party have died while on their quest'),
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
    tribe that has plagued the town`,
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

export const adventurersHandleDragon = createEvent.triggered({
  title: 'Dragon slain',
  getText: _ => `The adventurers have returned from their quest victorious, and after all this time ${_.town.name} is
    free of the vicious dragon who made all quake with fear`,
  actions: [
    action('Thank you, brave adventurers')
      .do(setWorldFlag('adventurersQuestCompleted'))
      .and(setWorldFlag('dragon', false))
      .log('The adventurers have slain the fierce dragon who was nearby'),
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
    && !_.worldFlags.adventurersQuestCompleted
    && _.resources.renown >= 100,
  title: 'Adventurers seek quest',
  getText: _ => `The adventuring party has learned that you have a name, and that has excited them very much for some
    reason. They come to you and ask if you have a quest for them`,
  actions: [
    action('"My child has been kidnapped"')
      .when(_ => _.characterFlags.kidnappedChild!)
      .do(
        triggerEvent(adventurersFail).withWeight(2)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersRescueChild).withWeight(3)
      ).and(setReward(250)),
    action("Kill the giant rats")
      .when(_ => _.worldFlags.vermin!)
      .do(
        triggerEvent(adventurersFail).withWeight(3)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleVermin).withWeight(6)
      ).and(setReward(100)),
    action('"Scatter the goblins"')
      .when(_ => _.worldFlags.goblins!)
      .do(
        triggerEvent(adventurersFail).withWeight(3)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleGoblins).withWeight(3)
      ).and(setReward(200)),
    action('"Slay the orcs"')
      .when(_ => _.worldFlags.orcs!)
      .do(
        triggerEvent(adventurersFail).withWeight(2)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleOrcs).withWeight(2)
      ).and(setReward(500)),
    action('"Defeat the bandit chief"')
      .when(_ => _.worldFlags.bandits!)
      .do(
        triggerEvent(adventurersFail).withWeight(2)
        .orTrigger(adventurersDie)
        .orTrigger(adventurersHandleBandits).withWeight(2)
      ).and(setReward(500)),
    action('"Kill the dragon"')
      .when(_ => _.worldFlags.dragon!)
      .do(
        triggerEvent(adventurersFail).withWeight(2)
        .orTrigger(adventurersDie).withWeight(8)
        .orTrigger(adventurersHandleDragon)
      ).and(setReward(1_000)),
    action('Invent quest in faraway land').when(_ => _.character.charm >= 6).and(triggerEvent(adventurersFarawayQuest)),
    action('I have nothing for you').log(
      `You had no quest for the adventurers. They leave confused. "But you have a name" one of them says sadly`,
    ),
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
      text: 'Charm them',
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
        changeResource('coin', 50),
        notify('The adventurers pay you for you sage advice, and leave satisfied'),
      ),
    },
    {
      text: 'If you feed me',
      perform: compose(
        changeResource('food', 75),
        notify('The adventurers give you large stores of food you for you sage advice, and leave satisfied'),
      ),
    },
    {
      text: 'If you tell everybody',
      perform: compose(
        changeResource('renown', 40),
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
  meanTimeToHappen: time(5, 'months'),
  condition: _ => _.worldFlags.adventurersQuestCompleted! && (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!),
  title: 'Adventurers want reward',
  getText: _ => `The adventurers who have recently aided you appear at your door, demanding a reward for their heroic deeds`,
  actions: [
    action('Pay them')
      .when(_ => _.resources.coin >= getReward(_))
      .do(_ => changeResource('coin', -1 * getReward(_))(_))
      .and(clearReward)
      .and(setWorldFlag('adventurersQuestCompleted', false))
      .log('You paid the adventurers handsomely for their services'),
    action('Reason with them')
      .when(_ => _.character.intelligence >= 4)
      .do(
        triggerEvent(adventurersAccuseDebateSuccess)
          .multiplyByFactor(1.5, _ => _.character.intelligence >= 6)
          .multiplyByFactor(2, _ => _.character.intelligence >= 8)
        .orTrigger(adventurersAccuseDebateFailure).withWeight(2)
      ),
    action('Charm them')
        .when(_ => _.character.charm >= 4)
        .do(
          triggerEvent(adventurersAccuseCharmSuccess)
            .multiplyByFactor(1.5, _ => _.character.charm >= 6)
            .multiplyByFactor(2, _ => _.character.charm >= 8)
          .orTrigger(adventurersAccuseCharmFailure).withWeight(2)
        ),
    action('Refuse them').and(triggerEvent(adventurersAttack)),
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

export const adventurersFlattered = createEvent.triggered({
  title: 'Adventurers thankful',
  getText: `The adventurers are very flattered by being thanked so publically for their work, and announce their intention to stay
    here to protect the village. They thank you personally`,
  actions: [
    action('Good!').and(setWorldFlag('adventurerKeep')).and(setWorldFlag('adventurersQuestCompleted', false)).resourceGainPercentage('renown', 5, 50, 100),
  ],
});

export const adventurersDisgusted = createEvent.triggered({
  title: 'Adventurers unhappy',
  getText: `The adventurers are unhappy with how this was handled and do not consider this to be enough to thank them for their work.
    After some arguing, they decide to leave the town, naming you in particular to blame`,
  actions: [
    action('Ungrateful!')
      .and(setWorldFlag('adventurerKeep', false))
      .and(setWorldFlag('adventurers', false))
      .and(setWorldFlag('adventurersQuestCompleted', false))
      .resourceLosePercentage('renown', 5, 50, 100)
      .log('The adventurers are unhappy with how you tried to thank them, and pick up to leave the town'),
  ],
});

export const peopleStayAfterTheFestival = createEvent.triggered({
  title: 'Festival expands population',
  getText: `The festival is a success, and many people from surrounding settlements come to join it. Some decide to stay and build their
    homes here, expanding the size of the town`,
  actions: [
    action('Good!').and(increaseSize).log('Many visitors to the festival decide to stay and help grow the town'),
  ],
});

export const commemorateAdventurers = createEvent.regular({
  meanTimeToHappen: time(18, 'months'),
  condition: _ => _.worldFlags.adventurersQuestCompleted! && (_.worldFlags.adventurerKeep! || _.worldFlags.adventurers!),
  title: 'Commemorating adventurers',
  getText: `Given that the adventurers have helped the town, people have started talking about doing something to thank the adventurers.
    If you helped finance this, it could help you gain recognition in society`,
  actions: [
    action('Build a statue')
      .spendResource('coin', 200)
      .changeResource('renown', 150)
      .and(triggerEvent(adventurersFlattered).maybe(0.6).orTrigger(adventurersDisgusted).maybe(0.2).delayAll(7))
      .log('You pay to have a statue of the adventuring party built'),
    action('Organise a festival')
      .spendResource('coin', 100)
      .changeResource('renown', 50)
      .and(
        triggerEvent(adventurersFlattered).maybe(0.4)
        .orTrigger(adventurersDisgusted).maybe(0.3)
        .orTrigger(peopleStayAfterTheFestival).maybe(0.1).onlyWhen(_ => _.town.size < Size.Large)
        .delayAll(7),
      )
      .log('You finance a festival to commemorate the adventurers'),
    action('Influence others to action')
      .spendResource('renown', 150)
      .and(triggerEvent(adventurersFlattered).maybe(0.6).orTrigger(adventurersDisgusted).maybe(0.2).delayAll(7))
      .log('You take the lead and push others to do something for the adventurers'),
    action('Do nothing'),
  ],
});

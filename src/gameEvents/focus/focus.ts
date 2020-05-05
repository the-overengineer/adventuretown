import { banishment } from 'gameEvents/life/general';
import {
  CharacterFlag,
  ClassEquality,
  Fortification,
  Gender,
  GenderEquality,
  Profession,
  ProfessionLevel,
  Prosperity,
  Size,
} from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import { eventCreator } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import {
  addSpouse,
  changeStat,
  removeLastChild,
  removeSpouse,
  startJob,
  setLevel,
} from 'utils/person';
import { inIntRange } from 'utils/random';
import { changeResource } from 'utils/resources';
import {
  pregnancyChance,
  setCharacterFlag,
  setWorldFlag,
} from 'utils/setFlag';
import {
  decreaseClassEquality,
  decreaseFortifications,
  decreaseProsperity,
  decreaseSize,
  equaliseGenderRights,
  hasLimitedRights,
  increaseClassEquality,
  increaseFortifications,
  increaseMyGenderRights,
  increaseSize,
  isOppressed,
  increaseProsperity,
} from 'utils/town';

export const FOCUS_PREFIX = 3_000;

const createEvent = eventCreator(FOCUS_PREFIX);

const focusFlags: CharacterFlag[] = [
  'focusPhysical',
  'focusIntelligence',
  'focusEducation',
  'focusCharm',
  'focusWealth',
  'focusFood',
  'focusRenown',
  'focusFamily',
  'focusFun',
  'focusCity',
]

export const lowerFocusFlags = compose(
  ...focusFlags.map(flag => setCharacterFlag(flag, false)),
);

export const setFocusFlag = (flag: CharacterFlag) => compose(
  lowerFocusFlags,
  setCharacterFlag(flag, true),
);

export const chooseFocus = createEvent.regular({
  meanTimeToHappen: 3,
  condition: _ => !_.characterFlags.focusCharm
    && !_.characterFlags.focusCity
    && !_.characterFlags.focusEducation
    && !_.characterFlags.focusFamily
    && !_.characterFlags.focusFood
    && !_.characterFlags.focusFun
    && !_.characterFlags.focusIntelligence
    && !_.characterFlags.focusPhysical
    && !_.characterFlags.focusRenown
    && !_.characterFlags.focusWealth,
  title: 'Choose a focus',
  getText: () => `
    It's time to decide what your direction in life will be. Where will most of
    your free time be spent?`,
  actions: [
    {
      text: 'Physical prowess',
      perform: compose(
        setFocusFlag('focusPhysical'),
        notify('You start working on becoming stronger and better equipped'),
      ),
    },
    {
      text: 'Challenging your mind',
      perform: compose(
        setFocusFlag('focusIntelligence'),
        notify('Much of your time is spent on puzzles and discussions'),
      ),
    },
    {
      text: 'Educating yourself',
      perform: compose(
        setFocusFlag('focusEducation'),
        notify('Much can be acquired from books and learned men'),
      ),
    },
    {
      text: 'Social skills',
      perform: compose(
        setFocusFlag('focusCharm'),
        notify('Much can be achieved if you can just learn to talk to people'),
      ),
    },
    {
      text: 'Acquiring wealth',
      perform: compose(
        setFocusFlag('focusWealth'),
        notify(`Money makes the world go 'round`),
      ),
    },
    {
      text: 'Stockpiling food',
      perform: compose(
        setFocusFlag('focusFood'),
        notify('Never go hungry again'),
      ),
    },
    {
      text: 'Fame and renown',
      perform: compose(
        setFocusFlag('focusRenown'),
        notify(`Hopefully your fame will grow soon`),
      ),
    },
    {
      text: 'Family and children',
      perform: compose(
        setFocusFlag('focusFamily'),
        notify('Children are the future, after all'),
      ),
    },
    {
      text: 'Having fun',
      perform: compose(
        setFocusFlag('focusFun'),
        notify('What is there to life if you do not enjoy yourself?'),
      ),
    },
    {
      condition: _ => !hasLimitedRights(_, _.character) || _.resources.renown >= 100 || _.resources.coin >= 100,
      text: 'Changing things around town',
      perform: compose(
        setFocusFlag('focusCity'),
        notify(`It's about time things changed around here.`),
      ),
    },
  ],
});

export const minorPhysicalImprovement = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.character.physical < 5 && _.characterFlags.focusPhysical!,
  title: 'Exercise pays off',
  getText: _ => `You have been exercising regularly and you notice that it is bearing fruit.
    You feel stronger and have more endurance.`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('physical', 1),
        notify('Exercise has made you fitter'),
      ),
    },
  ],
});

export const majorPhysicalImprovement = createEvent.regular({
  meanTimeToHappen: 10 * 30,
  condition: _ => _.characterFlags.focusPhysical!
    && _.character.physical >= 5
    && _.character.physical <= 8,
  title: 'Clean living',
  getText: _ => `You treat your body as a temple, and the results are starting to show.
    Few in town can even compare to your strength and endurance. Even some of the visiting
    adventurers look at you with admiration`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('physical', 1),
        changeResource('renown', 20),
        notify('Your strength grows'),
      ),
    }
  ],
});

export const closeToPhysicalPeak = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.focusPhysical!
    && _.character.physical >= 7,
  title: 'At your peak',
  getText: _ => `You are very close to your physical peak. You are not certain whether you can become
    much stronger and fitter without some supernatural means`,
  actions: [
    {
      text: 'Continue',
    },
    {
      text: 'Relax your routine',
      perform: compose(
        setCharacterFlag('focusPhysical', false),
        notify('You have stopped focusing on exercise so much'),
      ),
    },
  ],
});

export const minorIntelligenceImprovement = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.character.intelligence < 5 && _.characterFlags.focusIntelligence!,
  title: 'Introspection pays off',
  getText: _ => `You have been thinking more often and more deeply about things, and you think the
    mental exercise is helping`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('intelligence', 1),
        notify('You have become a better thinker'),
      ),
    },
  ],
});

export const majorIntelligenceImprovement = createEvent.regular({
  meanTimeToHappen: 10 * 30,
  condition: _ => _.characterFlags.focusIntelligence!
    && _.character.intelligence >= 5
    && _.character.intelligence <= 8,
  title: 'Deep thinker',
  getText: _ => `You are known for your depth of thought and wisdom throughout town.
    You debate matters with elders, priests, and even visiting adventurers on a regular basis,
    and often come up on top`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('intelligence', 1),
        changeResource('renown', 20),
        notify('Your wisdom and intelligence grow further'),
      ),
    }
  ],
});

export const closeToIntelligencePeak = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.focusIntelligence!
    && _.character.intelligence >= 7,
  title: 'At your peak',
  getText: _ => `You have thought often and well, and spoken to many wise people.
    You don't think you can improve your mind much more without magical means`,
  actions: [
    {
      text: 'Continue',
    },
    {
      text: 'Relax your routine',
      perform: compose(
        setCharacterFlag('focusIntelligence', false),
        notify('You have stopped exercising your mind so much'),
      ),
    },
  ],
});

export const minorEducationImprovement = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.character.education < 5 && _.characterFlags.focusEducation!,
  title: 'Knowledge expands',
  getText: _ => `You have been improving your knowledge. You are finding it easier and easier to read letters,
    and you are picking up many small bits of knowledge by talking to others`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('education', 1),
        notify('You have become more knowledgeable'),
      ),
    },
  ],
});

export const majorEducationImprovement = createEvent.regular({
  meanTimeToHappen: 10 * 30,
  condition: _ => _.characterFlags.focusEducation!
    && _.character.education >= 5
    && _.character.education <= 8,
  title: 'Sage',
  getText: _ => `Your knowledge of both worldly and bookish matters is known throughout the region.
    You have even started working on your own private library. Once or twice, even a visiting adventurer
    wizard or sage has been impressed with you.`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('education', 1),
        changeResource('renown', 20),
        notify('Your knowledge grows further'),
      ),
    }
  ],
});

export const closeToEducationPeak = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.focusEducation!
    && _.character.education >= 7,
  title: 'At your peak',
  getText: _ => `Very rarely do you learn something new these days, and it is getting harder and harder
    to find books on topics you are not already an expert on. You are uncertain whether`,
  actions: [
    {
      text: 'Continue',
    },
    {
      text: 'Relax your routine',
      perform: compose(
        setCharacterFlag('focusEducation', false),
        notify('You have stopped focusing so much on gathering knowledge'),
      ),
    },
  ],
});

export const minorCharmImprovement = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.character.charm < 5 && _.characterFlags.focusCharm!,
  title: 'Smalltalk',
  getText: _ => `You have been actively working on your appearance and chatting with others.
    As time passes, it's getting easier and easier to be liked.`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('charm', 1),
        notify('You have become more attractive and charming'),
      ),
    },
  ],
});

export const majorCharmImprovement = createEvent.regular({
  meanTimeToHappen: 10 * 30,
  condition: _ => _.characterFlags.focusCharm!
    && _.character.charm >= 5
    && _.character.charm <= 8,
  title: 'Popular',
  getText: _ => `You are renowned for your good looks and charming personality. These are few who cannot
    be easily swayed by your words, even when there is little sense behind them, and you can frequently
    see other townspeople checking you out with interest`,
  actions: [
    {
      text: 'Hard work paid off',
      perform: compose(
        changeStat('charm', 1),
        changeResource('renown', 20),
        notify('Your charm and good looks improve further'),
      ),
    }
  ],
});

export const closeToCharmPeak = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.focusCharm!
    && _.character.charm >= 7,
  title: 'At your peak',
  getText: _ => `You turn heads with your appearance and change opinions with your smile and swaying words.
    You are the topic of conversation in almost every tavern. You don't think there is much more
    you can do to improve yourself in that regard`,
  actions: [
    {
      text: 'Continue',
    },
    {
      text: 'Relax your routine',
      perform: compose(
        setCharacterFlag('focusCharm', false),
        notify('You have stopped focusing so much on your appearance and personality'),
      ),
    },
  ],
});

export const pennySaved = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.characterFlags.focusWealth!,
  title: 'Copper saved, copped earned',
  getText: _ => `You have been carefully saving every copper. It took some time,
    but when you look in your copper tin, you see that you have saved a considerable
    amount at the end of the day`,
  actions: [
    {
      text: `More money is always good`,
      perform: compose(
        changeResource('coin', 15),
        notify('You managed to save a nice amount of money'),
      ),
    },
  ],
});

export const fundedCaravanFailure = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.characterFlags.fundedCaravan!,
  title: 'Caravan investment failed',
  getText: _ => `The trading caravan you have funded has returned. However, you learn that you have
    made a bad investment - the caravan failed to make a profit. Your reputation takes a slight hit
    after this bad investment`,
  actions: [
    {
      text: 'Curses!',
      perform: compose(
        changeResource('renown', -10),
        setCharacterFlag('fundedCaravan', false),
        notify('The caravan you have funded has returned, but has made a loss'),
      ),
    },
  ],
});

export const fundedCaravanSuccess = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.characterFlags.fundedCaravan!,
  title: 'Caravan investment succeeded',
  getText: _ => `The trading caravan you have funded has returned. They come back to the town to a warm
    welcome, having made a great profit. Not only do you gain much more than you have invested, but
    your reputation grows because of this wide investment`,
  actions: [
    {
      text: 'A calculated risk',
      perform: compose(
        changeResource('renown', 10),
        changeResource('coin', 120),
        setCharacterFlag('fundedCaravan', false),
        notify('The caravan you have funded has returned, and brought profits'),
      ),
    },
  ],
});

export const fundCaravan = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => !_.characterFlags.fundedCaravan
    && _.resources.coin >= 50
    && _.characterFlags.focusWealth!,
  title: 'Caravan seeking investment',
  getText: _ => `
    You hear that a trader is seeking funding for his caravan. He means to start a trading expedition to
    a far-away land, and hopes to return with great wealth. Though it is a gamble, this could bring great
    profits
  `,
  actions: [
    {
      text: 'Not worth the risk',
    },
    {
      text: 'Invest into the caravan',
      perform: compose(
        changeResource('coin', -50),
        setCharacterFlag('fundedCaravan', true),
        notify('The caravan sets off, and you hope your investment will pay off'),
      ),
    },
  ],
});

export const sellChildAsSlave = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.town.equality === ClassEquality.GeneralSlavery
    && _.characterFlags.focusWealth!
    && _.relationships.children.length > 1,
  title: 'Unusual offer',
  getText: _ => `A visitor appears at your door one day. He claims that he has heard that you are looking to
    increase your funds, and has a way to help you with it. He looks at your children running around the house
    and says "It must be a mess, with all those children screaming and demanding your attention. I could offer
    you a pretty penny if you would be willing to sell one of those to me as a slave."`,
  actions: [
    {
      text: 'Never!',
      perform: notify('You refused to sell your child into slavery'),
    },
    {
      text: `It would be a lot quieter`,
      perform: compose(
        removeLastChild,
        changeResource('coin', 50),
        notify('You have sold your child into slavery for a few coins'),
      ),
    },
    {
      condition: _ => _.character.charm >= 5,
      text: 'It will cost you extra',
      perform: compose(
        removeLastChild,
        changeResource('coin', 100),
        notify('You have sold your child into slavery for a tidy profit'),
      ),
    },
  ],
});

export const startBlackMarket = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => !_.characterFlags.criminalActivity
    && _.worldFlags.blackMarket!
    && _.characterFlags.focusWealth!,
  title: 'Black market opportunity',
  getText: _ => `As your attempts to accumulate wealth have become known, you have been reached out to with an
    offer to participate in an underground black market. They do not tell you enough to reveal anything substantial
    to the guards, but if you wish to risk criminal activity, it could make quite a profit for you`,
  actions: [
    {
      text: 'Pass this up',
    },
    {
      text: 'Involve yourself',
      perform: compose(
        setCharacterFlag('criminalActivity', true),
        notify('You have involved yourself with the black market'),
      ),
    },
  ],
});

export const almostCaughtBlackMarket = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.criminalActivity! && _.worldFlags.townGuard!,
  title: 'Almost caught!',
  getText: _ => `The guards came around your house asking questions. It seems that they might be onto your criminal activities,
    but apparently they can't prove anything. Is this risk worth it?`,
  actions: [
    {
      text: 'Continue with black market',
      perform: notify('You continue to be entangled with the black market, no matter the risks'),
    },
    {
      text: 'Stop criminal involvement',
      perform: compose(
        setCharacterFlag('criminalActivity', false),
        notify('You stop dealing with the black market, just in case'),
      ),
    },
  ],
});

export const wonCourtCase = createEvent.triggered({
  title: 'Court case won',
  getText: _ => `After a vicious discussion in court, you managed to prove your innocence in the eyes of the law.
    You are awarded compensation, but even being involved in a court case damaged your reputation`,
  actions: [
    {
      text: 'Could have been worse',
      perform: compose(
        changeResource('coin', 10),
        changeResource('renown', -20),
      ),
    },
  ],
});

export const lostCourtCase = createEvent.triggered({
  title: 'Court case lost',
  getText: _ => `You tried your best, but the evidence against you was overwhelming. You need to pay a hefty fine,
    or you will be banished from the city.`,
  actions: [
    {
      condition: _ => _.resources.coin >= 200,
      text: 'Pay the fine',
      perform: compose(
        (state) => changeResource('coin', -1 * Math.floor(state.resources.coin / 3) * 2)(state),
        changeResource('renown', -50),
        notify('You have been found guilty but paid the fine. Your reputation suffered as well'),
      ),
    },
    {
      text: 'Accept banishment',
      perform: triggerEvent(banishment).toTransformer(),
    },
  ],
});

export const blameSpouseForCrime = createEvent.triggered({
  title: 'Spouse banished',
  getText: _ => `You claim that you could not be possibly be blamed, due to your feeble gender. If anything, your spouse
    is the one who should take the blame. The court can find no fault in this argument.`,
  actions: [
    {
      text: 'Look at how oppressed I am!',
      perform: compose(
        removeSpouse,
        notify('You have blamed your spouse for your crimes and they have been banished'),
      ),
    },
  ],
});

export const caughtBlackMarket = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.characterFlags.criminalActivity! && _.worldFlags.townGuard!,
  title: 'Imprisoned!',
  getText: _ => `Your dealings with the black market have been discovered. You are woken up by guards in the middle of the night,
    dragged into the dungeons, and left there. In the morning, you are informed of the case against you. It is almost ironclad.
    You can try to defend yourself, but it seems unlikely to succeed. Alternatively, you could pay a hefty fine. If you manage
    neither, you will be banished and your possessions taken.`,
  actions: [
    {
      condition: _ => _.character.charm >= 3,
      text: 'Defend myself in court',
      perform: triggerEvent(lostCourtCase).withWeight(3)
        .orTrigger(wonCourtCase).withWeight(1).multiplyByFactor(3, _ => _.character.charm >= 3)
        .toTransformer()
    },
    {
      condition: _ => _.resources.coin >= 200,
      text: 'Pay the fine',
      perform: compose(
        (state) => changeResource('coin', -1 * Math.floor(state.resources.coin / 3) * 2)(state),
        changeResource('renown', -50),
        notify('You have been found guilty but paid the fine. Your reputation suffered as well'),
      ),
    },
    {
      text: 'Accept banishment',
      perform: triggerEvent(banishment).toTransformer(),
    },
  ],
});

export const plantingAGarden = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => !_.characterFlags.gardener
    && _.characterFlags.focusFood!,
  title: 'Planting a garden',
  getText: _ => `Thinking about how to provide for your family, you find yourself looking at a plot of land
    behind your house. It would take a little bit of money, but you could start a garden there, which would
    provide additional food`,
  actions: [
    {
      condition: _ => _.resources.coin >= 10,
      text: 'Invest in a garden',
      perform: compose(
        setCharacterFlag('gardener', true),
        changeResource('coin', -10),
        notify('You pay for some seeds and tools, and start a garden in your yard'),
      ),
    },
    {
      text: `Rather not`,
    },
  ],
});

export const gardenEaten = createEvent.regular({
  meanTimeToHappen: 24 * 30,
  condition: _ => _.characterFlags.gardener!
    && _.character.intelligence < 6
    && _.character.education < 6,
  title: 'Pests destroy garden',
  getText: _ => `For some time now, pests have been attacking your garden and eating your plants.
    You have tried everything but you must now admit defeat`,
  actions: [
    {
      text: 'Damnation!',
      perform: compose(
        setCharacterFlag('gardener', false),
        notify('Your garden is no more'),
      ),
    },
  ],
});

export const gardenDestroyedByWeather = createEvent.regular({
  meanTimeToHappen: 32 * 30,
  condition: _ => _.characterFlags.gardener!,
  title: 'Harsh winter',
  getText: _ => `An early and harsh winter has destroyed your garden. There is nothing to be done against
    the merciless elements.`,
  actions: [
    {
      text: 'Damnation!',
      perform: compose(
        setCharacterFlag('gardener', false),
        notify('Your garden is no more'),
      ),
    },
  ],
});

export const foodSale = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.focusFood!,
  title: 'Food sale',
  getText: _ => `You were keeping an eye out on ways to get more food, and you hear about a local form selling their
    produce at much lower prices than usually. You are suspicious at first, but you discover that the food is good.`,
  actions: [
    {
      condition: _ => _.resources.coin >= 10,
      text: 'Buy some',
      perform: compose(
        changeResource('coin', -10),
        changeResource('food', 30),
        notify('You bought food stores at a reasonable price'),
      ),
    },
    {
      condition: _ => _.resources.coin >= 30,
      text: 'Buy plenty',
      perform: compose(
        changeResource('coin', -30),
        changeResource('food', 100),
        notify('You bought large amounts of food at a reasonable price'),
      ),
    },
    {
      text: 'Not this time',
    },
  ],
});

export const hiringBardSuccess = createEvent.triggered({
  title: 'Bardic tales',
  getText: _ => `Word comes back to you of bard spreading tales of your majesty. People are starting to look
    at you with more respect now`,
  actions: [
    {
      text: 'I deserve it',
      perform: compose(
        changeResource('renown', 60),
        notify('Bards spread tales about you and increase your fame'),
      ),
    },
  ],
});

export const hiringBardFailure = createEvent.triggered({
  title: 'Good for nothing bard',
  getText: _ => `It seems the bard you hired simply drank your money away and vanished the next day.
    That might not have been the wisest investment`,
  actions: [
    {
      text: 'I should have known!',
      perform: notify('You wasted your money on a bard, but nothing came out of it'),
    },
  ],
});

export const hiringABard = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.focusRenown!,
  title: 'Bard offers service',
  getText: _ => `A travelling bard offers their services to you, promising to spread word
    about your name across town and the region if you would just give them some money.`,
  actions: [
    {
      condition: _ => _.resources.coin >= 20,
      text: 'Pay a little',
      perform: triggerEvent(hiringBardFailure).withWeight(3)
        .orTrigger(hiringBardSuccess)
        .toTransformer(),
    },
    {
      condition: _ => _.resources.coin >= 50,
      text: 'Pay more',
      perform: triggerEvent(hiringBardFailure)
        .orTrigger(hiringBardSuccess).withWeight(3)
        .toTransformer(),
    },
    {
      text: `Can't trust a bard`,
    },
  ],
});

export const becomesPoet = createEvent.triggered({
  title: 'A star is born',
  getText: _ => `Your attempt at poetry is well-received! You continue writing poetry and people are
    starting to notice, increasing your fame and renown`,
  actions: [
    {
      text: 'I will be famous!',
      perform: compose(
        setCharacterFlag('poet', true),
        notify('You have decided to become a famous poet'),
      ),
    },
  ],
});

export const terriblePoetry = createEvent.triggered({
  title: 'Failed poet',
  getText: _ => `You are very proud of your attempts at poetry, but nobody else seems to agree. Even the
    friend who originally made the suggestion seems to regret their idea.`,
  actions: [
    {
      text: `They don't understand art`,
      perform: notify('It seems that poetry is not your thing after all'),
    },
  ],
});

export const attemptedPoetry = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.focusRenown!
    && !_.characterFlags.poet,
  title: 'Attempted poetry',
  getText: _ => `One day at a tavern, a friend of yours brings up a way that you can become more well-known in the region.
    "Why not try your hand at poetry?" they suggest merrily, though some of that can surely be ascribed to the drinks the
    two of you had imbibed.`,
  actions: [
    {
      text: `Doesn't sound like me`,
    },
    {
      text: `Start writing`,
      perform: triggerEvent(terriblePoetry)
        .orTrigger(becomesPoet)
          .multiplyByFactor(2, _ => _.character.intelligence >= 5)
          .multiplyByFactor(2, _ => _.character.education >= 5)
        .toTransformer()
    },
  ],
});

export const writersBlock = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.characterFlags.poet!,
  title: `Writer's block`,
  getText: _ => `After some time, your attempts at poetry are getting more and more feeble. You cannot find the muse
    anymore, and no amount of trying or even praying seems to help.`,
  actions: [
    {
      text: 'It was nice while it lasted',
      perform: compose(
        setCharacterFlag('poet', false),
        notify('You have stopped working on poetry'),
      ),
    },
  ],
});

export const proposalAccepted = createEvent.triggered({
  title: 'Proposal accepted!',
  getText: _ => `"Yes, yes, a thousand times yes!" they say, seemingly excited that you would ask.
    Within days, a wedding is planned, and officiated by the local priest.`,
  actions: [
    {
      text: 'I am so glad!',
      perform: compose(
        addSpouse,
        notify('Your proposal was accepted and you got married'),
      ),
    },
  ],
});

export const proposalRejected = createEvent.triggered({
  title: 'Proposal rejected',
  getText: _ => `"Marry you? Are you insane? Don't you see what a catch I am?" they answer, seemingly
    shocked that you would even ask`,
  actions: [
    {
      text: 'My self-esteem hurts',
      perform: notify('Your marriage proposal was rudely rejected'),
    },
  ],
})

export const potentialSpouse = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.focusFamily!
    && _.relationships.spouse == null
    && !isOppressed(_, _.character),
  title: 'Marriage prospect',
  getText: _ => {
    const otherNoun = _.character.gender === Gender.Male ? 'woman' : 'man';
    const otherPosessive = _.character.gender === Gender.Male ? 'her' : 'his';

    return `After some time spent looking for love, you have found a potential spouse
      for yourself. This ${otherNoun} is not only attractive and intelligent, but even
      seems to have all of ${otherPosessive} teeth. Will you propose?`;
  },
  actions: [
    {
      text: 'Not now',
    },
    {
      text: 'Propose',
      perform: triggerEvent(proposalRejected)
        .orTrigger(proposalAccepted)
          .withWeight(1)
          .multiplyByFactor(2, _ => _.character.charm >= 5 )
          .multiplyByFactor(2, _ => _.resources.coin >= 100)
          .multiplyByFactor(2, _ => _.resources.renown >= 100)
        .toTransformer(),
    }
  ]
});

export const proposedTo = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.focusFamily!
    && _.relationships.spouse == null
    && isOppressed(_, _.character),
  title: 'Proposal received',
  getText: _ => `For some months now, you have been getting close to a ${_.character.gender === Gender.Male ? 'beautiful lady' : 'handsome gentleman'},
    but due to your gender it was impossible for you to make the first move. After all this time, they fall to one knee and ask for you to marry them.`,
  actions: [
    {
      text: '"Yes, my love!"',
      perform: compose(
        addSpouse,
        notify('You have been married, after some time looking for love'),
      ),
    },
    {
      text: 'This is not what I want',
    },
  ],
});

export const pushForChildren = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.focusFamily!
    && _.relationships.spouse != null
    && _.relationships.children.length < 4,
  title: 'Desire for children',
  getText: _ => `You have been thinking about some time now how ${_.relationships.children.length > 0 ? 'a' : 'another'} child could not
    hurt, and might make your home seem more lively. Maybe this is something you should talk to your spouse about?`,
  actions: [
    {
      condition: _ => isOppressed(_, _.relationships.spouse!),
      text: 'Talk? They have no choice',
      perform: compose(
        pregnancyChance,
        notify(`You force your spouse to attend to you in bed every night in hopes of a pregnancy`),
      ),
    },
    {
      text: 'I should do that',
      perform: compose(
        pregnancyChance,
        notify('You and your spouse spend more time in bed, in hopes of a pregnancy'),
      ),
    },
    {
      text: 'Rather not',
    },
  ],
});

export const gamblingNight = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.focusFun!
    && _.resources.coin >= 20,
  title: 'Gambling night',
  getText: _ => `You see some gambling happening in the local tavern one night. It's risky, but if Lady Luck kisses you,
    it might help you earn some coin, and be some fun besides!`,
  actions: [
    {
      text: '"Deal me in!"',
      perform: compose(
        _ => changeResource('coin', inIntRange(-20, 20) + _.character.intelligence)(_),
        notify('You spend a fun night gambling'),
      ),
    },
    {
      text: '"Not tonight',
    }
  ],
});

export const randomRelationsWithAGoat = createEvent.triggered({
  title: 'Inter-species fun',
  getText: _ => `After some investigation, you find out the truth, and it does not seem pleasant. Apparently, you have
    had relations with a goat, in the middle of the town square. This will not serve your reputation well.`,
  actions: [
    {
      text: `And I don't even remember it!`,
      perform: compose(
        changeResource('renown', -50),
        notify(`You've hard relations with a goat in the middle of the city while drunk. This won't help your reputation`),
      ),
    },
  ],
});

export const randomSoldSpouse = createEvent.triggered({
  title: 'Sold spouse',
  getText: _ => `After some investigation, you found out the truth, and it does not seem pleasant. Apparently, you have
    sold your spouse into slavery. On the bright side, you've made some coin`,
  actions: [
    {
      text: 'At least the nagging will stop',
      perform: compose(
        changeResource('coin', 50),
        removeSpouse,
        notify(`Apparently, you've sold your spouse as a slave during a drunken stupor`)
      ),
    },
  ],
});

export const randomBoughtFood = createEvent.triggered({
  title: 'Food supplies',
  getText: _ => `After some investigation, you found out the truth, and it's hard to explain. Apparently, you've purchased
    large amounts of food and spread them out all over your house`,
  actions: [
    {
      text: `At least I won't starve`,
      perform: compose(
        changeResource('coin', -10),
        changeResource('food', 20),
        notify('In a drunken stupor, you seem to have bought quite a bit of food'),
      ),
    },
  ],
});

export const randomBurnDownGuildHall = createEvent.triggered({
  title: 'Guild hall burned down',
  getText: _ => `After some investigation, it would appear that, while drunk, you burned down the guild hall, including their vaunted
    treasury. It might take some time for the city economy to recover`,
  actions: [
    {
      text: `They can't prove it was me`,
      perform: compose(
        (state) => ({
          ...state,
          town: {
            ...state.town,
            prosperity: state.town.prosperity - 1,
          },
        }),
        notify('In a drunken adventure, you burned down the guild hall. It will take the economy years to recover'),
      ),
    },
  ],
});

export const randomCouncilCandidate = createEvent.triggered({
  title: 'Almost in the council',
  getText: _ => `After some investigation, it would appear that, while drunk, you tried to join the nobles' council ruling the city,
    and came very close to becoming a member. While nothing was achieved, your reputation grew`,
  actions: [
    {
      text: 'That went well!',
      perform: compose(
        changeResource('renown', 50),
        notify('In a drunken adventure, you tries to join the council of nobles, and almost made it, making you famous'),
      ),
    },
  ],
});

export const randomCouncilMember = createEvent.triggered({
  title: 'Joined the council of nobles',
  getText: _ => `After some investigation, it would appear that, while drunk, you managed to talk your way into the council of nobles.
    Somehow, you are now one of the people who rule this city.`,
  actions: [
    {
      text: 'They said drinking was bad for me',
      perform: compose(
        (state) => ({
          ...state,
          character: {
            ...state.character,
            profession: Profession.Politician,
            professionLevel: ProfessionLevel.Leadership,
          },
        }),
        notify('Somehow, you managed to become a leading figure in the city during a drunken adventure'),
      ),
    },
  ],
});

export const randomFired = createEvent.triggered({
  title: 'Lost your job',
  getText: _ => `After some investigation, it would appear that, while drunk, you urinated on the floor during the work shift,
    and then had a severe argument with your employer. You no longer have a job`,
  actions: [
    {
      text: `That does sound like me`,
      perform: compose(
        (state) => ({
          ...state,
          character: {
            ...state.character,
            profession: undefined,
            professionLevel: undefined,
          },
        }),
        notify('You lost your job by being a drunken mess'),
      ),
    },
  ],
});

export const randomGotMoney = createEvent.triggered({
  title: 'Won money',
  getText: _ => `After some investigation, it would appear that, while drunk, you gambled and won quite a bit of money`,
  actions: [
    {
      text: 'I should do this again!',
      perform: compose(
        changeResource('coin', inIntRange(20, 100)),
        notify('You managed to earn money gambling while roaring drunk'),
      ),
    },
  ],
});

export const randomNothing = createEvent.triggered({
  title: '...Nothing?',
  getText: _ => `Though you've investigated, you can't find evidence that you did anything at all during your drunken stupor.`,
  actions: [
    {
      text: 'Could be worse',
    },
  ],
});

export const randomDrinking = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.focusFun!,
  title: 'Drunken adventure',
  getText: _ => `You wake up in your home, and everything hurts. Your entire house looks a mess.
    ${_.relationships.spouse ? `You've never seen your spouse looking this upset.` : ''} It turns out
    that you got drunk and have no recollection of the last two days. What could you have done?`,
  actions: [
    {
      text: `I don't want to know`,
      perform: notify(`You've gotten exceedingly drunk, but decide not to investigate what might have happened`),
    },
    {
      text: 'Investigate',
      perform: triggerEvent(randomBoughtFood)
        .orTrigger(randomBurnDownGuildHall).onlyWhen(_ => _.town.prosperity >= Prosperity.Decent)
        .orTrigger(randomCouncilCandidate).onlyWhen(_ => !isOppressed(_, _.character))
        .orTrigger(randomCouncilMember).onlyWhen(_ => !isOppressed(_, _.character))
        .orTrigger(randomFired).onlyWhen(_ => _.character.profession != null)
        .orTrigger(randomGotMoney)
        .orTrigger(randomNothing)
        .orTrigger(randomRelationsWithAGoat)
        .orTrigger(randomSoldSpouse).onlyWhen(_ => !isOppressed(_, _.character) && _.town.equality === ClassEquality.GeneralSlavery && _.relationships.spouse != null)
        .toTransformer()
    },
  ],
});

export const changeTownProsperity = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.focusCity!,
  title: 'Influence town economy',
  getText: _ => `You see a chance to modify the economy, the beating heart of this city, by making some wise
    investments. You can use your coin or call on your fame`,
  actions: [
    {
      condition: _ => _.resources.coin >= 150 && _.town.prosperity > Prosperity.DirtPoor,
      text: 'Pay to reduce the economy',
      perform: compose(
        changeResource('coin', -150),
        decreaseProsperity,
        notify('You paid off the lawmakers to weaken the economy. This wil make you less wealthy, but also less interesting prey')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.prosperity > Prosperity.DirtPoor,
      text: 'Campaign to reduce the economy',
      perform: compose(
        changeResource('renown', -100),
        decreaseProsperity,
        notify('You campaigned the lawmakers to weaken the economy. This wil make you less wealthy, but also less interesting prey')
      ),
    },
    {
      condition: _ => _.resources.coin >= 150 && _.town.prosperity < Prosperity.Rich,
      text: 'Pay to strengthen the economy',
      perform: compose(
        changeResource('coin', -150),
        increaseProsperity,
        notify('You paid off the lawmakers to strengthen the economy. This wil make you more wealthy, but also more interesting prey')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.prosperity < Prosperity.Rich,
      text: 'Campaign to strengthen the economy',
      perform: compose(
        changeResource('renown', -100),
        increaseProsperity,
        notify('You campaigned the lawmakers to strengthen the economy. This wil make you more wealthy, but also more interesting prey')
      ),
    },
    {
      text: 'Never mind',
    },
  ],
});

export const changeTownSize = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.focusCity! && _.town.size > Size.Minuscule,
  title: 'Influence town size',
  getText: _ => `You see a chance to influence the rate at which the area is settled. Larger cities are more powerful,
    but also bait for raiders and for disease. You can use money or your influence to affect the change`,
  actions: [
    {
      condition: _ => _.resources.coin >= 150 && _.town.size > Size.Minuscule,
      text: 'Pay to reduce the population',
      perform: compose(
        changeResource('coin', -150),
        decreaseSize,
        notify('You paid off the nobles to reduce the town size')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.size > Size.Minuscule,
      text: 'Campaign to reduce the population',
      perform: compose(
        changeResource('renown', -100),
        decreaseSize,
        notify('You campaigned the nobles to reduce the town size')
      ),
    },
    {
      condition: _ => _.resources.coin >= 150 && _.town.size < Size.Huge,
      text: 'Pay to increase the population',
      perform: compose(
        changeResource('coin', -150),
        increaseSize,
        notify('You paid off the nobles to increase the population')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.size < Size.Huge,
      text: 'Campaign to increase the population',
      perform: compose(
        changeResource('renown', -100),
        increaseSize,
        notify('You campaigned the nobles to increase the population')
      ),
    },
    {
      text: 'Never mind',
    },
  ],
});

export const changeClassEquality = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.focusCity!,
  title: 'Change class dynamic',
  getText: _ => `You look at the class dynamics and you are not satisfied. Be it that the poor have too much or too little power,
    something needs to change. You can use your wealth or your influence to change this`,
  actions: [
    {
      condition: _ => _.resources.coin >= 150 && _.town.equality > ClassEquality.GeneralSlavery,
      text: 'Pay to give the rich power',
      perform: compose(
        changeResource('coin', -150),
        decreaseClassEquality,
        notify('You paid off the nobles to reduce the rights of the poor')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.equality > ClassEquality.GeneralSlavery,
      text: 'Campaign to give the rich power',
      perform: compose(
        changeResource('renown', -100),
        decreaseClassEquality,
        notify('You campaigned the nobles to reduce the rights of the poor')
      ),
    },
    {
      condition: _ => _.resources.coin >= 150 && _.town.equality < ClassEquality.Equal,
      text: 'Pay to give the poor power',
      perform: compose(
        changeResource('coin', -150),
        increaseClassEquality,
        notify('You paid off the nobles to increase the rights of the poor')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.equality < ClassEquality.Equal,
      text: 'Campaign to give the poor power',
      perform: compose(
        changeResource('renown', -100),
        increaseClassEquality,
        notify('You campaigned the nobles to increase the rights of the poor')
      ),
    },
    {
      text: 'Never mind',
    },
  ],
});

export const changeGenderEquality = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.focusCity!,
  title: 'Change gender dynamic',
  getText: _ => `You look at the gender dynamics and you are not satisfied. Be it that ${_.character.gender === Gender.Male ? 'women' : 'men'} have
    too much power, or too little, something needs to change.`,
  actions: [
    {
      condition: _ => _.resources.coin >= 150 && _.town.genderEquality !== GenderEquality.Equal,
      text: 'Pay to equalise rights',
      perform: compose(
        changeResource('coin', -150),
        equaliseGenderRights,
        notify('You paid off the nobles to make the genders more equal')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.genderEquality !== GenderEquality.Equal,
      text: 'Campaign to equalise rights',
      perform: compose(
        changeResource('renown', -100),
        equaliseGenderRights,
        notify('You campaigned the nobles to make the genders more equal')
      ),
    },
    {
      condition: _ => _.resources.coin >= 150,
      text: 'Pay to give your gender power',
      perform: compose(
        changeResource('coin', -150),
        increaseMyGenderRights,
        notify('You paid off the nobles to give your gender more power')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100,
      text: 'Campaign to give your gender power',
      perform: compose(
        changeResource('renown', -100),
        increaseMyGenderRights,
        notify('You campaigned the nobles to give your gender more power')
      ),
    },
    {
      text: 'Never mind',
    },
  ],
});

export const changeFortifications = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.focusCity!,
  title: 'Change fortifications',
  getText: _ => `The way the town is protected is not quite what you envisioned. Things need to change here. You could use your
    wealth or your influence to make it so.`,
  actions: [
    {
      condition: _ => _.resources.coin >= 150 && _.town.fortification > Fortification.None,
      text: 'Pay to tear down walls',
      perform: compose(
        changeResource('coin', -150),
        decreaseFortifications,
        notify('You paid off the nobles to tear down the town fortifications')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.fortification > Fortification.None,
      text: 'Campaign to tear down walls',
      perform: compose(
        changeResource('renown', -100),
        decreaseFortifications,
        notify('You campaigned the nobles to tear down the town fortifications')
      ),
    },
    {
      condition: _ => _.resources.coin >= 150 && _.town.fortification < Fortification.MoatAndCastle,
      text: 'Pay to improve fortifications',
      perform: compose(
        changeResource('coin', -150),
        increaseFortifications,
        notify('You paid off the nobles to build up the town fortifications')
      ),
    },
    {
      condition: _ => _.resources.renown >= 100 && _.town.fortification < Fortification.MoatAndCastle,
      text: 'Campaign to improve fortifications',
      perform: compose(
        changeResource('renown', -100),
        increaseFortifications,
        notify('You campaigned the nobles to build up the town fortifications')
      ),
    },
    {
      text: 'Never mind',
    },
  ],
});

export const establishTownGuard = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.focusCity! && !_.worldFlags.townGuard,
  title: 'Establishing town guard',
  getText: _ => `The city has been defenceless against any attackers that might show up.
    If you were willing to invest some money, you could start a town guard, with you
    as its captain`,
  actions: [
    {
      condition: _ => _.resources.coin >= 200,
      text: 'It is worth the cost',
      perform: compose(
        setWorldFlag('townGuard', true),
        startJob(Profession.Guard),
        setLevel(ProfessionLevel.Leadership),
        notify('You have established a town guard, with you as its leader and captain'),
      ),
    },
    {
      text: `Seems too expensive`,
    },
  ],
});


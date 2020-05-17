import { banishment } from 'gameEvents/life/general';
import {
  CharacterFlag,
  ClassEquality,
  Gender,
  Profession,
  ProfessionLevel,
  Prosperity,
} from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import { eventCreator, action } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import {
  addSpouse,
  changeStat,
  removeLastChild,
  removeSpouse,
  setLevel,
  startJob,
  improveSpouseRelationship,
} from 'utils/person';
import {
  cityFocusOptions,
  hasCityFocus,
  completedCityFocus,
  resetCityFocus,
  getCityFocus,
  createRandomVotingDisposition,
  setBackedCouncillor,
  removeBackedCouncillor,
  describeCandidate,
  generateBackableCandidate,
  startVoteByBackedCouncillor,
  getBackedCandidateScore,
  changeCampaignScore,
  currentFocusDescription,
} from 'utils/politics';
import { inIntRange } from 'utils/random';
import { changeResource } from 'utils/resources';
import {
  pregnancyChance,
  setCharacterFlag,
  setWorldFlag,
} from 'utils/setFlag';
import {
  hasLimitedRights,
  isOppressed,
} from 'utils/town';
import { votingHappens } from 'gameEvents/job/politics';

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
  meanTimeToHappen: 30,
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
    action('Physical prowess').do(setFocusFlag('focusPhysical')).log('You start working on becoming stronger and better equipped'),
    action('Challenging your mind').do(setFocusFlag('focusIntelligence')).log('Much of your time is spent on puzzles and discussions'),
    action('Educating yourself').do(setFocusFlag('focusEducation')).log('Much can be acquired from books and learned men'),
    action('Improving social skills').do(setFocusFlag('focusCharm')).log('Much can be achieved if you can just learn to talk to people'),
    action('Acquiring wealth').do(setFocusFlag('focusWealth')).log(`Money makes the world go 'round`),
    action('Stockpiling food').do(setFocusFlag('focusFood')).log('Never go hungry again'),
    action('Fame and renown').do(setFocusFlag('focusRenown')).log('Hopefully your fame will grow soon'),
    action('Family and children').do(setFocusFlag('focusFamily')).log('Children are the future, after all'),
    action('Having fun').do(setFocusFlag('focusFun')).log('What is there to life if you do not enjoy yourself?'),
    action('Changing things around town')
      .when(_ => !isOppressed(_, _.character) || _.resources.renown >= 250 || _.resources.coin >= 250)
      .do(setFocusFlag('focusCity'))
      .and(resetCityFocus)
      .and(removeBackedCouncillor)
      .log(`It's about time some things changed around here`),
  ],
});

export const minorPhysicalImprovement = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.character.physical < 4 && _.characterFlags.focusPhysical!,
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
  meanTimeToHappen: 2 * 365,
  condition: _ => _.characterFlags.focusPhysical!
    && _.character.physical >= 4
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
  condition: _ => _.character.intelligence < 4 && _.characterFlags.focusIntelligence!,
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
  meanTimeToHappen: 2 * 365,
  condition: _ => _.characterFlags.focusIntelligence!
    && _.character.intelligence >= 4
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
  condition: _ => _.character.education < 4 && _.characterFlags.focusEducation!,
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
  meanTimeToHappen: 2 * 365,
  condition: _ => _.characterFlags.focusEducation!
    && _.character.education >= 4
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
  condition: _ => _.character.charm < 4 && _.characterFlags.focusCharm!,
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
  meanTimeToHappen: 2 * 365,
  condition: _ => _.characterFlags.focusCharm!
    && _.character.charm >= 4
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
  meanTimeToHappen: 6 * 30,
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
    && (_.characterFlags.focusWealth! || _.character.profession === Profession.Trader),
  title: 'Black market opportunity',
  getText: _ => `As your skill with making money have become known, you have been reached out to with an
    offer to participate in an underground black market. They do not tell you enough to reveal anything substantial
    to the guards, but if you wish to risk criminal activity, it could make quite a profit for you`,
  actions: [
    action('Pass this up'),
    action('Involve yourself').and(setCharacterFlag('criminalActivity')).log('You have involved yourself in the black market'),
  ],
});

export const almostCaughtBlackMarket = createEvent.regular({
  meanTimeToHappen: 9 * 30,
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
    action('Invest in a garden').spendResource('coin', 50).and(setCharacterFlag('gardener')).log(
      'You pay for some seeds and tools, and start a garden in your yard',
    ),
    action('Rather not'),
  ],
});

export const gardenEaten = createEvent.regular({
  meanTimeToHappen: 24 * 30,
  condition: _ => _.characterFlags.gardener!
    && _.character.intelligence < 6
    && _.character.education < 6,
  title: 'Pests destroy garden',
  getText: _ => `For some time now, pests have been attacking your garden and eating your plants.
    You have tried everything but you are now close to admitting defeat`,
  actions: [
    action('Hire expert').spendResource('coin', 100).log('You hire an expert to take care of the pests'),
    action('Damnation!').do(setCharacterFlag('gardener', false)).log('Your garden is no more'),
  ],
});

export const gardenDestroyedByWeather = createEvent.regular({
  meanTimeToHappen: 8 * 365,
  condition: _ => _.characterFlags.gardener!,
  title: 'Harsh winter',
  getText: _ => `An early and harsh winter has destroyed your garden. There is nothing to be done against
    the merciless elements.`,
  actions: [
    action('Damnation!').do(setCharacterFlag('gardener', false)).log('Your garden is no more'),
  ],
});

export const gardenMaintenance = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.gardener!,
  title: 'Garden maintenance',
  getText: _ => `Like everything else, your garden requires maintenance. Unless you want
    to see it fail, you will need to invest some money in it`,
  actions: [
    action('Maintain the garden').spendResource('coin', 50).log('You invest some coin into maintaining your garden'),
    action('That is what I have slaves for').when(_ => _.characterFlags.slaves!).log('You command your slaves to take care of your garden'),
    action('Let it fail').do(setCharacterFlag('gardener', false)).log('Your garden fails due to lack of maintenance'),
  ],
});

export const foodSale = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.focusFood!,
  title: 'Food sale',
  getText: _ => `You were keeping an eye out on ways to get more food, and you hear about a local farm selling their
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
  getText: `A travelling bard offers their services to you, promising to spread word
    about your name across town and the region if you would just give them some money.`,
  actions: [
    action('Pay a little')
      .when(_ => _.resources.coin >= 25)
      .do(changeResource('coin', -25))
      .and(triggerEvent(hiringBardFailure).withWeight(3).orTrigger(hiringBardSuccess)),
    action('Pay more')
      .when(_ => _.resources.coin >= 75)
      .do(changeResource('coin', -75))
      .and(triggerEvent(hiringBardFailure).orTrigger(hiringBardSuccess).withWeight(3)),
    action(`Can't trust a bard`),
  ],
});

export const becomesPoet = createEvent.triggered({
  title: 'A star is born',
  getText: _ => `Your attempt at poetry is well-received! You continue writing poetry and people are
    starting to notice, increasing your fame and renown`,
  actions: [
    action('I will be famous!').do(setCharacterFlag('poet')).log('You have decided to become a poet, and your fame spreads'),
  ],
});

export const terriblePoetry = createEvent.triggered({
  title: 'Failed poet',
  getText: `You are very proud of your attempts at poetry, but nobody else seems to agree. Even the
    friend who originally made the suggestion seems to regret their idea.`,
  actions: [
    action(`They don't understand art`).log('It seems that poetry is not your thing after all'),
  ],
});

export const attemptedPoetry = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.focusRenown!
    && !_.characterFlags.poet,
  title: 'Attempted poetry',
  getText: `One day at a tavern, a friend of yours brings up a way that you can become more well-known in the region.
    "Why not try your hand at poetry?" they suggest merrily, though some of that can surely be ascribed to the drinks the
    two of you had imbibed.`,
  actions: [
    action(`Doesn't sound like me`),
    action('Start writing').do(
      triggerEvent(terriblePoetry)
        .orTrigger(becomesPoet)
          .multiplyByFactor(2, _ => _.character.intelligence >= 5)
          .multiplyByFactor(2, _ => _.character.education >= 5),
    ),
  ],
});

export const writersBlock = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.characterFlags.poet!,
  title: `Writer's block`,
  getText: `After some time, your attempts at poetry are getting more and more feeble. You cannot find the muse
    anymore, and no amount of trying or even praying seems to help.`,
  actions: [
    action('It was nice while it lasted').do(setCharacterFlag('poet', false)).log('You have stopped writing poetry'),
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
  meanTimeToHappen: 4 * 30,
  condition: _ => _.characterFlags.focusFamily!
    && _.relationships.spouse != null
    && !(_.characterFlags.pregnant || !_.worldFlags.spousePregnant)
    && _.relationships.children.length < 4,
  title: 'Desire for children',
  getText: _ => `You have been thinking about some time now how ${_.relationships.children.length > 0 ? 'a' : 'another'} child could not
    hurt, and might make your home seem more lively. Maybe this is something you should talk to your spouse about?`,
  actions: [
    {
      condition: _ => isOppressed(_, _.relationships.spouse!),
      text: 'Talk? They have no choice',
      perform: compose(
        pregnancyChance('spousePregnant'),
        notify(`You force your spouse to attend to you in bed every night in hopes of a pregnancy`),
      ),
    },
    {
      text: 'I should do that',
      perform: compose(
        pregnancyChance('spousePregnant'),
        notify('You and your spouse spend more time in bed, in hopes of a pregnancy'),
      ),
    },
    {
      text: 'Rather not',
    },
  ],
});

export const keepingSpouseHappy = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.focusFamily!
    && _.relationships.spouse != null,
  title: 'Spending time with spouse',
  getText: `You always make sure to make time for your spouse and see to their needs and wants. Not everything you do is perfect,
    but it helps you keep you relationship going better`,
  actions: [
    action('You know I love you').and(improveSpouseRelationship).log('You always remember to do the little things for your spouse'),
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

export const establishTownGuard = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.focusCity! && !_.worldFlags.townGuard,
  title: 'Establishing town guard',
  getText: _ => `The city has been defenceless against any attackers that might show up.
    If you were willing to invest some money, you could start a town guard, with you
    as its captain`,
  actions: [
    action('It is worth the cost').spendResource('coin', 500).and(setWorldFlag('townGuard')).and(startJob(Profession.Guard, ProfessionLevel.Leadership)).log(
      'You have established a town guard, with you as its leader and captain',
    ),
    action('Seems too expensive'),
  ],
});

export const physicalLost = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => !_.characterFlags.focusPhysical && _.character.physical > 6,
  title: 'Out of shape',
  getText: _ => `With exercise not being a regular part of your routine, you have started noticing
    that you are not in the shape you once were in`,
  actions: [
    {
      text: 'Huff, puff',
      perform: compose(
        changeStat('physical', -1),
        notify('You are not in the same physical shape you once were in'),
      ),
    },
  ],
});

export const intelligenceLost = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => !_.characterFlags.focusIntelligence && _.character.intelligence > 6,
  title: 'Mind less sharp',
  getText: _ => `You have not being keeping your mind sharp recently, and it shows in the
    way it's getting harder to think deeply`,
  actions: [
    {
      text: '1 + 1 = ???',
      perform: compose(
        changeStat('intelligence', -1),
        notify('You are no longer as cunning and clear-minded as you used to be'),
      ),
    },
  ],
});

export const educationLost = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => !_.characterFlags.focusEducation && _.character.education > 6,
  title: 'World moves on',
  getText: _ => `The world has moved on in its knowledge and methodology, and you have not been
    keeping up`,
  actions: [
    {
      text: 'There are new things?',
      perform: compose(
        changeStat('education', -1),
        notify('Your knowledge has become less relevant'),
      ),
    },
  ],
});

export const charmLost = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => !_.characterFlags.focusCharm && _.character.charm > 6,
  title: 'Out of fashion',
  getText: _ => `You are no longer following fashion and etiquette as carefully as you used to,
    and it would appear that your clothing and behaviour have become queer and antiquated`,
  actions: [
    {
      text: 'Not a follower of fashion',
      perform: compose(
        changeStat('charm', -1),
        notify('People no longer find you as charming and attractive as before'),
      ),
    },
  ],
});

export const learnFromTempleScrolls = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.characterFlags.focusEducation! && _.worldFlags.temple! && _.character.education < 8,
  title: 'Learn from temple',
  getText: _ => `You have been granted access to the library of the local temple in your pursuit of knowledge.
    It holds amazing secrets you have never thought you would learn`,
  actions: [
    {
      text: 'So much I did not know!',
      perform: compose(
        changeStat('education', 1),
        notify('Studying in the local temple, you have learned many new things'),
      ),
    },
  ],
});

export const decideCityFocus = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => _.characterFlags.focusCity! && !hasCityFocus(_),
  title: 'What to change?',
  getText: _ => `You look around ${_.town.name} and consider what you might want to start changing.`,
  actions: cityFocusOptions,
});

export const cityFocusCompleted = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => _.characterFlags.focusCity! && hasCityFocus(_) && completedCityFocus(_),
  title: 'Goal achieved',
  getText: _ => `You have achieved your goals for the city. It will take some time for you to decide what you would want
    to change next`,
  actions: [
    action('I have done well')
      .do(resetCityFocus)
      .and(changeResource('renown', 100))
      .log('You have achieved your recent goals for the city, and all know it'),
  ],
});

export const voteRumoursOnYourCause = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.characterFlags.focusCity! && hasCityFocus(_),
  title: 'Vote to happen soon',
  getText: `A contact of yours has informed you that they have heard that the council will soon convene
    to vote on the matter you care so dearly about`,
  actions: [
    action(`I hope they vote for it!`)
      .do(_ => createRandomVotingDisposition(getCityFocus(_))(_))
      .and(triggerEvent(votingHappens)),
  ],
});

export const backedCandidateElected = createEvent.triggered({
  title: 'Candidate wins seat',
  getText: `The candidate you have backed for the town council has been elected! They promise that they
    will do their best to push the proposal you wish through the town council`,
  actions: [
    action('Soon things will change')
      .do(setBackedCouncillor)
      .log('A candidate you have backed has made it into the town council'),
  ],
});

export const backedCandidateLost = createEvent.triggered({
  title: 'Candidate loses',
  getText: `Sadly, the candidate you have backed did not manage to get a seat in the town council.
    You will have to wait for another likely candidate to appear`,
  actions: [
    action('A shame').do(removeBackedCouncillor).log('Your candidate did not manage to join the town council'),
  ],
});

export const candidateYouCanBack = createEvent.triggered({
  title: 'Candidate presented',
  getText: describeCandidate,
  actions: [
    action('Give smaller donation')
      .when(_ => _.resources.coin >= 250)
      .do(changeResource('coin', -250))
      .and(triggerEvent(backedCandidateLost).orTrigger(backedCandidateElected)),

    action('Give large donation')
      .when(_ => _.resources.coin >= 500)
      .do(changeResource('coin', -500))
      .and(triggerEvent(backedCandidateLost).orTrigger(backedCandidateElected).withWeight(3)),

    action('Pull some strings for them')
      .when(_ => _.resources.renown >= 250)
      .do(changeResource('renown', -250))
      .and(triggerEvent(backedCandidateLost).orTrigger(backedCandidateElected)),

    action('Put weight of your influence behind them')
      .when(_ => _.resources.renown >= 500)
      .do(changeResource('renown', -500))
      .and(triggerEvent(backedCandidateLost).orTrigger(backedCandidateElected).withWeight(3)),

    action('Give speech on their behalf')
      .when(_ => _.character.charm > 6)
      .and(
        triggerEvent(backedCandidateLost)
        .orTrigger(backedCandidateElected)
          .multiplyByFactor(2, _ => _.character.charm >= 8),
      ),

    action('Do not support them')
      .do(removeBackedCouncillor)
      .log('You did not find the proposed candidate to your liking. Influence in the council will have to wait'),
  ],
});

export const potentialCandidate = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.characterFlags.focusCity! && !_.characterFlags.backedCityCouncil,
  title: 'Potential ally',
  getText: `A friend of yours approaches you with some good news. They believe they have found a candidate who might make
    it into the town council, and will be amenable to the cause you support. The two of you will be introduced tomorrow`,
  actions: [
    action('Good!').do(generateBackableCandidate).and(triggerEvent(candidateYouCanBack)),
  ],
});

export const backedCandidateStartsVote = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.characterFlags.focusCity! && _.characterFlags.backedCityCouncil!,
  title: 'Councillor starts vote',
  getText: `You receive news that the councillor you have backed will be starting a vote tomorrow. The only question is,
    will it be about the matter you are backing them for, or for their other passion?`,
  actions: [
    action('We will see')
      .do(startVoteByBackedCouncillor(votingHappens)),
  ],
});

export const backedCandidateLostSeat = createEvent.regular({
  meanTimeToHappen: 6 * 365,
  condition: _ => _.characterFlags.focusCity! && _.characterFlags.backedCityCouncil!,
  title: 'Friendly councillor loses seat',
  getText: `The councillor whose election you have backed, and who was amenable to your goals, seems to have
    lost their seat. They will no longer be able to support you in your efforts to change the town`,
  actions: [
    action('A shame').do(removeBackedCouncillor).log('You no longer have support in the town council'),
  ],
});

export const backedCandidateWantsBribe = createEvent.regular({
  meanTimeToHappen: 4 * 365,
  condition: _ => _.characterFlags.focusCity! && _.characterFlags.backedCityCouncil!,
  title: 'Councillor wants bribe',
  getText: `The councillor whom you have backed wants a hefty bribe to continue favouring your cause.
    It would seem being political got to them`,
  actions: [
    action('Pay them off')
      .when(_ => _.resources.coin >= 500)
      .do(changeResource('coin', -500))
      .log('You pay off a councillor for them to continue favouring your cause'),
    action('Forget it')
      .do(removeBackedCouncillor)
      .log('Without paying a bribe, you no longer have a friend in the council'),
  ],
});

export const offeredCampaignDueToTownFocus = createEvent.regular({
  meanTimeToHappen: 6 * 365,
  condition: _ => !hasLimitedRights(_, _.character) && _.characterFlags.focusCity!,
  title: 'Political influence',
  getText: `You have been building up significant political influence with you efforts to change the town.
    People have started noticing, and are proposing to back a bid for the town council for you. You will have
    a significant leg up in the race, as many potential electors already support you`,
  actions: [
    action('I will run')
      .do(setCharacterFlag('campaign', true))
      .and(_ => changeCampaignScore(getBackedCandidateScore(_))(_))
      .log('You have started a campaign for the town council, with many already offering you their support'),
    action('I would rather not')
      .log('You decided not to take a chance and run for town council'),
  ],
});

export const giveUpOnFocus = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.characterFlags.focusCity! && hasCityFocus(_),
  title: 'Change focus?',
  getText: _ => `You have spent some time focusing on ${currentFocusDescription(_)} in your political life. The issue is
    not yet solved, but there might be more important things to focus on`,
  actions: [
    action('Stay the course'),
    action('Find something different').do(resetCityFocus).log('You decide to focus on changing something else around town'),
  ],
})

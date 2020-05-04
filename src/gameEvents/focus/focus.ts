import { CharacterFlag, ClassEquality } from 'types/state';
import { eventCreator } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import { setCharacterFlag } from 'utils/setFlag';
import { changeStat, removeLastChild } from 'utils/person';
import { changeResource } from 'utils/resources';
import { eventChain } from 'utils/eventChain';
import { banishment } from 'gameEvents/life/general';

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

export const chooseFocus = createEvent.triggered({
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

export const almostCaughtBlackMarker = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.criminalActivity!,
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
  ],
});

export const caughtBlackMarket = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.characterFlags.criminalActivity!,
  title: 'Imprisoned!',
  getText: _ => `Your dealings with the black market have been discovered. You are woken up by guards in the middle of the night,
    dragged into the dungeons, and left there. In the morning, you are informed of the case against you. It is almost ironclad.
    You can try to defend yourself, but it seems unlikely to succeed. Alternatively, you could pay a hefty fine. If you manage
    neither, you will be banished and your possessions taken.`,
  actions: [
    {
      condition: _ => _.character.charm >= 3,
      text: 'Defend myself in court',
      perform: eventChain([
        { id: lostCourtCase.id, weight: 3 },
        { id: wonCourtCase.id, weight: 1 },
        { id: wonCourtCase.id, weight: 2, condition: _ => _.character.charm >= 6 },
      ])
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
      perform: eventChain(banishment.id),
    },
  ],
});

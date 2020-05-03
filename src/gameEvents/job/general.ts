import {
  ID,
  IEvent,
  IGameState,
  Profession,
  ProfessionLevel,
  IGameAction,
  Prosperity,
  Fortification,
  Gender,
} from 'types/state';
import { isOppressed, hasLimitedRights } from 'utils/rights';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import { changeResource } from 'utils/resources';
import { pregnancyChance } from 'utils/setFlag';
import { eventChain } from 'utils/eventChain';

export const JOB_PREFIX = 1_000;

const startJob = (profession: Profession) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    profession,
    professionLevel: ProfessionLevel.Entry,
  },
});

const removeJob =  (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    profession: undefined,
    professionLevel: undefined,
  },
});

const setLevel = (professionLevel: ProfessionLevel) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    professionLevel,
  },
});

const jobActions: IGameAction[] = [
  {
    text: `I'll work at a farm`,
    perform: compose(
      startJob(Profession.Farmer),
      notify(`Farm work is not easy, but you won't lack for food`),
    ),
  },
  {
    condition: (state) => state.town.prosperity > Prosperity.DirtPoor,
    text: `There is work at the bar`,
    perform: compose(
      startJob(Profession.BarWorker),
      notify(`Working at a bar is both lucrative and a good chance to meet people`)
    ),
  },
  {
    condition: (state) => state.character.physical >= 3
      && state.town.fortification > Fortification.None,
    text: `I am strong, I will guard the town`,
    perform: compose(
      startJob(Profession.Guard),
      notify(`The town guard can always use more warm bodies`),
    ),
  },
  {
    condition: (state) =>
      state.town.prosperity >= Prosperity.Decent &&
      state.character.charm >= 3 &&
      !isOppressed(state, state.character),
    text: 'Trading is the way to go',
    perform: compose(
      startJob(Profession.Trader),
      notify('If you move enough money around, some is bound to end up in your pockets'),
    ),
  },
  {
    condition: (state) =>
      state.town.prosperity >= Prosperity.Decent &&
      state.character.charm >= 3 &&
      !hasLimitedRights(state, state.character),
    text: 'Why honest living? Politics it is!',
    perform: compose(
      startJob(Profession.Politician),
      notify(`You start climbing the ladder of rulership in this city`),
    ),
  },
  {
    text: `I'm fine as is`,
  },
];

export const seekJob: IEvent = {
  id: JOB_PREFIX + 1 as ID,
  meanTimeToHappen: 3,
  condition: (state: IGameState) => state.character.profession == null,
  title: 'Looking for a job',
  getText: () => `
    Making a living without work has been very difficult. Maybe it's time
    you found a job and started making an honest wage.

    Of course, not all lines of work might be open to your right now, but
    you can consider those that suit your talents, and change your line of work
    when you have gained experience, or the laws have relaxed.`,
  actions: jobActions,
};

export const changeCurrentJob: IEvent = {
  id: JOB_PREFIX + 2 as ID,
  meanTimeToHappen: 30 * 3, // 3 months
  condition: (state: IGameState) => state.character.professionLevel === ProfessionLevel.Entry,
  title: 'Find a better job',
  getText: (state) => state.character.professionLevel === ProfessionLevel.Entry
    ? `You have been working an entry-level position for some time now. The income is not
      great, the hours are terrible, and don't let me even get started on the boss.

      Maybe it's time you found a job that suited you better?`
    : `Is this job all there is to life? It's not as challenging or interesting as it used
      to be, and there may be lucrative opportunities elsewhere, or at least a change of pace`,
  actions: jobActions,
};

export const promotedFromEntry: IEvent = {
  id: JOB_PREFIX + 3 as ID,
  meanTimeToHappen: 2 * 30, // 2 months
  condition: (state) => state.character.professionLevel === ProfessionLevel.Entry
    && !isOppressed(state, state.character),
  title: 'Moving up in the world',
  getText: () => `Your good work has been recognised and you have been offered a promotion
    to a more meaningful position! This will mean more income, certainly, but increased
    responsibility.`,
  actions: [
    {
      text: 'Accept, of course',
      perform: compose(
        setLevel(ProfessionLevel.Medium),
        notify(`You're no longer a nobody, but this might mean more work.`),
      ),
    },
    {
      text: 'No, I am happy as is',
      perform: notify('Who needs extra responsibility?'),
    },
  ],
};

export const promotedToLeading: IEvent = {
  id: JOB_PREFIX + 4 as ID,
  meanTimeToHappen: 365, // A year
  condition: _ => _.character.professionLevel === ProfessionLevel.Medium
    && !hasLimitedRights(_, _.character)
    && (_.character.intelligence >= 5 || _.character.education >= 5 || _.character.charm >= 5),
  title: 'A leading role',
  getText: () => `You have proven yourself to be excellent at your job, or at least making connections that help you look
    as though you are. A new opportunity has opened up for you to take on a leadership role in your business. This will mean
    money and respect, but also a much greater share of personal responsibility and risk.`,
  actions: [
    {
      text: 'Take the job',
      perform: compose(
        setLevel(ProfessionLevel.Leadership),
        notify('You take a leading role in your business'),
      ),
    },
    {
      text: 'It is too much',
    },
  ],
};

export const anythingToKeepTheJobFailure: IEvent = {
  id: JOB_PREFIX + 6 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'Scorned',
  getText: _ => `Your employer looks at you with disgust. "You would offer your body for this?
    You disgust me, you ${_.character.gender === Gender.Male ? 'man-whore' : 'slut'}! My decision stands!`,
  actions: [
    {
      text: 'All this for nothing!',
      perform: compose(
        removeJob,
        changeResource('renown', -5),
        notify('Not only did you lose your job, word of your actions got around town'),
      ),
    },
  ]
};

export const anythingToKeepTheJobSuccess: IEvent = {
  id: JOB_PREFIX + 7 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'A price to pay',
  getText: _ => `Your employer looks you up and down, and then smiles.
    "Very well, then, that seems fair to me. Meet me in the back room."`,
  actions: [
    {
      text: 'You follow',
      perform: compose(
        pregnancyChance,
        notify('You had to offer your body, but you kept your job'),
      ),
    },
    {
      text: 'The job is not worth this',
      perform: compose(
        removeJob,
        notify('You lost your job, but kept your pride'),
      ),
    },
  ],
};

export const doYouKnowWhoIAmFailure: IEvent = {
  id: JOB_PREFIX + 8 as ID,
  meanTimeToHappen: 0,
  condition: _ => false,
  title: 'Who are you?',
  getText: _ => `"I don't care who you are. Get out!" your former employer is not impressed, and not open to any further attempts at placating.`,
  actions: [
    {
      text: 'Nothing to do',
      perform: compose(
        removeJob,
        notify(`You've lost your job, but you can always find another`),
      ),
    },
  ],
};

export const doYouKnowWhoIAmSuccess: IEvent = {
  id: JOB_PREFIX + 9 as ID,
  meanTimeToHappen: 4,
  condition: _ => false,
  title: 'Too important to fire',
  getText: _ => `"R-right, I'm sorry, I didn't mean that!" your employer stammers nervously as they remember your connections "Of course you can keep the job!"`,
  actions: [
    {
      text: '"I thought as much"',
      perform:  notify(`You have influence in this town, too much influence to be fired just like that`),
    },
  ],
};

export const firedEntry: IEvent = {
  id: JOB_PREFIX + 5 as ID,
  meanTimeToHappen: 3 * 30, // 3 months
  condition: _ => _.character.professionLevel === ProfessionLevel.Entry
    && (isOppressed(_, _.character) || _.character.intelligence < 3 || _.character.education < 3 || _.character.charm < 3),
  title: 'A firing offence',
  getText: _ => isOppressed(_, _.character)
    ? `
    "I'll be honest with you. As a ${_.character.gender === Gender.Male ? 'man' : 'woman'}, you are not fit for this job. Go home and don't come back!".

    Your employer is very direct and does not mince words. Their expression then softens for a moment. "Look, you should get married and have somebody take
    care of you. I'd like to keep you, but you know full well how your gender is. I need people who can actually do the work."`
    : `
    "This is the last time!" your employer shouts, red in the face, as you make a mistake yet another time. "You are fired! Get out of here before I kick you out!"
    `,
  actions: [
    {
      condition: _ => _.resources.coin >= 20,
      text: '"How about you take 20 coins and keep me on?"',
      perform: changeResource('coin', -20),
    },
    {
      condition: _ => _.character.charm > 3,
      text: '"I will do ANYTHING to keep this job"',
      perform: eventChain([
        { id: anythingToKeepTheJobFailure.id, weight: 2 },
        { id: anythingToKeepTheJobSuccess.id, weight: 4 },
        { id: anythingToKeepTheJobSuccess.id, weight: 4, condition: _ => _.character.charm > 5 },
      ])
    },
    {
      condition: _ => _.resources.renown >= 50,
      text: '"Fire ME?! Do you know who I am?!"',
      perform: eventChain([
        { id: doYouKnowWhoIAmFailure.id, weight: 3 },
        { id: doYouKnowWhoIAmSuccess.id, weight: 2 },
        { id: doYouKnowWhoIAmSuccess.id, weight: 5, condition: _ => _.resources.renown >= 200 },
      ]),
    },
    {
      text: `I didn't want this job, anyway`,
      perform: compose(
        removeJob,
        notify(`You've lost your job, but you can always find another`),
      ),
    },
  ],
};

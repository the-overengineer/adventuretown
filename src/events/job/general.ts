import {
  ID,
  IEvent,
  IGameState,
  Profession,
  ProfessionLevel,
  IGameAction,
  Prosperity,
  Fortification,
} from 'types/state';
import { isOppressed, hasLimitedRights } from 'utils/rights';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';

export const JOB_PREFIX = 1_000;

const startJob = (profession: Profession) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    profession,
    professionLevel: ProfessionLevel.Entry,
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
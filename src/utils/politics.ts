import {
  ClassEquality,
  Fortification,
  GenderEquality,
  IGameState,
  StateTransformer,
  Taxation,
} from 'types/state';
import { EventChainBuilder } from './eventChain';
import { action } from './events';
import {
  compose,
  enumValues,
} from './functional';
import { pickOne } from './random';
import { changeResource } from './resources';
import {
  setCharacterFlag,
  setWorldFlag,
} from './setFlag';
import {
  getTmp,
  removeTmp,
  setTmp,
  updateTmp,
} from './tmpBuffer';
import {
  decreaseClassEquality,
  decreaseFortifications,
  increaseClassEquality,
  increaseFemaleRights,
  increaseFortifications,
  increaseMaleRights,
  setTaxation,
} from './town';
import { notify } from './message';

enum VotingMatter {
  EstablishGuard,
  AbolishGuard,
  FinanceTemple,
  AbolishTax,
  SetFlatTax,
  SetProgressiveTax,
  BuildFortifications,
  TearDownFortifications,
  IncreaseMenRights,
  IncreaseWomenRights,
  IncreasePoorRights,
  DecreasePoorRights,
}

enum VoteDirection {
  StronglyAgainst,
  Against,
  For,
  StronglyFor
}

const VOTING_MATTER_KEY = 'votingMatter';
const VOTING_DIRECTION_KEY = 'votingDirection';
const CAMPAIGN_SCORE_KEY = 'campaignScore';

export const startNewCampaign = compose(
  setCharacterFlag('campaign', true),
  setTmp(CAMPAIGN_SCORE_KEY, 0),
);
export const changeCampaignScore = (by: number) => updateTmp(CAMPAIGN_SCORE_KEY, 0, _ => _ + by);
export const getCampaignScore = getTmp<number>(CAMPAIGN_SCORE_KEY, 0);
export const clearCampaignScore = removeTmp(CAMPAIGN_SCORE_KEY);
export const getReElectionScore = (state: IGameState): number => {
  let score = Math.floor(state.resources.renown / 10);
  if (state.characterFlags.jobNeglect!) {
    score -= 100;
  } else if (state.characterFlags.promisedBuildTemple) {
    score -= 100;
  } else if (state.characterFlags.promisedLowerTaxes) {
    score -= 100;
  } else if (state.characterFlags.promisedTownGuard) {
    score -= 100;
  } else if (state.characterFlags.promisedWalls) {
    score -= 100;
  }

  return score;
};

export const voteCondition: Record<VotingMatter, (state: IGameState) => boolean> = {
  [VotingMatter.EstablishGuard]: _ => !_.worldFlags.townGuard,
  [VotingMatter.AbolishGuard]: _ => _.worldFlags.townGuard!,
  [VotingMatter.FinanceTemple]: _ => !_.worldFlags.temple,
  [VotingMatter.AbolishTax]: _ => _.town.taxation !== Taxation.None,
  [VotingMatter.SetFlatTax]: _ => _.town.taxation !== Taxation.Flat,
  [VotingMatter.SetProgressiveTax]: _ => _.town.taxation !== Taxation.Percentage,
  [VotingMatter.BuildFortifications]: _ => _.town.fortification < Fortification.MoatAndCastle,
  [VotingMatter.TearDownFortifications]: _ => _.town.fortification > Fortification.None,
  [VotingMatter.IncreaseMenRights]: _ => _.town.genderEquality > GenderEquality.FemaleOppression,
  [VotingMatter.IncreaseWomenRights]: _ => _.town.genderEquality < GenderEquality.MaleOppression,
  [VotingMatter.IncreasePoorRights]: _ => _.town.equality < ClassEquality.Equal,
  [VotingMatter.DecreasePoorRights]: _ => _.town.equality > ClassEquality.GeneralSlavery,
};

export const voteEffect: Record<VotingMatter, StateTransformer> = {
  [VotingMatter.EstablishGuard]: setWorldFlag('townGuard', true),
  [VotingMatter.AbolishGuard]: setWorldFlag('townGuard', false),
  [VotingMatter.FinanceTemple]: setWorldFlag('temple', true),
  [VotingMatter.AbolishTax]: setTaxation(Taxation.None),
  [VotingMatter.SetFlatTax]: setTaxation(Taxation.Flat),
  [VotingMatter.SetProgressiveTax]: setTaxation(Taxation.Percentage),
  [VotingMatter.BuildFortifications]: increaseFortifications,
  [VotingMatter.TearDownFortifications]: decreaseFortifications,
  [VotingMatter.IncreaseMenRights]: increaseMaleRights,
  [VotingMatter.IncreaseWomenRights]: increaseFemaleRights,
  [VotingMatter.IncreasePoorRights]: increaseClassEquality,
  [VotingMatter.DecreasePoorRights]: decreaseClassEquality,
};

export const voteLabel: Record<VotingMatter, string> = {
  [VotingMatter.EstablishGuard]: 'Establish town guard',
  [VotingMatter.AbolishGuard]: 'Abolish town guard',
  [VotingMatter.FinanceTemple]: 'Finance new temple',
  [VotingMatter.AbolishTax]: 'Abolish taxation',
  [VotingMatter.SetFlatTax]: 'Set a flat tax',
  [VotingMatter.SetProgressiveTax]: 'Set a progressive tax',
  [VotingMatter.BuildFortifications]: 'Build up fortifications',
  [VotingMatter.TearDownFortifications]: 'Tear down fortifications',
  [VotingMatter.IncreaseMenRights]: 'Increase rights for men',
  [VotingMatter.IncreaseWomenRights]: 'Increase rights for women',
  [VotingMatter.IncreasePoorRights]: 'Give more power to poor',
  [VotingMatter.DecreasePoorRights]: 'Give more power to rich',
};

export const voteDescription: Record<VotingMatter, string> = {
  [VotingMatter.EstablishGuard]: `The council votes to establish a city guard to protect the town`,
  [VotingMatter.AbolishGuard]: `The council votes to abolish the city guard, to save money`,
  [VotingMatter.FinanceTemple]: `The council proposes a vote on financing the establishment of a grand temple to the gods`,
  [VotingMatter.AbolishTax]: `The council suggests to abolish taxation to let the economy grow`,
  [VotingMatter.SetFlatTax]: `The council will vote on the setting of a flat tax to finance its activities`,
  [VotingMatter.SetProgressiveTax]: `A vote will be called on setting a progressive tax, to have funding while keeping the poor from being overtaxed`,
  [VotingMatter.BuildFortifications]: `The council proposes to upgrade the town fortification, to save it from external threats`,
  [VotingMatter.TearDownFortifications]: `Voting will begin on the matter of tearing down expensive fortifications and letting the town spread outwards`,
  [VotingMatter.IncreaseMenRights]: `A proposal is on the table to give men more rights`,
  [VotingMatter.IncreaseWomenRights]: `A proposal is on the table to give women more rights`,
  [VotingMatter.IncreasePoorRights]: `A vote is proposed in the council to give even those who own little land or profits more rights`,
  [VotingMatter.DecreasePoorRights]: `The council will start a vote on whether `,
};

export const voteDirectionDescription: Record<VoteDirection, string> = {
  [VoteDirection.StronglyAgainst]: 'the council is almost unanimously against this motion',
  [VoteDirection.Against]: 'the council is leaning slightly against this motion',
  [VoteDirection.For]: 'the council is somewhat in favour of this motion',
  [VoteDirection.StronglyFor]: 'the council is strongly in favour of this motion',
}

export const createVotingProcess = (matter: VotingMatter, direction: VoteDirection) => compose(
  setTmp(VOTING_MATTER_KEY, matter),
  setTmp(VOTING_DIRECTION_KEY, direction),
);

export const endVotingProcess = compose(
  removeTmp(VOTING_MATTER_KEY),
  removeTmp(VOTING_DIRECTION_KEY),
);

export const createRandomVotingDisposition = (matter: VotingMatter) =>
  createVotingProcess(matter, pickOne(enumValues(VoteDirection)))

export const createRandomVoteProposal = (state: IGameState) => createRandomVotingDisposition(
  pickOne(
    enumValues<VotingMatter>(VotingMatter).filter((matter) => voteCondition[matter](state)),
  ),
)(state);

export const describeVoteMatter = (state: IGameState): string =>
  getTmp(VOTING_MATTER_KEY, undefined)(state) != null ? voteDescription[getTmp(VOTING_MATTER_KEY, VotingMatter.AbolishGuard)(state)!] : ''

export const describeVoteDirection = (state: IGameState): string =>
  getTmp(VOTING_DIRECTION_KEY, undefined)(state) != null ? voteDescription[getTmp(VOTING_DIRECTION_KEY, VoteDirection.For)(state)!] : ''

export const describeVote = (state: IGameState): string => `The town council will soon convene to have a voting session to
  decide on the laws of the city. ${describeVoteMatter(state)}. As things now stand, ${describeVoteDirection(state)}, but it might
  be possible to change their minds`;

export const getVoteProposalOptions = (endAction: StateTransformer | EventChainBuilder) => enumValues<VotingMatter>(VotingMatter)
  .map((matter) => (
    action(voteLabel[matter])
      .when(voteCondition[matter])
      .do(createRandomVotingDisposition(matter))
      .and(endAction)
      .done()
  ));

export const getCostSwayFor = (direction: VoteDirection) => {
  switch (direction) {
    case VoteDirection.StronglyAgainst: return 1_000;
    case VoteDirection.Against: return 500;
    default: return 0;
  };
};

export const getCostSwayAgainst = (direction: VoteDirection) => {
  switch (direction) {
    case VoteDirection.StronglyFor: return 1_000;
    case VoteDirection.For: return 500;
    default: return 0;
  };
};

const voteAgainst: Set<VoteDirection> = new Set([
  VoteDirection.Against,
  VoteDirection.StronglyAgainst,
]);

const canBribe = (target: VoteDirection) => (state: IGameState): boolean => {
  const existingVoteDirection = getTmp(VOTING_DIRECTION_KEY, target)(state);
  const costCalculator = voteAgainst.has(target) ? getCostSwayAgainst : getCostSwayFor;
  const cost = costCalculator(existingVoteDirection);
  return state.resources.coin >= cost;
};

const doBribe = (target: VoteDirection) => (state: IGameState): IGameState => {
  const existingVoteDirection = getTmp(VOTING_DIRECTION_KEY, target)(state);
  const costCalculator = voteAgainst.has(target) ? getCostSwayAgainst : getCostSwayFor;
  const cost = costCalculator(existingVoteDirection);
  if (cost > 0) {
    return compose(
      changeResource('coin', -cost),
      setCharacterFlag('bribery', true),
    )(state);
  } else {
    return state;
  }
};

const canConvince = (target: VoteDirection) => (state: IGameState): boolean => {
  const existingVoteDirection = getTmp(VOTING_DIRECTION_KEY, target)(state);
  const costCalculator = voteAgainst.has(target) ? getCostSwayAgainst : getCostSwayFor;
  const cost = costCalculator(existingVoteDirection);
  return state.resources.renown >= cost;
};

const doConvince = (target: VoteDirection) => (state: IGameState): IGameState => {
  const existingVoteDirection = getTmp(VOTING_DIRECTION_KEY, target)(state);
  const costCalculator = voteAgainst.has(target) ? getCostSwayAgainst : getCostSwayFor;
  const cost = costCalculator(existingVoteDirection);
  return changeResource('renown', -cost)(state);
};

export const establishVotedLaw = (state: IGameState): IGameState => {
  const matter = getTmp<VotingMatter | undefined>(VOTING_MATTER_KEY, undefined)(state);

  if (matter != null) {
    return compose(
      voteEffect[matter as unknown as VotingMatter],
      endVotingProcess,
    )(state);
  } else {
    return endVotingProcess(state);
  }
};

export const councilVotesNormally = (state: IGameState): IGameState => {
  const direction = getTmp<VoteDirection>(VOTING_DIRECTION_KEY, VoteDirection.For)(state);

  if (voteAgainst.has(direction)) {
    return compose(
      endVotingProcess,
      notify('Without your influence, the proposal is turned down in a council session'),
    )(state);
  } else {
    return compose(
      establishVotedLaw,
      notify('Without you influencing the process, the proposal becomes law'),
    )(state);
  }
};

export const councilVoteInfluenceActions = [
  action('Ensure law passes, bribing if necessary')
    .when(canBribe(VoteDirection.For))
    .do(doBribe(VoteDirection.Against))
    .and(establishVotedLaw)
    .log('The law changes. If there was any doubt, you paid to make it go away'),
  action('Ensure law passes, calling in favours if needed')
    .when(canConvince(VoteDirection.For))
    .do(doConvince(VoteDirection.For))
    .and(establishVotedLaw)
    .log('The law changes. If any disagreed, you used your influence to change their mind'),
  action('Let them vote as they will')
    .do(councilVotesNormally),
  action('Ensure law fails, bribing if necessary')
    .when(canBribe(VoteDirection.Against))
    .do(doBribe(VoteDirection.Against))
    .and(endVotingProcess)
    .log('The proposal is shot down. If necessary, you paid off people to handle it'),
  action('Ensure law fails, calling in favours if needed')
    .when(canConvince(VoteDirection.Against))
    .do(doConvince(VoteDirection.Against))
    .and(endVotingProcess)
    .log('The proposal is shot down. If somebody disagreed, you used your influence to sway them'),
]

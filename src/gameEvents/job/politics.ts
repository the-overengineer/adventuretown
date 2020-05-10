import {
  ClassEquality,
  Fortification,
  Profession,
  ProfessionLevel,
  Taxation,
} from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import {
  action,
  eventCreator,
} from 'utils/events';
import {
  isInCouncil,
  startJob,
} from 'utils/person';
import {
  changeCampaignScore,
  clearCampaignScore,
  councilVoteInfluenceActions,
  createRandomVoteProposal,
  describeVote,
  getCampaignScore,
  getReElectionScore,
  getVoteProposalOptions,
  startNewCampaign,
} from 'utils/politics';
import { pickOne } from 'utils/random';
import {
  changeResource,
  changeResourcePercentage,
} from 'utils/resources';
import { setCharacterFlag } from 'utils/setFlag';
import {
  getTmp,
  removeTmp,
  setTmp,
} from 'utils/tmpBuffer';
import { hasLimitedRights } from 'utils/town';

const POLITICS_EVENT_PREFIX = 35_000;

const FORTIFICATIONS_AT_PROMISE_KEY = 'fortificationsAtPromise';
const TAXES_AT_PROMISE_KEY = 'taxesAtPromise';

const createEvent = eventCreator(POLITICS_EVENT_PREFIX);

export const bribeOffered = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.character.profession === Profession.Politician,
  title: 'Bribe offered',
  getText: _ => `You have been offered a bribe to grease the wheels of bureaucracy. While doing so is
    not exactly legal, it could be beneficial if nobody discovers it`,
  actions: [
    action('Accept').do(
      pickOne([
        changeResource('coin', 50),
        changeResourcePercentage('coin', 0.05),
      ]),
    ).and(setCharacterFlag('bribery')).log('You take a bribe to help a fellow citizen resolve their political troubles'),
    action('Refuse'),
  ],
});

export const taxCollection = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.character.profession === Profession.Politician && _.character.professionLevel === ProfessionLevel.Medium,
  title: 'Tax collection',
  getText: _ => `You have been tasked with collecting taxes in your area. How do you proceed?`,
  actions: [
    action('I do my duty'),
    action('I put some into my pockets').gainResource('coin', 100).and(setCharacterFlag('bribery')).log(
      'You use tax collection to increase your own wealth',
    ),
    action('I collect less than necessary').gainResource('renown', 50).and(setCharacterFlag('jobNeglect')).log(
      'You tax the people less than necessary. They love you more, but you are not doing your job very well'
    ),
  ],
});

export const campaignStart = createEvent.regular({
  meanTimeToHappen: 4 * 365,
  condition: _ => !isInCouncil(_)
    && !_.characterFlags.campaign
    && !hasLimitedRights(_, _.character),
  title: 'Campaigning',
  getText: _ => `A seat is now open in the ruling council. You are eligible for the spot, but you would have to campaign for it.
    Who it is of course depends on the current laws of it city - be it nobles, landowners, or the general population`,
  actions: [
    action('I will campaign').do(startNewCampaign).log('You have started campaigning to join the town council'),
    action('My time has not yet come'),
  ],
});

export const campaignFavour = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.campaign! && _.characterFlags.friendsInHighPlaces!,
  title: 'Help from above',
  getText: _ => `Your well-positioned friend who owes you a favour is offering to discharge that favour by helping
    sway the electors to your cause`,
  actions: [
    action('All the help I can get').do(changeCampaignScore(200)).and(setCharacterFlag('friendsInHighPlaces', false)).log(
      'You make great strides in your campaign by calling in a favour'
    ),
    action('Thank you, but no'),
  ],
});

export const campaignHindered = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.campaign! && _.characterFlags.enemiesInHighPlaces!,
  title: 'Hounded from above',
  getText: _ => `You have made an influential enemy, and they seem to be doing anything in their power to
    hinder your campaigning efforts`,
  actions: [
    action('Curses!').do(changeCampaignScore(-200)).and(setCharacterFlag('enemiesInHighPlaces', false)).log(
      'Your campaign is disrupted by an enemy you made in the past',
    ),
  ],
});

export const campaignBribery = createEvent.regular({
  meanTimeToHappen: 5 * 30,
  condition: _ => _.characterFlags.campaign!,
  title: 'Bribe electors',
  getText: _ => `You could advance in your campaign by offering bribes to sway the electors`,
  actions: [
    action('Spread some bribes').spendResource('coin', 100).and(changeCampaignScore(100)).and(setCharacterFlag('bribery')).log(
      'You bribe some key people that could influence your election'
    ),
    action('Spread a lot of bribes').spendResource('coin', 250).and(changeCampaignScore(250)).and(setCharacterFlag('bribery')).log(
      'You bribe some key people that could influence your election'
    ),
    action('Spend lavishly').spendResource('coin', 500).and(changeCampaignScore(500)).and(setCharacterFlag('bribery')).log(
      'You bribe some key people that could influence your election'
    ),
    action('I will not stoop to this'),
  ],
});

export const campaignPromises = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.characterFlags.campaign!,
  title: 'Promises',
  getText: _ => `You could advance in your political campaign by making promises to change things when in office`,
  actions: [
    action('Promise better fortifications')
      .when(_ => _.town.fortification < Fortification.Walls && !_.characterFlags.promisedWalls)
      .do(setCharacterFlag('promisedWalls'), changeCampaignScore(200))
      .and(_ => setTmp(FORTIFICATIONS_AT_PROMISE_KEY, _.town.fortification)(_))
      .log('You promise to build better walls, which seems to make everybody happy'),

    action('Promise lower taxes')
      .when(_ => _.town.taxation !== Taxation.None && !_.characterFlags.promisedLowerTaxes && _.town.equality >= ClassEquality.Stratified)
      .do(setCharacterFlag('promisedLowerTaxes'), changeCampaignScore(150))
      .and(_ => setTmp(TAXES_AT_PROMISE_KEY, _.town.fortification)(_))
      .log('You promised lower taxes, which appeals to some of your electorate'),

    action('Promise to build a temple')
      .when(_ => !_.worldFlags.temple && !_.characterFlags.promisedBuildTemple)
      .do(setCharacterFlag('promisedBuildTemple'), changeCampaignScore(200))
      .log('You promise to build a lavish temple to the gods'),

    action('Promise to establish guard')
      .when(_ => !_.worldFlags.townGuard && !_.characterFlags.promisedTownGuard)
      .do(setCharacterFlag('promisedTownGuard'), changeCampaignScore(150))
      .log('You promise to establish a town guard to help the city'),

    action('I will not make promises'),
  ],
});

export const havingSpouseHelps = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.campaign! && _.relationships.spouse != null,
  title: 'Having spouse helps',
  getText: `Being married seems to help your chances of getting elected`,
  actions: [
    action('Excellent').do(changeCampaignScore(100)).log('Having a spouse seems to help your prospects of being elected'),
  ],
});

export const notHavingSpouseHinders = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.campaign! && _.relationships.spouse == null,
  title: 'Unmarried candidate',
  getText: `Being unmarried seems to hinder your prospects of being elected`,
  actions: [
    action('How is that relevant').do(changeCampaignScore(-100)).log('Not having a spouse seems to turn the electors against you'),
  ],
});

export const campaignSpeech = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.campaign!,
  title: 'Campaign speech',
  getText: `You are invited to give a campaign speech before the electors. It would be shameful not to respond, but even worse to
    attend a speech if you know you might flub it`,
  actions: [
    action('Charm them').when(_ => _.character.charm >= 6).do(changeCampaignScore(200)).log('You charm the electors with your words'),
    action('Explain your plan').when(_ => _.character.intelligence >= 6 || _.character.education >= 6).do(changeCampaignScore(200)).log('You outline a clear plan to the electors'),
    action('Stress your influence').when(_ => _.resources.renown >= 500).do(changeCampaignScore(200)).log('You reassure the electors of your influence and connections'),
    action('Speak of you wealth').when(_ => _.resources.coin >= 1_000).do(changeCampaignScore(200)).log('You explain how your vast wealth can help improve this city'),
    action('I have nothing to offer').do(changeCampaignScore(-200)).log('You had nothing to say at a speech, affecting your chances'),
  ],
});

export const campaignDonateFood = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.campaign! && _.resources.food >= 100,
  title: 'Food donations',
  getText: `You might wish to donate some food to the poor. This might make you look good before the electorate`,
  actions: [
    action('Donate a little food').do(changeResource('food', -100)).and(changeCampaignScore(100)).log('You donate a little food'),
    action('Donate some food').do(changeResource('food', -250)).and(changeCampaignScore(250)).log('You donate some food'),
    action('Donate a lot of food').do(changeResource('food', -500)).and(changeCampaignScore(500)).log('You donate a lot of food'),
    action('I cannot waste food'),
  ],
});

export const campaignBlamedForProblems = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.campaign! && (_.worldFlags.goblins! || _.worldFlags.orcs! || _.worldFlags.bandits! || _.worldFlags.sickness! || _.worldFlags.famine! || _.worldFlags.dragon!),
  title: 'Blamed for problems',
  getText: `Your campaign suffers a little bit of a hit as some people start blaming you for some of the problems affecting the area`,
  actions: [
    action('How am I to blame?').do(changeCampaignScore(-100)).log('Some of the electors place the blame for their troubles at your door'),
  ],
});

export const campaignElected = createEvent.triggered({
  title: 'Elected to office',
  getText: `You have been elected into the city council! In these glorious halls, you will be able to make a real difference`,
  actions: [
    action('Excellent!')
      .do(clearCampaignScore)
      .and(setCharacterFlag('campaign', false))
      .and(startJob(Profession.Politician, ProfessionLevel.Leadership))
      .log(`You have become a part of the ruling council`),
  ],
});

export const campaignFails = createEvent.triggered({
  title: 'Campaign fails',
  getText: `Though you have it your best, you did not manage to win a seat in the council, being beaten by other candidates`,
  actions: [
    action('Maybe next time')
      .do(clearCampaignScore)
      .and(setCharacterFlag('campaign', false))
      .and(startJob(Profession.Politician, ProfessionLevel.Medium))
      .log('For all your campaigning, you have failed to win office'),
  ],
});

export const campaignEnds = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.campaign!,
  title: 'Campaign ends',
  getText: `The time for campaigning is through, and it is time to find out whether you have a place on the ruling council or not`,
  actions: [
    action(`I cannot wait`).do(
      triggerEvent(campaignFails).withWeight(2).multiplyByFactor(2, _ => getCampaignScore(_) <= 0)
        .orTrigger(campaignElected)
          .multiplyByFactor(2, _ => getCampaignScore(_) >= 250)
          .multiplyByFactor(4, _ => getCampaignScore(_) >= 500)
          .multiplyByFactor(4, _ => getCampaignScore(_) >= 1_000),
    ),
  ],
});

export const reElectionCampaignStarts = createEvent.regular({
  meanTimeToHappen: 6 * 365,
  condition: _ => isInCouncil(_) && _.town.equality >= ClassEquality.Stratified,
  title: 'Re-election campaign',
  getText: `Due to the town laws, you cannot keep your position without re-election every so often. The quality of the work
    you have done in office will reflect your chances`,
  actions: [
    action('I will will again')
      .when(_ => getReElectionScore(_) >= 0)
      .do(setCharacterFlag('campaign', true))
      .and(_ => changeCampaignScore(getReElectionScore(_))(_))
      .log('The race begins, and you like your chances'),

    action('Uh-oh')
      .when(_ => getReElectionScore(_) < 0)
      .do(setCharacterFlag('campaign', true))
      .and(_ => changeCampaignScore(getReElectionScore(_))(_))
      .log('The race begins, and you do not like your chances')
  ],
});

export const promiseWallsOk = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => isInCouncil(_)
    && _.characterFlags.promisedWalls!
    && getTmp(FORTIFICATIONS_AT_PROMISE_KEY, _.town.fortification)(_) < _.town.fortification,
  title: 'Delivered on promise',
  getText: `You have promised to improve fortifications, and that has happened. The people are happy`,
  actions: [
    action('My word is my bond')
      .do(setCharacterFlag('promisedWalls', false))
      .and(removeTmp(FORTIFICATIONS_AT_PROMISE_KEY))
      .and(changeResource('renown', 100))
      .log('You have delivered on your promise to improve fortifications'),
  ],
});

export const promiseWallsBad = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => isInCouncil(_)
    && _.characterFlags.promisedWalls!
    && getTmp(FORTIFICATIONS_AT_PROMISE_KEY, _.town.fortification)(_) > _.town.fortification,
  title: 'Went back on promise',
  getText: `You have promised to improve fortifications, and the exact opposite has happened. People are not very happy with you`,
  actions: [
    action('My word is my bond')
      .do(setCharacterFlag('promisedWalls', false))
      .and(removeTmp(FORTIFICATIONS_AT_PROMISE_KEY))
      .and(changeResource('renown', -100))
      .log('You have gone against your promise and the fortifications have decayed'),
  ],
});


export const promiseLowerTaxesOk = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => isInCouncil(_)
    && _.characterFlags.promisedLowerTaxes!
    && getTmp(TAXES_AT_PROMISE_KEY, _.town.taxation)(_) > _.town.taxation,
  title: 'Delivered on promise',
  getText: `You have promised to lower taxes, and that has happened. The people are happy`,
  actions: [
    action('My word is my bond')
      .do(setCharacterFlag('promisedLowerTaxes', false))
      .and(removeTmp(TAXES_AT_PROMISE_KEY))
      .and(changeResource('renown', 100))
      .log('You have delivered on your promise to lower taxes'),
  ],
});

export const promiseLowerTaxesBad = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => isInCouncil(_)
    && _.characterFlags.promisedLowerTaxes!
    && getTmp(TAXES_AT_PROMISE_KEY, _.town.taxation)(_) < _.town.taxation,
  title: 'Went back on promise',
  getText: `You have promised to lower taxes, and the exact opposite has happened. People are not very happy with you`,
  actions: [
    action('My word is my bond')
      .do(setCharacterFlag('promisedLowerTaxes', false))
      .and(removeTmp(TAXES_AT_PROMISE_KEY))
      .and(changeResource('renown', -100))
      .log('You have gone against your promise and the taxes have increased'),
  ],
});

export const promiseBuildTemple = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => isInCouncil(_)
    && _.characterFlags.promisedBuildTemple!
    && _.worldFlags.temple!,
  title: 'Delivered on promise',
  getText: `You have promised to make sure a temple is built in the town, and that is now so`,
  actions: [
    action('My word is my bond')
      .do(setCharacterFlag('promisedBuildTemple', false))
      .and(changeResource('renown', 100))
      .log('You have delivered on your promise to have a template built'),
  ],
});

export const promiseSetTownGuard = createEvent.regular({
  meanTimeToHappen: 30,
  condition: _ => isInCouncil(_)
    && _.characterFlags.promisedTownGuard!
    && _.worldFlags.townGuard!,
  title: 'Delivered on promise',
  getText: `You have promised to make sure a town guard is established to defend the town, and that is now so`,
  actions: [
    action('My word is my bond')
      .do(setCharacterFlag('promisedTownGuard', false))
      .and(changeResource('renown', 100))
      .log('You have delivered on your promise to start a town guard'),
  ],
});

export const votingHappens = createEvent.triggered({
  title: 'Voting in the council',
  getText: describeVote,
  actions: councilVoteInfluenceActions,
});

export const voteProposal = createEvent.regular({
  meanTimeToHappen: 4 * 365,
  condition: isInCouncil,
  title: 'Law proposal',
  getText: `Your turn has come in the town council to propose a change in the laws. What will you
    be focusing on?`,
  actions: [
    ...getVoteProposalOptions(triggerEvent(votingHappens)),
    action('Not this time').log('You choose not to propose any laws on this occasion'),
  ],
});

export const voteStartedByAnother = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: isInCouncil,
  title: 'Colleague proposes vote',
  getText: `You learn that tomorrow a colleague in the town council will propose a vote. You have no
    inkling of what they will be proposing, however`,
  actions: [
    action('We will see')
      .do(createRandomVoteProposal)
      .and(triggerEvent(votingHappens))
      .log('Tomorrow, you will vote on the town laws'),
  ],
});

export const leaderBlamedForProblems = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => isInCouncil(_) && (_.worldFlags.goblins! || _.worldFlags.orcs! || _.worldFlags.bandits! || _.worldFlags.sickness! || _.worldFlags.famine! || _.worldFlags.dragon!),
  title: 'Blamed for problems',
  getText: `As a member of the town council, you are being blamed for the issues currently plaguing the town!`,
  actions: [
    action('What can I do?').do(changeResource('renown', -100)).log('You get your share of the blame for the troubles in town'),
  ],
});

export const leaderPraisedForGoodState = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => isInCouncil(_) && !(_.worldFlags.goblins! || _.worldFlags.orcs! || _.worldFlags.bandits! || _.worldFlags.sickness! || _.worldFlags.famine! || _.worldFlags.dragon!),
  title: 'Praised',
  getText: `Townspeople, or at least those who matter, seem to think that you are doing a splendid job in council, as the town is not being
    plagued by any serious issues that would concern them`,
  actions: [
    action('Clearly my doing').do(changeResource('renown', 100)).log('You get praised for the good state of the town'),
  ],
});

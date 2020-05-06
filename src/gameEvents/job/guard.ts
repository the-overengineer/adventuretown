import { Profession, ProfessionLevel } from 'types/state';
import { compose } from 'utils/functional';
import { changeResource } from 'utils/resources';
import { notify } from 'utils/message';
import { triggerEvent } from 'utils/eventChain';
import { changeStat } from 'utils/person';
import { eventCreator } from 'utils/events';
import { setCharacterFlag } from 'utils/setFlag';

const GUARD_JOB_PREFIX: number = 33_000;

const createEvent = eventCreator(GUARD_JOB_PREFIX);

export const toughnessImproved = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.character.profession === Profession.Guard
    && _.character.physical < 5,
  title: 'Fitness improved',
  getText: _ => `Chasing criminals, patrolling the walls and minor scuffles
    with the encroaching creatures have improved your fitness. You notice your
    spear and armour are easier to carry each day`,
  actions: [
    {
      text: 'Wrongdoers fear my might',
      perform: compose(
        changeStat('physical', 1),
        notify('Your guard duties have made you fitter'),
      ),
    },
  ],
});

export const intelligenceImproved = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.profession === Profession.Guard
    && (_.character.intelligence < 4 || _.character.charm < 4),
  title: 'Investigation skill improved',
  getText: _ => `Dealing with criminals is not all just brute force. You have to know how to piece evidence together, whom to talk to,
    and how to present the case before the local magistrate. You have improved more than just your muscles. What have you improved?`,
  actions: [
    {
      condition: _ => _.character.intelligence < 4,
      text: 'Investigation',
      perform: compose(
        changeStat('intelligence', 1),
        notify('Investigating crime has made you cleverer'),
      ),
    },
    {
      condition: _ => _.character.charm < 4,
      text: 'Contacts',
      perform: compose(
        changeStat('charm', 1),
        notify('You have made some contacts as part of your investigations'),
      ),
    },
  ],
});

export const briberyAttempt = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.character.profession === Profession.Guard
    && _.character.professionLevel! > ProfessionLevel.Entry
    && _.characterFlags.tookBribe !== true,
  title: 'Bribe offered',
  getText: _ => `You catch a wealthy miscreant breaking the law. As you have them cornered,
    they offer a toothy smile "Surely some coins can forget that you ever saw me?"`,
  actions: [
    {
      text: 'Accept the bribe',
      perform: compose(
        changeResource('coin', 20),
        setCharacterFlag('tookBribe', true),
        notify('You took a hefty bribe to ignore a crime'),
      ),
    },
    {
      text: 'Reject the bribe',
      perform: compose(
        changeResource('renown', 10),
        setCharacterFlag('enemiesInHighPlaces', true),
        notify('You rejected a bribe. This has made you popular amongst the populace, but might have made you an enemy'),
      ),
    },
  ],
});

export const theftInvestigationDeadEnd = createEvent.triggered({
  title: 'Dead end',
  getText: _ => `Though you have gone through all the evidence and asked all your contacts, you fail to find
    anything conclusive about the theft. In the end, you have to let it go. The city government and the noble
    in particular are not happy`,
  actions: [
    {
      text: `People won't be happy`,
      perform: compose(
        changeResource('renown', -50),
        setCharacterFlag('enemiesInHighPlaces', true),
        notify(`Your investigation was a failure, and people are not happy`),
      ),
    },
  ],
});

export const theftInvestigationInsideJob = createEvent.triggered({
  title: 'Inside job',
  getText: _ => `There were odd things about the case, and this morning you finally figure it out! The theft was
    an inside job. The noble's son sold off the warehouse's stock and claimed it was stolen. He is guilty without
    a doubt, but it might be dangerous to have a noble hanged`,
  actions: [
    {
      text: 'Hang them!',
      perform: compose(
        changeResource('renown', 50),
        setCharacterFlag('enemiesInHighPlaces', true),
        notify(`The nobleman's son hangs - you have solved the crime, but the nobleman can't be happy`)
      ),
    },
    {
      condition: _ => _.character.professionLevel! > ProfessionLevel.Entry
        || _.resources.renown >= 100,
      text: 'Arrange lighter punishment',
      perform: compose(
        changeResource('renown', 25),
        notify(`The nobleman's son is punished, but allowed to live. You are begrudgingly congratulated`),
      ),
    },
    {
      text: 'Drop the case',
      perform: compose(
        changeResource('renown', -50),
        setCharacterFlag('friendsInHighPlaces', true),
        notify(`You drop the case in shame, but have made a friend in high places`),
      ),
    },
  ],
});

export const theftInvestigationThiefCaught = createEvent.triggered({
  title: 'Thief caught',
  getText: _ => `You caught a hardened criminal whom you suspect to be the thief. The evidence points towards them,
    but it is not conclusive and they are professing their innocence. What do you do?`,
  actions: [
    {
      text: 'Hang the thief',
      perform: compose(
        changeResource('renown', 50),
        notify('You have caught and hanged a thief, people are pleased'),
      ),
    },
    {
      text: 'Release them and investigate more',
      perform: triggerEvent(theftInvestigationDeadEnd).withWeight(2)
        .orTrigger(theftInvestigationInsideJob)
          .onlyWhen(_ => _.character.intelligence >= 4 || _.character.charm >= 4)
          .multiplyByFactor(2, _ => _.character.intelligence >= 6 || _.character.charm >= 6)
        .toTransformer(),
    },
  ],
});

export const theftInvestigation = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.character.profession === Profession.Guard,
  title: 'Theft!',
  getText: _ => `A local warehouse has been robbed. Not only was a great amount of wealth lost,
    but the warehouse belongs to the son of a local nobleman. The successful resolution of this
    case could make or break your career`,
  actions: [
    {
      text: 'Investigate',
      perform: triggerEvent(theftInvestigationDeadEnd)
        .orTrigger(theftInvestigationThiefCaught).onlyWhen(_ => _.character.intelligence >= 3 || _.character.charm >= 3)
        .orTrigger(theftInvestigationInsideJob)
          .onlyWhen(_ => _.character.intelligence >= 4 || _.character.charm >= 4)
          .multiplyByFactor(2, _ => _.character.intelligence >= 6 || _.character.charm >= 6)
        .toTransformer(),
    },
  ],
});

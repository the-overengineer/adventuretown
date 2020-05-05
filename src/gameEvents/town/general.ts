import { eventCreator } from 'utils/events';
import { Prosperity, Size, GenderEquality, Profession } from 'types/state';
import { compose } from 'utils/functional';
import { setWorldFlag } from 'utils/setFlag';
import { notify } from 'utils/message';
import { equaliseGenderRights, increaseFemaleRights, increaseMaleRights } from 'utils/town';
import { removeJob } from 'utils/person';


const TOWN_GENERAL_PREFIX: number = 71_000;

const createEvent = eventCreator(TOWN_GENERAL_PREFIX);

export const blackMarketStarted = createEvent.regular({
  meanTimeToHappen: 24 * 30,
  condition: _ => (_.town.prosperity > Prosperity.Poor || _.town.size > Size.Modest) && !_.worldFlags.blackMarket,
  title: 'Black market in town',
  getText: _ => `As ${_.town.name} grows in size and wealth, rumours have been spreading about a
    black market that has been started by the criminal elements of the town. Nobody knows
    anything for certain, but this could lead to a lot of things, both good and bad`,
  actions: [
    {
      text: 'Interesting...',
      perform: compose(
        setWorldFlag('blackMarket', true),
        notify('Rumours spread about a black market being started in town'),
      ),
    },
  ],
});

export const diseaseStarts = createEvent.regular({
  meanTimeToHappen: 36 * 30,
  condition: _ => (_.town.prosperity <= Prosperity.Poor || _.town.size > Size.Average) && !_.worldFlags.sickness,
  title: 'Disease!',
  getText: _ => `Given the state of the town, it is no surprise to you when you hear a disease has
    started spreading around town. More and more people are looking ill, closing themselves in their
    homes, and living in fear.`,
  actions: [
    {
      text: 'Bad news indeed',
      perform: compose(
        setWorldFlag('sickness', true),
        notify('Disease starts spreading through the town'),
      ),
    },
  ],
});

export const diseaseEnds = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.worldFlags.sickness!,
  title: 'Disease ends',
  getText: _ => `The disease that has been going around slowly comes to an end. Please start exiting their homes,
    and things are slowly starting to return to normal`,
  actions: [
    {
      text: 'Thank the gods!',
      perform: compose(
        setWorldFlag('sickness', false),
        notify('The disease is finally coming to an end'),
      ),
    },
  ],
});

export const diseaseWrecksEconomy = createEvent.regular({
  meanTimeToHappen: 5 * 30,
  condition: _ => _.worldFlags.sickness! && _.town.prosperity > Prosperity.Poor,
  title: 'Disease disrupts economy',
  getText: _ => `With the disease ravaging ${_.town.name}, the economy has been taking a downwards turn.
    More and more people have been going hungry, and the shops find it hard to sell anything`,
  actions: [
    {
      text: 'It must end soon',
      perform: compose(
        (state) => ({
          ...state,
          town: {
            ...state.town,
            prosperity: state.town.prosperity - 1,
          },
        }),
        notify('The sickness has ravaged the town economy'),
      ),
    },
  ],
});

export const diseaseShrinksPopulation = createEvent.regular({
  meanTimeToHappen: 5 * 30,
  condition: _ => _.worldFlags.sickness! && _.town.size > Size.Minuscule,
  title: 'Disease kill many',
  getText: _ => `The disease ravaging ${_.town.name} is still going through town, and more and more
    people are dying. Soon, many houses stand abandoned and corpses are piling up`,
  actions: [
    {
      text: 'It must end soon',
      perform: compose(
        (state) => ({
          ...state,
          town: {
            ...state.town,
            size: state.town.size - 1,
          },
        }),
        notify('The sickness has ravaged the population, leaving the town smaller than before'),
      ),
    },
  ],
});

export const diseaseImprovesGenderEquality = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.worldFlags.sickness!
    && _.town.genderEquality !== GenderEquality.Equal,
  title: 'Disease increases gender equality',
  getText: _ => `While disease ravages the city, the workforce dwindles. This has brought the discriminated against sex
    deeper into the workforce and they are slowly gaining more rights`,
  actions: [
    {
      text: 'I see...',
      perform: compose(
        equaliseGenderRights,
        notify('The disease has brought gender rights closer to equal'),
      ),
    },
  ],
});

export const diseaseImprovesFemaleRights = createEvent.regular({
  meanTimeToHappen: 7 * 30,
  condition: _ => _.worldFlags.sickness!
    && _.town.genderEquality >= GenderEquality.MaleDominance
    && _.town.genderEquality < GenderEquality.MaleOppression,
  title: 'Men blamed for disease',
  getText: _ => `Men and their ways have been blamed for this disease. It started as whispers, and grew
    into riots. Soon, men have found themselves with their rights significantly reduced, and women with more rights`,
  actions: [
    {
      text: 'I see...',
      perform: compose(
        increaseFemaleRights,
        notify('The disease has given women more power at the expense of men'),
      )
    },
  ],
});

export const diseaseImprovesMaleRights = createEvent.regular({
  meanTimeToHappen: 7 * 30,
  condition: _ => _.worldFlags.sickness!
    && _.town.genderEquality > GenderEquality.FemaleOppression
    && _.town.genderEquality <= GenderEquality.FemaleDominance,
  title: 'Women blamed for disease',
  getText: _ => `Women and their ways have been blamed for this disease. It started as whispers, and grew
    into riots. Soon, women have found themselves with their rights significantly reduced, and men with more rights`,
  actions: [
    {
      text: 'I see...',
      perform: compose(
        increaseMaleRights,
        notify('The disease has given men more power at the expense of women'),
      ),
    },
  ],
});

export const townGuardEstablished = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => !_.worldFlags.townGuard
    && (_.town.prosperity >= Prosperity.Average || _.town.size >= Size.Modest),
  title: 'Town guard established',
  getText: _ => `With the city growing in size and importance, the rulers of it have decided to establish
    a town guard to protect it.`,
  actions: [
    {
      text: 'I see',
      perform: compose(
        setWorldFlag('townGuard', true),
        notify('A town guard has been established'),
      ),
    },
  ],
});

export const townGuardAbolished = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.townGuard!
    && _.town.prosperity < Prosperity.Average
    && _.town.size < Size.Modest, // TODO: Allow player a choice if in the city council
  title: 'Town guard abolished',
  getText: _ => `Given the size and the economy of the city, the rulers of it have decided that they can no
    longer finance a town guard. It has been abolished and all members of it must find new work`,
  actions: [
    {
      text: 'Worrying',
      perform: compose(
        setWorldFlag('townGuard', false),
        (state) => state.character.profession === Profession.Guard ? removeJob(state) : state,
        notify('Due to the size and the economy of the city, the town guard has been abolished'),
      ),
    },
  ],
});

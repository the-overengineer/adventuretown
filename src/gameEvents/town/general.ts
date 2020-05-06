import { eventCreator } from 'utils/events';
import { Prosperity, Size, GenderEquality, Profession, Taxation, ClassEquality, Fortification } from 'types/state';
import { compose } from 'utils/functional';
import { setWorldFlag } from 'utils/setFlag';
import { notify } from 'utils/message';
import { equaliseGenderRights, increaseFemaleRights, increaseMaleRights, setTaxation, increaseProsperity, decreaseProsperity, increaseFortifications, increaseSize, decreaseSize } from 'utils/town';
import { removeJob } from 'utils/person';
import { changeResource } from 'utils/resources';


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
        decreaseProsperity,
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
        decreaseSize,
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

// TODO: Allow player a choice if in the city council
export const flatTaxIntroduced = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.town.taxation === Taxation.None,
  title: 'Flat taxation introduced',
  getText: _ => `The council of nobles has decided to introduce a flat tax to be able to finance
    the various city operations. Every household will now have to pay equal tax, even if that would leave
    then without a viable income`,
  actions: [
    {
      text: 'But my money!',
      perform: compose(
        setTaxation(Taxation.Flat),
        notify('A flat tax rate was introduced to allow for the town to fund its operations'),
      ),
    },
  ],
});

// TODO: Allow player a choice if in the town council
export const progressiveTaxIntroduced = createEvent.regular({
  meanTimeToHappen: 20 * 365,
  condition: _ => _.town.taxation !== Taxation.Percentage
    && _.town.equality === ClassEquality.Equal,
  title: 'Progressive taxation introduced',
  getText: _ => `Given the equality of people in law, the rulers of the town have decided to introduce a progressive tax,
    where the rich pay more, and the poor less - or none, if they live on a tiny income. This will be used to fund
    various town endeavours.`,
  actions: [
    {
      text: 'I see',
      perform: compose(
        setTaxation(Taxation.Percentage),
        notify('A progressive tax rate has been introduced to allow the town to function without harming the poor'),
      ),
    },
  ],
});

export const taxAbolished = createEvent.regular({
  meanTimeToHappen: 20 * 365,
  condition: _ => _.town.taxation !== Taxation.None
    && _.town.prosperity <= Prosperity.Poor,
  title: 'Tax abolished',
  getText: _ => `Due to the poor economy of the town, the rulers of the town have decided to abolish taxes for the time being,
    to allow the local economy to strengthen itself`,
  actions: [
    {
      text: 'More money for me!',
      perform: compose(
        setTaxation(Taxation.None),
        notify('Taxes have been abolished to allow the town economy to recover'),
      ),
    },
  ],
});

export const notEnoughTaxesForGuard = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.townGuard! && _.town.taxation === Taxation.None,
  title: 'Town guard closing down',
  getText: _ => `Without any taxes to keep them going, the town guard is about to close down. Only a large donation could
    keep them operational`,
  actions: [
    {
      condition: _ => _.resources.coin >= 100,
      text: 'Donate',
      perform: compose(
        changeResource('coin', -100),
        notify('You donated a large sum of money to keep the town guard operational'),
      ),
    },
    {
      text: 'Let them fail',
      perform: compose(
        setWorldFlag('townGuard', false),
        notify('Without funding, the town guard has been abolished'),
      ),
    },
  ],
});

export const economyGrowsWithoutTaxes = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.town.taxation === Taxation.None && _.town.prosperity <= Prosperity.WellOff,
  title: 'Economy booms',
  getText: _ => `Without taxes to keep businesses down, the economy in ${_.town.name} is booming`,
  actions: [
    {
      text: 'Excellent!',
      perform: compose(
        increaseProsperity,
        notify('Prosperity increases in the town due to lack of taxation'),
      ),
    },
  ],
});

export const businessesEscapeTax = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.town.taxation === Taxation.Percentage && _.town.prosperity >= Prosperity.WellOff,
  title: 'Taxes force businesses out',
  getText: _ => `Progressive taxes have been hard for large businesses. The better they do, the more taxes they have to pay.
    This has forced many of the larger businesses to move elsewhere, and has had a poor impact on the economy`,
  actions: [
    {
      text: 'I see...',
      perform: compose(
        decreaseProsperity,
        notify('High taxation has forced businesses out and lowered the prosperity of the town'),
      ),
    },
  ],
});

export const defendAgainstAttackers = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.town.fortification < Fortification.Palisade
    && _.town.prosperity >= Prosperity.Decent
    && (_.worldFlags.orcs! || _.worldFlags.goblins! || _.worldFlags.bandits!),
  title: 'Defenses improved',
  getText: _ => `With a looming threat not for from the town, the ruling council has invested
    some money into raising its defences, hoping to keep the attackers out`,
  actions: [
    {
      text: 'Very good!',
      perform: compose(
        increaseFortifications,
        notify('Fortifications have been improved to keep the enemy at bay'),
      ),
    },
  ],
});

export const progressiveTaxPopulationGrowth = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.town.taxation === Taxation.Percentage
    && _.town.size < Size.Large,
  title: 'Migration into town',
  getText: _ => `Low taxes on the poor have greatly increased the population of the town,
    since more people wish to live here, where their masters do not tax them so much that they
    cannot make an honest living`,
  actions: [
    {
      text: 'Interesting',
      perform: compose(
        increaseSize,
        notify('Many poorer people have moved into the town due to its taxation rate'),
      ),
    },
  ],
});

export const progressiveTaxDefencesImproved = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.town.taxation === Taxation.Percentage
    && _.town.fortification < Fortification.Walls,
  title: 'Taxes invested into defences',
  getText: _ => `Due to progressive taxation increasing the tax income, the rulers of the
    town have decided to invest some of it into raising the town's defences.`,
  actions: [
    {
      text: 'Interesting',
      perform: compose(
        increaseFortifications,
        notify('Increased taxes have been invested into improving the town defences'),
      ),
    },
  ],
});

export const increaseEconomyDueToSize = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.town.size >= Size.Large && _.town.prosperity < Prosperity.WellOff,
  title: 'Economy improves',
  getText: _ => `The large population of the town has made it possible to start many new businesses,
    which in turn has improved the economy`,
  actions: [
    {
      text: 'Great!',
      perform: compose(
        increaseProsperity,
        notify('The larger population of the town has led to an increase in economy'),
      ),
    },
  ],
});

export const decreaseEconomyDueToSize = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.town.size <= Size.Modest && _.town.prosperity >= Prosperity.WellOff,
  title: 'Economy shrinks',
  getText: _ => `Due to the small population of the town, businesses had to start closing, and the economy
    as a whole suffered`,
  actions: [
    {
      text: 'Troubling',
      perform: compose(
        decreaseProsperity,
        notify('The small population of the town could no longer sustain such a strong economy'),
      ),
    },
  ],
});

export const increaseSizeDueToEconomy = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.town.size < Size.Large && _.town.prosperity >= Prosperity.WellOff,
  title: 'Migration into town',
  getText: _ => `Many people from neighbouring towns have started moving into ${_.town.name} due to its
    booming commerce and economy`,
  actions: [
    {
      text: 'Interesting',
      perform: compose(
        increaseSize,
        notify('People move into the city, drawn in by its bustling economy'),
      ),
    },
  ],
});

export const decreaseSizeDueToEconomy = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.town.size >= Size.Large && _.town.prosperity < Prosperity.Average,
  title: 'Migration out of town',
  getText: _ => `It would appear that the economy of the town cannot support so many people,
    and many start moving away in search of better opportunities`,
  actions: [
    {
      text: 'Interesting',
      perform: compose(
        increaseSize,
        notify('People move out in search of better opportunities'),
      ),
    },
  ],
});

import {
  ClassEquality,
  Fortification,
  GenderEquality,
  Profession,
  Prosperity,
  Size,
  Taxation,
} from 'types/state';
import { eventCreator, action } from 'utils/events';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import { removeJob, isInCouncil } from 'utils/person';
import { changeResource, changeResourcePercentage } from 'utils/resources';
import { setWorldFlag } from 'utils/setFlag';
import {
  decreaseFortifications,
  decreaseProsperity,
  decreaseSize,
  equaliseGenderRights,
  increaseFemaleRights,
  increaseFortifications,
  increaseMaleRights,
  increaseProsperity,
  increaseSize,
  setRandomGovernment,
  setTaxation,
} from 'utils/town';
import { death } from 'gameEvents/life/general';
import { triggerEvent } from 'utils/eventChain';

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
    && _.town.size < Size.Modest,
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

export const flatTaxIntroduced = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.town.taxation === Taxation.None && !isInCouncil(_),
  title: 'Flat taxation introduced',
  getText: _ => `The council of nobles has decided to introduce a flat tax to be able to finance
    the various city operations. Every household will now have to pay equal tax, even if that would leave
    then without a viable income`,
  actions: [
    action('But my money!').do(setTaxation(Taxation.Flat)).log('A flat tax rate was introduced to allow for the town to fund its operations'),
  ],
});

export const progressiveTaxIntroduced = createEvent.regular({
  meanTimeToHappen: 20 * 365,
  condition: _ => _.town.taxation !== Taxation.Percentage
    && _.town.equality === ClassEquality.Equal
    && !isInCouncil(_),
  title: 'Progressive taxation introduced',
  getText: `Given the equality of people in law, the rulers of the town have decided to introduce a progressive tax,
    where the rich pay more, and the poor less - or none, if they live on a tiny income. This will be used to fund
    various town endeavours.`,
  actions: [
    action('I see').do(setTaxation(Taxation.Percentage)).log(
      'A progressive tax rate has been introduced to allow the town to function without harming the poor',
    ),
  ],
});

export const taxAbolished = createEvent.regular({
  meanTimeToHappen: 15 * 365,
  condition: _ => _.town.taxation !== Taxation.None
    && _.town.prosperity <= Prosperity.Poor
    && !isInCouncil(_),
  title: 'Tax abolished',
  getText: `Due to the poor economy of the town, the rulers of the town have decided to abolish taxes for the time being,
    to allow the local economy to strengthen itself`,
  actions: [
    action('More money for me!').do(setTaxation(Taxation.None)).log('Taxes have been abolished to allow the town economy to recover'),
  ],
});

export const notEnoughTaxesForGuard = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.townGuard! && _.town.taxation === Taxation.None && !isInCouncil(_),
  title: 'Town guard closing down',
  getText: `Without any taxes to keep them going, the town guard is about to close down. Only a large donation could
    keep them operational`,
  actions: [
    action('Donate').when(_ => _.resources.coin >= 100).do(changeResource('coin', -100)).log(
      'You donated a large sum of money to keep the town guard operational',
    ),
    action('Let them fail').do(setWorldFlag('townGuard', false)).log('Without function, the town guard has been disbanded'),
  ],
});

export const taxationProposed = createEvent.regular({
  meanTimeToHappen: 2.5 * 365,
  condition: _ => _.town.taxation === Taxation.None
    && (_.town.size >= Size.Modest || _.worldFlags.famine! || _.worldFlags.sickness!)
    && isInCouncil(_),
  title: 'Flat tax proposed',
  getText: `The council convenes urgently. The city coffers have almost run dry and some city service will need to be cut, unless a new
    tax is introduced to allow the city to function. The council is split on the issue, and you have the deciding vote`,
  actions: [
    action('Donate my own money').when(_ => _.resources.coin >= 500).do(changeResource('coin', -500)).log(
      'You use your own money to keep key services going for the time being'
    ),
    action('Abolish the guard').when(_ => _.worldFlags.townGuard!).do(setWorldFlag('townGuard', false)).log(
      'The town guard has been abolished to save the town money',
    ),
    action('Stop maintaining defences').when(_ => _.town.fortification > Fortification.None).do(decreaseFortifications).log(
      'Some of the fortifications needed to be left to decay',
    ),
    action('Introduce flat tax').do(setTaxation(Taxation.Flat)).log('The council introduces a flat tax to pay for town operations'),
    action('Introduce progressive tax').do(setTaxation(Taxation.Percentage)).log('The council introduces a progressive tax to pay for town operations'),
  ],
});

export const taxAbolishProposed = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.town.taxation !== Taxation.None
    && _.town.prosperity <= Prosperity.Poor
    && isInCouncil(_),
  title: 'Taxes too high?',
  getText: `A heated discussion was started in the council on whether to abolish taxes for the time being. It would appear that the high
    taxes might be the reason so few people decide to settle in the town, and the economy is choking. With the council split, the decision
    is yours`,
  actions: [
    action('Abolish tax').do(setTaxation(Taxation.None)).log('As per your advice, the ruling council abolishes taxation to boost the economy'),
    action('Leave the tax').log('As per your advice, the ruling council leaves the tax in place'),
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
    && (_.worldFlags.orcs! || _.worldFlags.goblins! || _.worldFlags.bandits! || _.worldFlags.dragon!),
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
        decreaseSize,
        notify('People move out in search of better opportunities'),
      ),
    },
  ],
});

export const verminAppear = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => !_.worldFlags.vermin,
  title: 'Vermin!',
  getText: _ => `The town is getting overwhelmed with rats, mice, and voles. It is only a matter
    of time before they start getting into the grain stores`,
  actions: [
    {
      text: 'Drat!',
      perform: compose(
        setWorldFlag('vermin', true),
        notify('The town is being overrun by vermin'),
      ),
    }
  ],
});

export const verminDisappear = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.worldFlags.vermin!,
  title: 'Vermin disappear',
  getText: _ => `It is getting less and less common to find vermin around ${_.town.name}. Maybe they
    have finally gone away?`,
  actions: [
    {
      text: `Let's hope so!`,
      perform: compose(
        setWorldFlag('vermin', false),
        notify('The town seems to be free of vermin, for the time being'),
      ),
    },
  ],
});

export const verminDisappearFamine = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.worldFlags.vermin! && _.worldFlags.famine!,
  title: 'Vermin disappear',
  getText: _ => `With nothing to eat due to the harsh famine, the rats and mice seem to have migrated away from ${_.town.name}`,
  actions: [
    {
      text: `Let's hope so!`,
      perform: compose(
        setWorldFlag('vermin', false),
        notify('There is still little food, but at least the vermin are gone'),
      ),
    },
  ],
});

export const verminCausePlague = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.worldFlags.vermin! && !_.worldFlags.sickness,
  title: 'Sickness spreads',
  getText: _ => `Suddenly, as if sent from the gods, sickness appears. Some people seem to believe
    that it was spread by the vermin which run all over the town, others seem to think it is a punishment
    for your sins`,
  actions: [
    {
      text: `I hope it passes soon`,
      perform: compose(
        setWorldFlag('sickness', true),
        notify('There is a sickness spreading. Some blame the vermin running around town'),
      ),
    }
  ],
});

export const famineDueToWeather = createEvent.regular({
  meanTimeToHappen: 30 * 365,
  condition: _ => !_.worldFlags.famine,
  title: 'Famine!',
  getText: _ => `Last winter was long and harsh, and spring came late. The supplies are dwindling,
    and food is more and more expensive. It will be a tough year`,
  actions: [
    {
      text: 'Time to tighten my belt',
      perform: compose(
        setWorldFlag('famine', true),
        notify('A harsh winter has started a famine'),
      ),
    },
  ],
});

// TODO: City council event to import food and end famine or something
export const famineEnds = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.famine!,
  title: 'Famine ends!',
  getText: _ => `Finally, farms start producing sufficient food again. It would seem that the difficult period of famine as ended
    at last`,
  actions: [
    action('Finally!').do(setWorldFlag('famine', false)).log('After a period of starvation, the famine has come to an end'),
  ],
});

export const famineShrinksPopulation = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.famine! && _.town.size > Size.Minuscule,
  title: 'Famine shrinks population',
  getText: _ => `With so many people dying due to the famine, ${_.town.name} is not as populous as it used to be`,
  actions: [
    action('A tragedy').do(decreaseSize).log('So many people have died out due to the famine that the population has shrunk'),
  ],
});

export const fortificationDecayHighFort = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.town.fortification >= Fortification.Walls
    && (_.town.prosperity <= Prosperity.Average || _.town.size <= Size.Average || _.town.taxation === Taxation.None)
    && !isInCouncil(_),
  title: 'Fortifications decay',
  getText: _ => `The town of ${_.town.name} simply cannot afford to maintain the extensive fortifications
    it had built in the past with the present state of the economy. Soon, they decay, leaving the town more
    vulnerable`,
  actions: [
    action('Bad news').do(decreaseFortifications).log('Due to lack of maintenance, fortifications have decayed'),
  ],
});

export const fortificationDecayRegular = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.town.fortification > Fortification.Ditch
    && (_.town.prosperity <= Prosperity.Poor || _.town.size <= Size.Tiny || _.town.taxation === Taxation.None)
    && !isInCouncil(_),
  title: 'Fortifications decay',
  getText: _ => `The town of ${_.town.name} simply cannot afford to maintain the extensive fortifications
    it had built in the past with the present state of the economy. Soon, they decay, leaving the town more
    vulnerable`,
  actions: [
    action('Bad news').do(decreaseFortifications).log('Due to lack of maintenance, fortifications have decayed'),
  ],
});

export const agriculturalRevolutionHappens = createEvent.regular({
  meanTimeToHappen: 150 * 365,
  condition: _ => !_.worldFlags.agriculturalRevolution,
  title: 'Agricultural revolution',
  getText: `Local farmers have discovered a better way of ploughing the fields,
    which will allow the populace to produce much more food. This will be good for everybody`,
  actions: [
    action('Incredible!').do(setWorldFlag('agriculturalRevolution')).log('An agricultural revolution has boosted the food production in the town'),
  ],
});

export const startAgriculturalRevolution = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => !_.worldFlags.agriculturalRevolution
    && (_.character.intelligence >= 8 || _.character.education >= 8 || _.resources.coin >= 1_000),
  title: 'Agricultural reform',
  getText: `You believe you can make a revolution in food production by reforming the agricultural
    practices. You go before the ruling council to present your idea that will make the food production
    stronger than ever`,
  actions: [
    action('Explain your brilliant idea')
      .when(_ => _.character.intelligence >= 8 || _.character.education >= 9)
      .do(setWorldFlag('agriculturalRevolution'))
      .log('The ruling council happily approves your idea for agricultural reform'),
    action('Hire a druid')
      .when(_ => _.resources.coin >= 1_000)
      .do(changeResource('coin', -1_000))
      .and(setWorldFlag('agriculturalRevolution')),
    action('Never mind'),
  ],
});

export const agricultureOutdated = createEvent.regular({
  meanTimeToHappen: 30 * 365,
  condition: _ => _.worldFlags.agriculturalRevolution!,
  title: 'Agriculture normalises',
  getText: `The improvements performed to the agriculture in times past are no longer relevant,
    as the region has caught up.`,
  actions: [
    action('It was good while it lasted').do(setWorldFlag('agriculturalRevolution', false)).log(
      'Your agricultural methods are no longer especially advanced for the area',
    ),
  ],
});

export const agriculturalRevolutionBeatsFamine = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.worldFlags.agriculturalRevolution! && !_.worldFlags.famine,
  title: 'Sufficient food',
  getText: `The overwhelming efficiency of your agriculture has allowed to the town to beat
    the famine`,
  actions: [
    action('Excellent!').do(setWorldFlag('famine', false)).log(
      'The agricultural production of the region has outpaced the famine',
    ),
  ],
});

export const templateEstablished = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => !_.worldFlags.temple
    && (_.town.prosperity >= Prosperity.Average || _.town.size >= Size.Average),
  title: 'Great temple built',
  getText: _ => `So far your town has housed only small chapels and handfuls of priests, but now the
    town has invested in building a great temple, where priests will live and learn, as well as help
    the populace`,
  actions: [
    action('Praise the gods!').do(setWorldFlag('temple')).log('A magnificent template has been built'),
  ],
});

export const templeGone = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.worldFlags.temple!
    && (_.town.prosperity < Prosperity.Decent || _.town.size < Size.Modest),
  title: 'Temple closes',
  getText: _ => `Due to the state and population of the town, the local temple to the gods can no longer justify
    or finance itself here, and has chosen to close its doors. The priests have scattered to the four winds`,
  actions: [
    action('Bad news').do(setWorldFlag('temple', false)).log('The great temple has closed, and children now use its echoing halls to play'),
  ],
});

export const templeDemandsTax = createEvent.regular({
  meanTimeToHappen: 15 * 365,
  condition: _ => _.worldFlags.temple! && _.town.equality >= ClassEquality.Stratified,
  title: 'Temple demands taxes',
  getText: _ =>`The local temple is grand indeed, but now it has been authorised to demand funds from the populace.
    It would appear that it cannot live on prayer alone. ALl people in ${_.town.name} are required to pay a hefty
    percentage of their worth to the temple`,
  actions: [
    action('Why do the gods not help?').do(changeResourcePercentage('coin', -0.1)).log('The temple levies a great tax'),
  ],
});

export const templeHealsPlague = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.worldFlags.temple! && _.worldFlags.sickness!,
  title: 'Priests heal plague',
  getText: `The priests have stepped out of the safety of their temple into the town, guided by their divine
    principles, and have started healing the plague that is affecting the town. It would appear that nature cannot
    stand up to the gods, and before long most are healed`,
  actions: [
    action('Praise the gods!').do(setWorldFlag('sickness', false)).log('The priests from the local temple eradicate the sickness'),
  ],
});

export const plagueTempleDestroyed = createEvent.regular({
  meanTimeToHappen: 7 * 365,
  condition: _ => _.worldFlags.temple! && _.worldFlags.sickness!,
  title: 'Temple destroyed',
  getText: _ => `While sickness ravages the land, the priests hide behind the walls of their temple and pray, mostly
    unaffected. The poor people of ${_.town.name} have risen up, sick of this, and have destroyed the temple and chased
    the priests away`,
  actions: [
    action('Terrible').do(setWorldFlag('temple', false)).log('Out of desperation, the locals have destroyed the town temple'),
  ],
});

export const famineTempleDestroyed = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.worldFlags.temple! && _.worldFlags.famine!,
  title: 'Temple destroyed',
  getText: _ => `While famine ravages the land, the priests hide behind the walls of their temple and pray, mostly
    unaffected. The poor people of ${_.town.name} have risen up, sick of this, and have destroyed the temple and chased
    the priests away`,
  actions: [
    action('Terrible').do(setWorldFlag('temple', false)).log('Out of desperation, the locals have destroyed the town temple'),
  ],
});

export const currencyDevalued = createEvent.regular({
  meanTimeToHappen: 15 * 365,
  condition: _ => _.town.prosperity >= Prosperity.WellOff,
  title: 'Currency devalued',
  getText: _ => `The town was forced to devalue its currency to remain competitive in trading with the neighbouring
    settlements. All your coin is now worth less`,
  actions: [
    action('Damn!').do(changeResourcePercentage('coin', -0.25)).log('Currency was devalued, decreasing the worth of your savings'),
  ],
});

export const civilWarLost = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.civilWar! && !isInCouncil(_),
  title: 'Civil war ended',
  getText: _ => `The rulers of the city have been put to death and a new government establish. They establish new laws
    and no longer respect the decisions of their predecessors`,
  actions: [
    action('Finally!').do(setWorldFlag('civilWar', false)).and(setRandomGovernment).log(
      'The civil war has finally ended and the town returns to normal, more or less',
    ),
  ],
});

export const civilWarLostCouncil = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.civilWar! && isInCouncil(_),
  title: 'Civil war lost!',
  getText: `The government that you are a part of has lost the civil war, and they are putting the council members to death`,
  actions: [
    action('Spare me! Have half my wealth!')
      .when(_ => _.resources.coin >= 500)
      .do(changeResourcePercentage('renown', -0.5))
      .do(changeResourcePercentage('coin', -0.5))
      .do(setWorldFlag('civilWar', false))
      .and(removeJob)
      .log('When the government falls, your life is spared, but at great expense, and you lose much prestige, and your office'),
    action('Convince them to spare you')
      .when(_ => _.character.intelligence >= 8 || _.character.charm >= 8)
      .do(changeResourcePercentage('renown', -0.5))
      .do(setWorldFlag('civilWar', false))
      .and(removeJob)
      .log('When the government falls, your life is spared due to your cunning and charm, but you lose much prestige, and your office'),
    action('My life is yours')
      .do(triggerEvent(death))
      .do(setWorldFlag('civilWar', false))
      .log('When your side loses the civil war, your life is lost as well'),
  ],
})

export const civilWarStarts = createEvent.regular({
  meanTimeToHappen: 20 * 365,
  condition: _ => _.worldFlags.famine!
    || _.worldFlags.sickness!
    || _.town.prosperity > Prosperity.Average
    || _.town.size > Size.Large
    || _.town.equality === ClassEquality.GeneralSlavery,
  title: 'Civil war',
  getText: _ => `Tension in the streets of ${_.town.name}, as well as the fight over resources, has brought unrest, and then a full
    civil war. There are fights happening openly in the streets`,
  actions: [
    action('This is bad').do(setWorldFlag('civilWar')).log('Rebel factions in the town have started a rebellion, and now a civil war. The future is uncertain'),
  ],
});

export const civilWarWon = createEvent.regular({
  meanTimeToHappen: 1.25 * 365,
  condition: _ => _.worldFlags.civilWar! && !isInCouncil(_),
  title: 'Civil war ended',
  getText: `The rulers of the city have managed to quash the rebellion and end the unrest on the streets`,
  actions: [
    action('Finally!').do(setWorldFlag('civilWar', false)).log('The civil war finally comes to an end, and things return to normal'),
  ],
});

export const civilWarWonCouncil = createEvent.regular({
  meanTimeToHappen: 1.25 * 365, // TODO: Modifiy depending on whether the is a guard
  condition: _ => _.worldFlags.civilWar! && isInCouncil(_),
  title: 'Civil war won',
  getText: `You, the rest and the council, and your forces have finally quashed the rebellion. Your enemies are gone, and you
    keep your position, as well as gain great prestige`,
  actions: [
    action('Our enemies are gone')
      .do(changeResource('renown', 500))
      .and(setWorldFlag('civilWar', false))
      .log('Your forces win the civil war'),
  ],
});

export const civilWarFamine = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.civilWar! && !_.worldFlags.famine,
  title: 'Supply lines broken',
  getText: _ => `With a civil war raging, the supply lines have been broken. Getting goods is now quite difficult`,
  actions: [
    action('I hope I make it!').do(setWorldFlag('famine')).log('With the civil war raging on, getting food has gotten near impossible'),
  ],
});

export const famineDisruptsEconomy = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.worldFlags.famine! && _.town.prosperity > Prosperity.Decent,
  title: 'Hunger chokes economy',
  getText: _ => `With the average citizen hungry, the economy has been taking a down turn`,
  actions: [
    action('Troubling').do(decreaseProsperity).log('With famine ravaging the workforce, the economy is crumbling'),
  ],
});

export const blackMarketGrowsTown = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.blackMarket! && _.town.size < Size.Average,
  title: 'Black market helps town grow',
  getText: `With the black market in town, there was always untaxed business to do, and more people going in and out
    of town. More and more choose to stay and conduct their business here`,
  actions: [
    action('Fascinating').do(increaseSize).log('The town grows as the black market draws more people'),
  ],
});

export const blackMarketDrawsBandits = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.blackMarket! && !_.worldFlags.bandits,
  title: 'Black market draws bandits',
  getText: `Some of their unsavoury sort must have seen the black market and the business it draws into the town.
    A group of them soon establish themselves in the area`,
  actions: [
    action('Criminals, all').do(setWorldFlag('bandits')).log('Drawn by the black market, bandits establish themselves'),
  ],
});

export const blackMarketDrawsAdventurers = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.blackMarket! && !_.worldFlags.adventurers && !_.worldFlags.adventurerKeep,
  title: `Black market draws adventurers`,
  getText: `Though they present themselves as heroes more often than not, adventurers have much of interest to find
    in the town's black market`,
  actions: [
    action('Some heroes').do(setWorldFlag('adventurers')).log('Adventurers arrive to do business in the black market'),
  ],
});

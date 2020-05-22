import {
  IGameState,
  Profession,
  ProfessionLevel,
  Prosperity,
  Size,
} from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import {
  action,
  eventCreator,
} from 'utils/events';
import { compose } from 'utils/functional';
import { changeStat } from 'utils/person';
import { pickOne, inIntRange } from 'utils/random';
import {
  changeResource,
  changeResourcePercentage,
} from 'utils/resources';
import {
  setCharacterFlag,
  setWorldFlag,
} from 'utils/setFlag';
import {
  getTmp,
  hasTmp,
  removeTmp,
  setTmp,
} from 'utils/tmpBuffer';
import { death } from 'gameEvents/life/general';

const TRADER_EVENT_PREFIX = 34_000;

const createEvent = eventCreator(TRADER_EVENT_PREFIX);

export const charmImproved = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.character.profession === Profession.Trader && _.character.charm < 6,
  title: 'Silver tongue',
  getText: `Your job often involves... describing things in the best possible light. You have
    learned a lot about dealing with people`,
  actions: [
    action('I do talk smoothly').do(changeStat('charm', 1)).log('You have learned how to handle people better'),
  ],
});

export const customerMakesNewPurchase = createEvent.triggered({
  title: 'Customer charmed',
  getText: _ => `You convince the customer that they were wrong, and that they should make an entirely new purchase as a way
    of getting what they want. They seem to be taken by your explanation`,
  actions: [
    action('A bonus for me').changeResource('coin', 25).log('You manage to charm an angry customer into one ready to make another purchase'),
  ],
});

export const customerLeavesAngry = createEvent.triggered({
  title: 'Angry customer',
  getText: _ => `The customer has an angry discussion with you, but finally leaves dissatisfied. You fear, however, that they
    will spread bad rumours about the business`,
  actions: [
    action('Not great').do(
      pickOne([
        changeResource('renown', -25),
        changeResourcePercentage('renown', -0.05),
      ]),
    ).log('An angry customers spreads nasty rumours about your and your business'),
  ],
});

export const customerDemandsRecompense = createEvent.triggered({
  title: 'Customer insistent',
  getText: _ => `After spending far too much time arguing, you have no choice but to recompense the customer. Sadly,
    it comes out of your own pocket`,
  actions: [
    action('You grumble but you pay').do(
      pickOne([
        changeResource('coin', -25),
        changeResourcePercentage('coin', -0.05),
      ]),
    ).log('You are forced to reimburse a customer out of your own pocket'),
  ],
});

export const customerWinsFight = createEvent.triggered({
  title: 'Beaten up by customer',
  getText: _ => `The customer attacks you viciously, and seems to assume every fault they have with the product is
    your fault, personally`,
  actions: [
    action('Not the face!').do(
      pickOne([
        changeStat('physical', - 1),
        changeStat('charm', -1),
      ]),
    ).log('You are quite savagely beaten the a customer of your business'),
  ],
});

export const customerLosesFight = createEvent.triggered({
  title: 'Customer "pacified"',
  getText: _ => `You easily calm down the customer using a mace you keep down the counter. Word spreads about how you
    threw them out on the street`,
  actions: [
    action('And they say retail is easy').changeResource('renown', 50).log(
      'You deal with a difficult customer, though less than elegantly',
    ),
  ],
});

export const customerAttacks = createEvent.triggered({
  title: 'Customer starts a fight',
  getText: _ => `Your words of explanation seem to only make them more angry. After a few tense minutes, they snap and
    actually charge at you with an improvised club`,
  actions: [
    action('Defend myself').do(
      triggerEvent(customerWinsFight)
        .orTrigger(customerLosesFight)
          .multiplyByFactor(2, _ => _.character.physical >= 4)
          .multiplyByFactor(2, _ => _.character.physical >= 6)
          .multiplyByFactor(2, _ => _.character.physical >= 8),
    ),
  ],
});

export const customerComplains = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.character.profession === Profession.Trader,
  title: 'Angry customer',
  getText: _ => `Your job is not exactly to make people happy, but very often you do seem to make people mad.
    An angered customer goes into your place of business and shouts about an item you sold them`,
  actions: [
    action('Try to handle them').do(
      triggerEvent(customerMakesNewPurchase).multiplyByFactor(2, _ => _.character.charm >= 6).multiplyByFactor(2, _ => _.character.intelligence >= 6)
        .orTrigger(customerLeavesAngry).withWeight(2)
        .orTrigger(customerDemandsRecompense)
        .orTrigger(customerAttacks).onlyWhen(_ => _.character.physical < 6),
    ),
  ],
});

export const creativeBookkeeping = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.character.profession === Profession.Trader
    && _.character.professionLevel! >= ProfessionLevel.Medium
    && (_.character.intelligence >= 5 || _.character.education >= 5),
  title: 'Creative bookkeeping',
  getText: _ => `Looking at the books of your business, you notice that you might be able to pull in a lot of coin
    if you just engaged in some creative bookkeeping`,
  actions: [
    action('Why not?').do(
      pickOne([
        changeResource('coin', 100),
        changeResourcePercentage('coin', 0.1),
      ]),
    ).and(setCharacterFlag('criminalActivity')).log('You figure out a way for more money to end in your pockets, but it is not exactly legal'),
    action('No, follow the laws'),
  ],
});

export const businessSuffersBadEconomy = createEvent.regular({
  meanTimeToHappen: 30 * 365,
  condition: _ => _.character.profession === Profession.Trader
    && _.character.professionLevel === ProfessionLevel.Leadership
    && (_.worldFlags.tradeDisrupted! || _.town.prosperity < Prosperity.Average),
  title: 'Business suffers',
  getText: _ => `Conditions have been far less than ideal for trading recently, and the loss your business has been
    suffering recently started coming out of your own pockets`,
  actions: [
    action('Unpleasant').resourceLosePercentage('coin', 15).log(
      'Trading has taken a significant hit recently, and the loss comes out of your own pockets',
    ),
  ],
});

enum RetinueSize {
  Single,
  Tiny,
  Small,
  Medium,
  Large,
  Huge,
}

enum Route {
  Sea,
  Road,
  Desert,
  Jungle,
}

const RETINUE_SIZE_KEY = 'retinueSize';
const ROUTE_KEY = 'expeditionRoute';

const retinueDescription: Record<RetinueSize, string> = {
  [RetinueSize.Single]: 'only you',
  [RetinueSize.Tiny]: 'you and a handful of followers',
  [RetinueSize.Small]: 'a small group of people',
  [RetinueSize.Medium]: 'a well-rounded group of individuals',
  [RetinueSize.Large]: 'a large group of people, with varying skills',
  [RetinueSize.Huge]: 'a huge number of individuals, from all walks of life',
}

const routeDescription: Record<Route, string> = {
  [Route.Sea]: 'sailing the seas',
  [Route.Road]: 'on the roads',
  [Route.Desert]: 'in the dry desert',
  [Route.Jungle]: 'in a thick jungle',
}

const routeAttacker: Record<Route, string> = {
  [Route.Sea]: 'pirates',
  [Route.Road]: 'bandits',
  [Route.Desert]: 'desert tribesmen',
  [Route.Jungle]: 'tribes living deep in the jungle',
};

const routeBadWeather: Record<Route, string> = {
  [Route.Sea]: 'heavy storms and winds',
  [Route.Road]: 'a terrible thunderstorm',
  [Route.Desert]: 'heavy sandstorms',
  [Route.Jungle]: 'heavy rainy season'
};

const routeTransport: Record<Route, string> = {
  [Route.Sea]: 'a ship',
  [Route.Road]: 'a cart with its oxen',
  [Route.Desert]: 'several camels',
  [Route.Jungle]: 'several porters carrying your equipment'
};

const routeTradePartner: Record<Route, string> = {
  [Route.Sea]: 'a rich island housing a trading nexus',
  [Route.Road]: 'a bustling city with much to trade',
  [Route.Desert]: 'a tribe of masterful artisans in the desert',
  [Route.Jungle]: 'jungle tribes who value cloth more than gems'
};

const routeDisaster: Record<Route, string> = {
  [Route.Sea]: 'you are attacked by a kraken from the depths',
  [Route.Road]: 'a local army sends an entire contingent to harry you and steal from you',
  [Route.Desert]: 'cannibal tribesmen attack you from the forests, picking you off one by one and using devious poisons',
  [Route.Jungle]: 'a desert spirit attacks you, followed by many desert dweller thralls'
};

const getRetinueSize = (state: IGameState) => parseInt(String(getTmp(RETINUE_SIZE_KEY, RetinueSize.Single)(state)), 10) as RetinueSize;
const growRetinueSize = (_: IGameState) => setTmp(RETINUE_SIZE_KEY, Math.min(RetinueSize.Huge, getRetinueSize(_) + 1))(_);
const shrinkRetinueSize = (_: IGameState) => setTmp(RETINUE_SIZE_KEY, Math.max(RetinueSize.Single, getRetinueSize(_) - 1))(_);
const clearTripData = compose(
  removeTmp(RETINUE_SIZE_KEY),
  removeTmp(ROUTE_KEY),
  setCharacterFlag('onMerchantAdventure', false),
  setCharacterFlag('preparingMerchantAdventure', false),
);
const concludeMerchantAdventure = (_: IGameState) => {
  const factor = getRetinueSize(_) + 1;
  return compose(
    changeResource('renown', 75 * factor),
    changeResource('coin', 75 * factor),
    clearTripData,
  )(_);
};
const describeRetinue = (_: IGameState) => retinueDescription[getRetinueSize(_)];
const getRoute = (state: IGameState) => parseInt(String(getTmp(ROUTE_KEY, Route.Road)(state)), 10) as Route;
const hasRoute = hasTmp(ROUTE_KEY);
const setRoute = (route: Route) => setTmp(ROUTE_KEY, route);
const describeRoute = (_: IGameState) => routeDescription[getRoute(_)];
const describeAttacker = (_: IGameState) => routeAttacker[getRoute(_)];
const describeBadWeather = (_: IGameState) => routeBadWeather[getRoute(_)];
const describeTransport = (_: IGameState) => routeTransport[getRoute(_)];
const describeTradingPartner = (_: IGameState) => routeTradePartner[getRoute(_)];
const describeDisaster = (_: IGameState) => routeDisaster[getRoute(_)];

// Building up the adventure
export const preparingMerchantAdventure = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.character.profession === Profession.Trader
    && _.character.professionLevel! === ProfessionLevel.Leadership
    && !_.characterFlags.preparingMerchantAdventure
    && !_.characterFlags.onMerchantAdventure,
  title: 'Merchant adventure',
  getText: `Though you are making a pretty penny in town, you are starting considering going on a business voyage, or rather a merchant
    adventure, trying to discover new places to trade with, and new resources to trade. It could bring you wealth and fame, as well as
    business contacts, but it could also be risky. Preparing it will take some time, to make a plan, to gather the followers and resources...`,
  actions: [
    action('Starting preparing').do(clearTripData).and(setCharacterFlag('preparingMerchantAdventure')).log('You start preparing for a merchant adventure'),
    action('It sounds too risky').log('You stay at home, preferring not to go on a merchant voyage'),
  ],
});

export const startMerchantAdventure = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.preparingMerchantAdventure!,
  title: 'Set out?',
  getText: _ => `You have spent some time preparing for your merchant adventure. Your group now consists of ${describeRetinue(_)}.
    Are you ready to set out?`,
  actions: [
    action('Let us go!').and(setCharacterFlag('preparingMerchantAdventure', false)).and(setCharacterFlag('onMerchantAdventure')).log(
      'You set out on your merchant adventure',
    ),
    action('Keep preparing').when(_ => getRetinueSize(_) < RetinueSize.Huge).log('You continue preparing for your merchant adventure'),
    action('Call it all out').do(setCharacterFlag('preparingMerchantAdventure', false)).log(
      'You decide to call of the merchant adventure, despite everything you have invested in it',
    ),
  ],
});

export const canGrowRetinueSize = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.characterFlags.preparingMerchantAdventure!,
  title: 'Merchant adventure recruitment',
  getText: _ => `You have a chance to grow your retinue of followers, as to round up the skills that might be needed for this quest,
    as well as have safety in numbers. It currently consists of ${describeRetinue(_)}. How will you proceed?`,
  actions: [
    action('Pay people to sign up').spendResource('coin', 100).and(growRetinueSize).log('You pay some people in town to join your merchant adventure'),
    action('Use my fame to convince them to join').spendResource('renown', 100).and(growRetinueSize).log('Your fame draws more people to your merchant adventure'),
    action('Time to set out').and(setCharacterFlag('preparingMerchantAdventure', false)).and(setCharacterFlag('onMerchantAdventure')).log(
      'You set out on your merchant adventure',
    ),
    action('Call it all off').do(setCharacterFlag('preparingMerchantAdventure', false)).log(
      'You decide to call of the merchant adventure, despite everything you have invested in it',
    ),
  ],
});

export const retinueSizeShrinks = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.preparingMerchantAdventure!
    && (_.town.size < Size.Average || _.worldFlags.sickness! || _.worldFlags.famine! || _.resources.renown < 500),
  title: 'Recruits dry up',
  getText: `Some of the people who indicated that they would join your merchant adventure seem to have given the idea up`,
  actions: [
    action(`After all I've done?`).do(shrinkRetinueSize).log('Some of the people who pledged to your cause now decide to abandon it'),
  ],
});

export const adventurersJoinMerchantAdventure = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.preparingMerchantAdventure! && _.worldFlags.adventurers!,
  title: 'Adventurers offer aid',
  getText: _ => `A group of adventurer who find themselves in the area have taken an interest in your merchant adventure, hearing of it in
    the tavern. They offer to join the group, which currently consists of ${describeRetinue(_)}`,
  actions: [
    action('Accept their aid').do(growRetinueSize, growRetinueSize).and(setWorldFlag('adventurers', false)).log('A group of adventurers joins your cause'),
    action('I do not need them').log('You did not accept a group of adventurers into your planned expedition'),
  ],
});

// End the adventure
export const endMerchantAdventure = createEvent.triggered({
  title: 'Adventure concludes!',
  getText: _ => {
    if (getRetinueSize(_) === RetinueSize.Single) {
      return `You return from the trip alone, not carrying much from the tip, but at least having lived an adventure`;
    } else if (getRetinueSize(_) < RetinueSize.Medium) {
      return `You return from the trip with a small group of people. It was not a glorious expedition, but there was still wealth and renown to speak of`;
    } else if (getRetinueSize(_) < RetinueSize.Huge) {
      return `You return with many people behind you, carrying gold and telling exciting tales. This was a glorious achievement`;
    } else {
      return `You have returned followed by a veritable army carrying great wealth and stories of exotic lands. You will be famed for this`;
    }
  },
  actions: [
    action('This adventure ends').do(concludeMerchantAdventure).log(`You return from your merchant adventure, having lived to tell of it`),
  ],
});

// Merchant adventure
export const pickRoute = createEvent.regular({
  meanTimeToHappen: 7,
  condition: _ => _.characterFlags.onMerchantAdventure! && !hasRoute(_),
  title: 'Which path to follow',
  getText: `You find yourself with two possible routes to follow. Which one will bring you fame and wealth?`,
  actions: [
    action('Follow the road').do(setRoute(Route.Road)).log('You follow the established trade routes on land'),
    action('Go by sea').do(setRoute(Route.Sea)).log('You take the sea route'),
  ],
});

// General
export const diseaseStrikesAdventure = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) > RetinueSize.Single,
  title: 'Disease!',
  getText: _ => `More and more of your group have been getting sick. Your party dwindles in size, no longer containing ${describeRetinue(_)}`,
  actions: [
    action('Difficult times').and(shrinkRetinueSize).log('Some of your group perish due to disease'),
    action('Let us turn back home').and(shrinkRetinueSize).and(triggerEvent(endMerchantAdventure)),
  ],
});

export const attackedAdventure = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) > RetinueSize.Single,
  title: 'Attacked!',
  getText: _ => `While ${describeRoute(_)}, your party is attacked by ${describeAttacker(_)}. You manage to fight them off, but not without
    loss of life. Your party is no longer is no longer ${describeRetinue(_)}`,
  actions: [
    action('Difficult times').and(shrinkRetinueSize).log('Some of your group perish in an attack'),
    action('Let us turn back home').and(shrinkRetinueSize).and(triggerEvent(endMerchantAdventure)),
  ],
});

export const badWeatherAdventure = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) > RetinueSize.Single,
  title: 'Storms!',
  getText: _ => `While ${describeRoute(_)}, your party suffers ${describeBadWeather(_)}. It passes after a while, but not without
    loss of life. Your party is no longer is no longer ${describeRetinue(_)}`,
  actions: [
    action('Difficult times').and(shrinkRetinueSize).log('Some of your group perish in terrible weather'),
    action('Let us turn back home').and(shrinkRetinueSize).and(triggerEvent(endMerchantAdventure)),
  ],
});

export const transportLostAdventure = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) > RetinueSize.Single,
  title: 'Lost!',
  getText: _ => `While ${describeRoute(_)}, your party separates. Once you have reunited, you find that you have lost ${describeTransport(_)}.
    Your merry band is no longer ${describeRetinue(_)}`,
  actions: [
    action('Difficult times').and(shrinkRetinueSize).log('Some of your group is lost in the area'),
    action('Let us turn back home').and(shrinkRetinueSize).and(triggerEvent(endMerchantAdventure)),
  ],
});

export const disasterAdventure = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) > RetinueSize.Single,
  title: 'Disaster!',
  getText: _ => `While ${describeRoute(_)}, ${describeDisaster(_)}. Not everybody is slain, but you lose many people, as well as having to
    leave behind large amounts of coin and food`,
  actions: [
    action('Truly horrible').and(shrinkRetinueSize, shrinkRetinueSize)
      .changeResource('coin', -inIntRange(50, 300))
      .changeResource('food', -inIntRange(50, 300))
      .log('A disaster strikes your group, resulting in great loses'),
    action('Let us turn back home')
      .and(shrinkRetinueSize, shrinkRetinueSize)
      .changeResource('coin', -inIntRange(50, 300))
      .changeResource('food', -inIntRange(50, 300))
      .and(triggerEvent(endMerchantAdventure)),
  ],
});

export const tradingPartnerDiscoveredAdventure = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.onMerchantAdventure!,
  title: 'Trading Partner!',
  getText: _ => `While ${describeRoute(_)}, you find yourself discovering ${describeTradingPartner(_)}. You make a tidy profit
    there.`,
  actions: [
    action('Adventure paying off').changeResource('coin', inIntRange(10, 300)).log('You make a tidy profit trading'),
    action('Let us turn back home').changeResource('coin', inIntRange(10, 300)).and(triggerEvent(endMerchantAdventure)),
  ],
});

export const largeFoodStoresDiscovered = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.onMerchantAdventure!,
  title: 'Trading Partner!',
  getText: _ => `While ${describeRoute(_)}, you find yourself discovering ${describeTradingPartner(_)}. You acquire large stores
    of food from them`,
  actions: [
    action('Adventure paying off').changeResource('food', inIntRange(100, 300)).log('You will eat well, after trading for large amounts of food'),
    action('Let us turn back home').changeResource('food', inIntRange(10, 300)).and(triggerEvent(endMerchantAdventure)),
  ],
});

export const newLandsDiscovered = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.characterFlags.onMerchantAdventure!,
  title: 'New Cultures!',
  getText: _ => `While ${describeRoute(_)}, you discover queer new lands, with unusual customs and knowledge unknown in your
    lands. Telling stories of this will increase your renown`,
  actions: [
    action('Adventure paying off').changeResource('renown', inIntRange(10, 300)).log('You are gaining fame as an explorer'),
    action('Let us turn back home').changeResource('renown', inIntRange(10, 300)).and(triggerEvent(endMerchantAdventure)),
  ],
});

export const localsJoinAdventure = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) < RetinueSize.Huge,
  title: 'Recruits!',
  getText: _ => `As you travel, you encounter a group of locals who seem eager to join your merchant adventure,
    to share in the riches and fame. If they join, your group will grow past ${describeRetinue(_)}`,
  actions: [
    action('Come with us!').and(growRetinueSize).log('Some locals join your adventure'),
    action('We are enough'),
  ],
});

export const hireMoreMercenaries = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) < RetinueSize.Huge,
  title: 'Mercenaries!',
  getText: _ => `As you travel, you encounter a group of mercenaries who would be willig to join your merchant adventure,
    if you are willing to pay their fee. If they join, your group will grow past ${describeRetinue(_)}`,
  actions: [
    action('Hire them!').spendResource('coin', 150).and(growRetinueSize).log('You hire some mercenaries to bolster your numbers'),
    action('We are enough'),
  ],
});

export const deathOnTheTrip = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRetinueSize(_) === RetinueSize.Single,
  title: 'Death!',
  getText: _ => `Left alone ${describeRoute(_)}, you find your health slowly failing and every day becoming harder and harder.
    With nobody to help you out of it, you are feeling you life drain out of you`,
  actions: [
    action('Remember me!').do(clearTripData).and(triggerEvent(death)).log('Death finds you on your merchant adventure'),
  ]
});

export const expeditionVanishes = createEvent.regular({
  meanTimeToHappen: 12 * 365,
  condition: _ => _.characterFlags.onMerchantAdventure!,
  title: 'Expedition vanishes',
  getText: _ => `Your expedition was last seen several days ago, ${describeRoute(_)}. After that, you have all vanished
    without a trace. Nobody knows what happened`,
  actions: [
    action('And so my story ends').and(triggerEvent(death)).log('The entire trading expedition vanishes out there'),
  ],
});

export const turnsToSea = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRoute(_) !== Route.Sea,
  title: 'The sea awaits!',
  getText: _ => `Your advance ${describeRoute(_)} goes no further, and you find yourself facing the sea. Will you acquire ships and continue?`,
  actions: [
    action('The adventure continues').spendResource('coin', 100).and(setRoute(Route.Sea)).log('Your journey continues on the seas'),
    action('Let us turn back home').and(triggerEvent(endMerchantAdventure)),
  ],
});

export const turnsToDesert = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRoute(_) !== Route.Desert,
  title: 'The hot deserts!',
  getText: _ => `Your advance ${describeRoute(_)} goes no further, and you find yourself before a vast desert. Will you buy camels and continue?`,
  actions: [
    action('The adventure continues').spendResource('coin', 100).and(setRoute(Route.Desert)).log('Your journey continues through the desert'),
    action('Let us turn back home').and(triggerEvent(endMerchantAdventure)),
  ],
});

export const turnsToJungle = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRoute(_) !== Route.Jungle,
  title: 'Thick jungle!',
  getText: _ => `Your advance ${describeRoute(_)} goes no further, and you find yourself on the edge of a thick jungle. Will you find local porters and continue?`,
  actions: [
    action('The adventure continues').spendResource('coin', 100).and(setRoute(Route.Jungle)).log('Your journey continues into the jungle'),
    action('Let us turn back home').and(triggerEvent(endMerchantAdventure)),
  ],
});

export const turnsToRoad = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: _ => _.characterFlags.onMerchantAdventure! && getRoute(_) !== Route.Road,
  title: 'A road before you!',
  getText: _ => `Your advance ${describeRoute(_)} goes no further, and you find yourself on a large trading road. Will you purchase carts and continue?`,
  actions: [
    action('The adventure continues').spendResource('coin', 100).and(setRoute(Route.Road)).log('Your journey continues on the roads'),
    action('Let us turn back home').and(triggerEvent(endMerchantAdventure)),
  ],
});

import { eventCreator } from 'utils/events';
import { Profession, ProfessionLevel, Prosperity } from 'types/state';
import { compose } from 'utils/functional';
import { changeStat } from 'utils/person';
import { notify } from 'utils/message';
import { triggerEvent } from 'utils/eventChain';
import { changeResource, changeResourcePercentage } from 'utils/resources';
import { pickOne } from 'utils/random';
import { setCharacterFlag } from 'utils/setFlag';


const TRADER_EVENT_PREFIX = 34_000;

const createEvent = eventCreator(TRADER_EVENT_PREFIX);

export const charmImproved = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.character.profession === Profession.Trader && _.character.charm < 6,
  title: 'Silver tongue',
  getText: _ => `Your job often involves... describing things in the best possible light. You have
    learned a lot about dealing with people`,
  actions: [
    {
      text: 'I do talk smoothly',
      perform: compose(
        changeStat('charm', 1),
        notify('You have learned how to handle people better'),
      ),
    },
  ],
});

export const customerMakesNewPurchase = createEvent.triggered({
  title: 'Customer charmed',
  getText: _ => `You convince the customer that they were wrong, and that they should make an entirely new purchase as a way
    of getting what they want. They seem to be taken by your explanation`,
  actions: [
    {
      text: 'A bonus for me',
      perform: compose(
        changeResource('coin', 25),
        notify('You manage to charm an angry customer into one ready to make another purchase'),
      ),
    },
  ],
});

export const customerLeavesAngry = createEvent.triggered({
  title: 'Angry customer',
  getText: _ => `The customer has an angry discussion with you, but finally leaves dissatisfied. You fear, however, that they
    will spread bad rumours about the business`,
  actions: [
    {
      text: 'Not great',
      perform: compose(
        pickOne([
          changeResource('renown', -25),
          changeResourcePercentage('renown', -0.05),
        ]),
        notify('An angry customers spreads nasty rumours about your and your business'),
      ),
    },
  ],
});

export const customerDemandsRecompense = createEvent.triggered({
  title: 'Customer insistent',
  getText: _ => `After spending far too much time arguing, you have no choice but to recompense the customer. Sadly,
    it comes out of your own pocket`,
  actions: [
    {
      text: 'You grumble but you pay',
      perform: compose(
        pickOne([
          changeResource('coin', -25),
          changeResourcePercentage('coin', -0.05),
        ]),
        notify('You are forced to reimburse a customer out of your own pocket'),
      ),
    },
  ],
});

export const customerWinsFight = createEvent.triggered({
  title: 'Beaten up by customer',
  getText: _ => `The customer attacks you viciously, and seems to assume every fault they have with the product is
    your fault, personally`,
  actions: [
    {
      text: 'Not the face!',
      perform: compose(
        pickOne([
          changeStat('physical', - 1),
          changeStat('charm', -1),
        ]),
        notify('You are quite savagely beaten the a customer of your business'),
      ),
    },
  ],
});

export const customerLosesFight = createEvent.triggered({
  title: 'Customer "pacified"',
  getText: _ => `You easily calm down the customer using a mace you keep down the counter. Word spreads about how you
    threw them out on the street`,
  actions: [
    {
      text: 'And they say retail is easy',
      perform: compose(
        changeResource('renown', 50),
        notify('You deal with a difficult customer, though less than elegantly'),
      ),
    },
  ],
});

export const customerAttacks = createEvent.triggered({
  title: 'Customer starts a fight',
  getText: _ => `Your words of explanation seem to only make them more angry. After a few tense minutes, they snap and
    actually charge at you with an improvised club`,
  actions: [
    {
      text: 'Defend myself',
      perform: triggerEvent(customerWinsFight)
        .orTrigger(customerLosesFight)
          .multiplyByFactor(2, _ => _.character.physical >= 4)
          .multiplyByFactor(2, _ => _.character.physical >= 6)
          .multiplyByFactor(2, _ => _.character.physical >= 8)
        .toTransformer(),
    },
  ],
});

export const customerComplains = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.character.profession === Profession.Trader,
  title: 'Angry customer',
  getText: _ => `Your job is not exactly to make people happy, but very often you do seem to make people made.
    An angered customer goes into your place of business and shouts about an item you sold them`,
  actions: [
    {
      text: 'Try to handle them',
      perform: triggerEvent(customerMakesNewPurchase).multiplyByFactor(2, _ => _.character.charm >= 6).multiplyByFactor(2, _ => _.character.intelligence >= 6)
        .orTrigger(customerLeavesAngry).withWeight(2)
        .orTrigger(customerDemandsRecompense)
        .orTrigger(customerAttacks).onlyWhen(_ => _.character.physical < 6)
        .toTransformer(),
    },
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
    {
      text: 'Why not?',
      perform: compose(
        pickOne([
          changeResource('coin', 100),
          changeResourcePercentage('coin', 0.1),
        ]),
        setCharacterFlag('criminalActivity', true),
        notify('You figure out a way for more money to end in your pockets, but it is not exactly legal'),
      ),
    },
    {
      text: 'No, follow the laws',
    },
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
    {
      text: 'Unpleasant',
      perform: compose(
        changeResourcePercentage('coin', -0.15),
        notify('Trading has taken a significant hit recently, and the loss comes out of your own pockets'),
      ),
    },
  ],
});
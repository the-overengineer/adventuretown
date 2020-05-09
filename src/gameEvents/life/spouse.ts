import { eventCreator, action } from 'utils/events';
import { hasLimitedRights } from 'utils/town';
import { ProfessionLevel } from 'types/state';
import { isEmployable, employSpouse, fireSpouse, setSpouseProfessionLevel, removeSpouse } from 'utils/person';
import { changeResource } from 'utils/resources';
import { triggerEvent } from 'utils/eventChain';
import { getAge } from 'utils/time';


const SPOUSE_EVENTS_PREFIX: number = 42_000;

const createEvent = eventCreator(SPOUSE_EVENTS_PREFIX);

export const spouseEmployed = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.relationships.spouse != null && isEmployable(_, _.relationships.spouse!),
  title: 'Spouse finds work',
  getText: `In an effort to help finance the household, your spouse has found work. It is not
    a prestigious position, but it will bring some resources into your home`,
  actions: [
    action('Splendid').do(employSpouse).log('Your spouse has found work'),
  ],
})

export const spouseFired = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.relationships.spouse != null
    && _.relationships.spouse.profession != null
    && _.relationships.spouse.professionLevel === ProfessionLevel.Entry,
  title: 'Spouse fired',
  getText: `Due to either poor performance or workplace politics, your spouse has lost their job
    and cannot help support the family anymore`,
  actions: [
    action('Curses!').do(fireSpouse).log('Your spouse has lost their job'),
  ],
});

export const spousePromoted = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.relationships.spouse != null
    && _.relationships.spouse.profession != null
    && _.relationships.spouse.professionLevel === ProfessionLevel.Entry
    && !hasLimitedRights(_, _.relationships.spouse),
  title: 'Spouse promoted',
  getText: `Either for good work, or due to favouritism, your spouse has been promoted to a more
    responsible position in their workplace. This means that they might start bringing home more coin`,
  actions: [
    action('Well done, my love').do(setSpouseProfessionLevel(ProfessionLevel.Medium)).log(
      `Your spouse has advanced to a more prestigious position`,
    ),
  ],
});

export const spouseDies = createEvent.triggered({
  title: 'Your spouse has died',
  getText: _ => `At the age of ${getAge(_.relationships.spouse!.dayOfBirth, _.daysPassed)}, your spouse ${_.relationships.spouse!.name} has perished.
    The priests will pray for their safe ascent into the halls of the gods`,
  actions: [
    action('Goodbye, my love').do(removeSpouse).log('Your spouse has perished, leaving you alone'),
  ],
})

export const sicknessFullRecovery = createEvent.triggered({
  title: 'Full recovery',
  getText: _ => `You find your spouse, ${_.relationships.spouse!.name}, looking much better in the morning. They seem to have made a recovery`,
  actions: [
    action('Finally!').log('Your spouse has made a full recovery from the sickness'),
    action('Donate to the gods in thanks').when(_ => _.resources.coin >= 10).do(changeResource('coin', -10)).log(
      'Your spouse has recovered from the sickness and made a donation to the gods to thank them',
    ),
  ],
});

export const sickness = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.relationships.spouse != null && (_.relationships.spouse!.physical < 1 || _.worldFlags.sickness!),
  title: 'Sick!',
  getText: `In the morning, you find your spouse in bed, unable to get up. They are pale, sweating, coughing, and speaking
    of a great pain in their chest. They have caught a serious sickness`,
  actions: [
    action('Pay for temple healing')
      .when(_ => _.resources.coin >= 100 && _.worldFlags.temple!)
      .do(changeResource('coin', -100))
      .log('It was expensive, but priests heal your spouse completely with divine magic'),
    action('Buy herbs')
      .when(_ => _.resources.coin >= 25)
      .do(changeResource('coin', -25))
      .and(triggerEvent(spouseDies).orTrigger(sicknessFullRecovery).withWeight(3))
      .log(`You buy herbs, hoping to help your spouse's recovery`),
    action(`"Walk it off, love"`)
      .do(triggerEvent(spouseDies).orTrigger(sicknessFullRecovery)),
  ],
});

export const spouseStarves = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.relationships.spouse != null && _.resources.food === 0 && _.finances.foodExpenses > _.finances.foodIncome,
  title: 'Spouse starves',
  getText: _ => `Your spouse, ${_.relationships.spouse!.name}, has been complaining of hunger for a while now,
    and you noticed that they were as thin as a stick. Still, it did not prepare you for this morning, when you found
    them glassy-eyed and unmoving in your bed, having starved to death`,
  actions: [
    action('Goodbye, my love').do(removeSpouse).log('Being without food for so long, your spouse has starved to death'),
  ],
});

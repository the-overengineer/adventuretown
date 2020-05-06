import { eventCreator } from 'utils/events';
import { hasLimitedRights } from 'utils/town';
import { compose } from 'utils/functional';
import { ProfessionLevel } from 'types/state';
import { isEmployable, employSpouse, fireSpouse, setSpouseProfessionLevel, removeSpouse } from 'utils/person';
import { notify } from 'utils/message';
import { changeResource } from 'utils/resources';
import { triggerEvent } from 'utils/eventChain';
import { getAge } from 'utils/time';


const SPOUSE_EVENTS_PREFIX: number = 42_000;

const createEvent = eventCreator(SPOUSE_EVENTS_PREFIX);

export const spouseEmployed = createEvent.regular({
  meanTimeToHappen: 4 * 30,
  condition: _ => _.relationships.spouse != null && isEmployable(_, _.relationships.spouse!),
  title: 'Spouse finds work',
  getText: _ => `In an effort to help finance the household, your spouse has found work. It is not
    a prestigious position, but it will bring some resources into your home`,
  actions: [
    {
      text: 'Splendid',
      perform: compose(
        employSpouse,
        notify('Your spouse has found work'),
      ),
    },
  ],
})

export const spouseFired = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.relationships.spouse != null
    && _.relationships.spouse.profession != null
    && _.relationships.spouse.professionLevel === ProfessionLevel.Entry,
  title: 'Spouse fired',
  getText: _ => `Due to either poor performance or workplace politics, your spouse has lost their job
    and cannot help support the family anymore`,
  actions: [
    {
      text: 'Curses',
      perform: compose(
        fireSpouse,
        notify('Your spouse has lost their job'),
      ),
    },
  ],
});

export const spousePromoted = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.relationships.spouse != null
    && _.relationships.spouse.profession != null
    && _.relationships.spouse.professionLevel === ProfessionLevel.Entry
    && !hasLimitedRights(_, _.relationships.spouse),
  title: 'Spouse promoted',
  getText: _ => `Either for good work, or due to favouritism, your spouse has been promoted to a more
    responsible position in their workplace. This means that they might start bringing home more coin`,
  actions: [
    {
      text: 'Well done, my love',
      perform: compose(
        setSpouseProfessionLevel(ProfessionLevel.Medium),
        notify('Your spouse has been promoted to a position of some responsibility'),
      ),
    },
  ],
});

export const spouseDies = createEvent.triggered({
  title: 'Your spouse has died',
  getText: _ => `At the age of ${getAge(_.relationships.spouse!.dayOfBirth, _.daysPassed)}, your spouse ${_.relationships.spouse!.name} has perished.
    The priests will pray for their safe ascent into the halls of the gods`,
  actions: [
    {
      text: 'Goodbye, my love',
      perform: compose(
        removeSpouse,
        notify('Your spouse has perished, leaving you alone'),
      ),
    },
  ],
})

export const sicknessFullRecovery = createEvent.triggered({
  title: 'Full recovery',
  getText: _ => `You find your spouse, ${_.relationships.spouse!.name}, looking much better in the morning. They seem to have made a recovery`,
  actions: [
    {
      text: 'Finally!',
      perform: compose(
        notify('Your spouse has made a recovery from the sickness'),
      ),
    },
    {
      condition: _ => _.resources.coin >= 10,
      text: 'Donate to the temple in thanks',
      perform: compose(
        changeResource('coin', -10),
        notify('Your spouse has recovered from the sickness and made a donation to the gods to thank them'),
      ),
    },
  ],
});

export const sickness = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => _.relationships.spouse != null && (_.relationships.spouse!.physical < 1 || _.worldFlags.sickness!),
  title: 'Sick!',
  getText: _ => `In the morning, you find your spouse in bed, unable to get up. They are pale, sweating, coughing, and speaking
    of a great pain in their chest. They have caught a serious sickness`,
  actions: [
    {
      condition: _ => _.resources.coin >= 100,
      text: 'Pay for priests to heal them',
      perform: compose(
        changeResource('coin', -100),
        notify('It was expensive, but priests heal your spouse completely with divine magic'),
      ),
    },
    {
      condition: _ => _.resources.coin >= 25,
      text: 'Buy herbs',
      perform: compose(
        changeResource('coin', -25),
        notify(`You buy herbs, hoping to help your spouse's recovery`),
        triggerEvent(spouseDies)
          .orTrigger(sicknessFullRecovery).withWeight(3)
          .toTransformer(),
      ),
    },
    {
      text: '"Walk it off, love"',
      perform: triggerEvent(spouseDies)
        .orTrigger(sicknessFullRecovery)
        .toTransformer(),
    },
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
    {
      text: 'Goodbye, my love',
      perform: compose(
        removeSpouse,
        notify('Being without food for so long, your spouse has starved to death'),
      ),
    },
  ],
});

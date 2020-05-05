import { eventCreator } from 'utils/events';
import { notify } from 'utils/message';
import { compose } from 'utils/functional';
import { setWorldFlag } from 'utils/setFlag';
import { decreaseFortifications } from 'utils/town';
import { removeRandomChild, removeSpouse, changeStat } from 'utils/person';
import { triggerEvent } from 'utils/eventChain';
import { death } from 'gameEvents/life/general';
import { changeResource } from 'utils/resources';
import { Fortification, Prosperity } from 'types/state';



const ATTACKS_EVENT_PREFIX: number = 72_000;

const createEvent = eventCreator(ATTACKS_EVENT_PREFIX);

export const orcsPushedBack = createEvent.triggered({
  title: 'Orcs pushed back',
  getText: _ => `The town guard and their allies manage to push back the orcs before they are able to do any significant
    damage. There are casualties on both sides, but as the orcs retreat to lick their wounds, you know that they are
    not permanently defeated`,
  actions: [
    {
      text: `We will be ready`,
      perform: notify(`The orcs have been pushed back, but will return`),
    },
  ],
});

export const orcsDefeated = createEvent.triggered({
  title: 'Orcs defeated',
  getText: _ => `The town guard and their allies meet the orcs of the field of battle. The fight is vicious, but in the end
    just a few surviving orcs manage to scatter with their lives. The orcs will not bother the area again`,
  actions: [
    {
      text: 'Good riddance',
      perform: compose(
        setWorldFlag('orcs', false),
        notify('The tribe of orcs that has settled has been defeated and chased out of the lands'),
      ),
    },
  ],
});

export const orcsWreckDefences = createEvent.triggered({
  title: 'Orcs wreck defences',
  getText: _ => `The orcs are pushed back after a difficult fight, but not before they do major damage to your defences. They
    are beyond repair and will need to be rebuilt`,
  actions: [
    {
      text: 'Curses!',
      perform: compose(
        decreaseFortifications,
        notify('The orcs have managed to destroy the city defences, but have been pushed back'),
      ),
    },
  ],
});

export const orcsTakeChild = createEvent.triggered({
  title: `Orcs take child`,
  getText: _ => `The fighting in the town is fierce, but if finally abates. But when you come home, you discover a great tragedy.
    It would seem that the orcs have taken one of your children away, probably to serve as their slave`,
  actions: [
    {
      text: `Not wosstheirname!`,
      perform: compose(
        removeRandomChild,
        notify('The orcs have taken one of your children as captive'),
      ),
    },
  ],
});

export const orcsKillSpouse = createEvent.triggered({
  title: 'Spouse slain',
  getText: _ => `The fighting in the town is fierce, but it finally abates. But when you come home, you discover a great tragedy.
    Your spouse lies on the ground in a pool of blood, slain by the orc attackers`,
  actions: [
    {
      text: `No! My love!`,
      perform: compose(
        removeSpouse,
        notify('The orcs have slain your spouse'),
      ),
    },
  ],
});

export const orcsWoundYou = createEvent.triggered({
  title: 'Wounded by orcs',
  getText: _ => `The fighting in the town is fierce, but it finally abates. When it is all over, you are alive, but you have suffered
    wounds that will stay with you for the rest of your life`,
  actions: [
    {
      text: 'Ouch',
      perform: compose(
        changeStat('physical', -1),
        notify('You have suffered wounds fighting the orc raiders'),
      ),
    },
  ],
});

export const killedSomeOrcs = createEvent.triggered({
  title: 'Orc slayer',
  getText: _ => `You make a good show for yourself in the streets. Though your arm hurts and you have suffered many minor
    wounds by the end of it, you have showed those orcs. The townspeople shower you with praise`,
  actions: [
    {
      text: 'I am the orcslayer',
      perform: compose(
        changeStat('physical', 1),
        changeResource('renown', 50),
        notify('You have made a name for yourself in the fight against the orcs'),
      ),
    },
  ],
});

export const orcsRobYou = createEvent.triggered({
  title: 'Robbed by orcs',
  getText: _ => `The fighting in the streets is fierce, but finally abates. But when you come home, you discover that the orcs
    seem to have been the first. Some of your belongings are missing`,
  actions: [
    {
      text: 'Thieves!',
      perform: compose(
        changeResource('coin', -20),
        changeResource('food', -20),
        notify('You have been robbed by orcs'),
      ),
    },
  ],
});

export const orcsKillYou = createEvent.triggered({
  title: 'Slain by orcs',
  getText: _ => `The orcs are pushing you back, and finally they have you cornered. You think you might hold them off. You are, however,
    unaware of the large bugger behind you who is just about to stick you with a sword`,
  actions: [
    {
      text: 'Arghh',
      perform: triggerEvent(death).toTransformer(),
    },
  ],
});

export const orcsWinRaiding = createEvent.triggered({
  title: `Orcs raid town`,
  getText: _ => `The orc raiders break through into the village, turning around to stealing what they can, and killing those in
    their way. They are in the streets, in the houses, without mercy`,
  actions: [
    {
      text: 'Try to survive',
      perform: triggerEvent(orcsTakeChild).withWeight(2).onlyWhen(_ => _.relationships.children.length > 0)
        .orTrigger(orcsKillSpouse).withWeight(2).onlyWhen(_ => _.relationships.spouse != null)
        .orTrigger(orcsWoundYou).withWeight(4)
        .orTrigger(killedSomeOrcs).withWeight(1).onlyWhen(_ => _.character.physical >= 3).multiplyByFactor(3, _ => _.character.physical >= 6)
        .orTrigger(orcsRobYou).withWeight(4)
        .orTrigger(orcsKillYou).withWeight(1).onlyWhen(_ => _.character.physical < 6)
        .toTransformer(),
    },
  ],
});

export const orcsAttack = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.orcs! && _.town.fortification < Fortification.Walls,
  title: 'Orcs attack!',
  getText: _ => `The tribe of orcs that has settled the area has come in great numbers to attack and pillage the
    settlement. There are... many, more than you thought was possible`,
  actions: [
    {
      condition: _ => _.worldFlags.adventurerKeep! || _.worldFlags.townGuard!,
      text: 'This town has defenders',
      perform: triggerEvent(orcsPushedBack).withWeight(2).multiplyByFactor(2, _ => _.worldFlags.adventurerKeep!)
        .orTrigger(orcsDefeated).withWeight(1).multiplyByFactor(2, _ => _.worldFlags.adventurerKeep!)
        .orTrigger(orcsWreckDefences).withWeight(1).onlyWhen(_ => _.town.fortification > Fortification.None)
        .orTrigger(orcsWinRaiding).withWeight(1).multiplyByFactor(2, _ => _.town.fortification < Fortification.Walls)
        .toTransformer(),
    },
    {
      condition: _ => !_.worldFlags.adventurerKeep && !_.worldFlags.townGuard,
      text: 'We are doomed!',
      perform: triggerEvent(orcsWinRaiding).toTransformer(),
    },
  ],
});

export const orcsSettle = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => !_.worldFlags.orcs
    && _.town.prosperity > Prosperity.Poor
    && _.town.fortification < Fortification.Walls
    && !_.worldFlags.adventurerKeep,
  title: 'Orcs settle',
  getText: _ => `A tribe of orcs settle nearby, sensing the weakness of your settlement and a chance to
    raid. They will surely cause trouble in the future`,
  actions: [
    {
      text: 'We need to do something',
      perform: compose(
        setWorldFlag('orcs', true),
        notify('A tribe of orcs has settled in the vicinity'),
      ),
    },
  ],
});

export const orcsGiveUpNotWorthIt = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.worldFlags.orcs!
    && (_.town.prosperity <= Prosperity.Poor || _.town.fortification >= Fortification.Walls || _.worldFlags.adventurerKeep!),
  title: `Orcs scatter`,
  getText: _ => `The tribe of orcs that has been plaguing the area decide that what they could raid here is just not worth the trouble.
    One day they're here, the next they're gone`,
  actions: [
    {
      text: 'Good riddance',
      perform: compose(
        setWorldFlag('orcs', false),
        notify('The orcs that have been plaguing the area have decided to move on'),
      ),
    },
  ],
});

export const orcsGiveUpRandomly = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.worldFlags.orcs!,
  title: `Orcs migrate`,
  getText: _ => `The tribe of orcs that has been plaguing the area decide that there are richer areas to plunder, and move on.
    On day they're here, the next they're gone`,
  actions: [
    {
      text: 'Good riddance',
      perform: compose(
        setWorldFlag('orcs', false),
        notify('The orcs that have been plaguing the area have decided to move on'),
      ),
    },
  ],
});

import { eventCreator } from 'utils/events';
import { notify } from 'utils/message';
import { compose } from 'utils/functional';
import { setWorldFlag } from 'utils/setFlag';
import { decreaseFortifications } from 'utils/town';
import { removeRandomChild, removeSpouse, changeStat } from 'utils/person';
import { triggerEvent } from 'utils/eventChain';
import { death } from 'gameEvents/life/general';
import { changeResource, changeResourcePercentage } from 'utils/resources';
import { Fortification, Prosperity, Size } from 'types/state';



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
        changeResourcePercentage('coin', -0.4),
        changeResourcePercentage('food', -0.4),
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
  meanTimeToHappen: 5 * 365,
  condition: _ => !_.worldFlags.orcs
    && _.town.prosperity > Prosperity.Poor
    && _.town.fortification < Fortification.Walls,
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

export const goblinsSettle = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => !_.worldFlags.goblins
    && _.town.prosperity > Prosperity.DirtPoor
    && _.town.fortification < Fortification.Walls
    && !_.worldFlags.adventurerKeep!,
  title: 'Goblins settle',
  getText: _ => `A tribe of goblins settle in the vicinity, sensing weakness`,
  actions: [
    {
      text: 'Troubling',
      perform: compose(
        setWorldFlag('goblins', true),
        notify('Some goblins settle in the area'),
      ),
    },
  ],
});

export const goblinsGiveUp = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.goblins!
    && (_.town.prosperity === Prosperity.DirtPoor || _.town.fortification >= Fortification.Palisade || _.worldFlags.adventurerKeep!),
  title: 'Goblins move on',
  getText: _ => `The local tribe of goblins no longer sees raiding your village as something worth the effort, and move on`,
  actions: [
    {
      text: 'Finally!',
      perform: compose(
        setWorldFlag('goblins', false),
        notify('The local tribe of goblins move on from the area'),
      ),
    },
  ],
});

export const goblinsMigrate = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.goblins!,
  title: 'Goblins move on',
  getText: _ => `The local tribe of goblins migrate away from the area, seeking new and exciting places to plunder`,
  actions: [
    {
      text: 'Finally!',
      perform: compose(
        setWorldFlag('goblins', false),
        notify('The local tribe of goblins move on from the area'),
      ),
    },
  ],
});

export const goblinsRaidFood = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.worldFlags.goblins! && _.town.fortification < Fortification.Palisade,
  title: 'Goblins steal food',
  getText: _ => `The goblin tribe raid the town during the night and steal food from the granary. You are affected`,
  actions: [
    {
      text: 'Pests!',
      perform: compose(
        changeResourcePercentage('food', -0.1),
        notify('Goblins raid the local granary, taking some of your food'),
      ),
    },
  ],
});

export const goblinsDestroyProperty = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.worldFlags.goblins! && _.town.fortification < Fortification.Palisade,
  title: 'Goblins destroy property',
  getText: _ => `The goblin tribe raid the town during the night and steal or destroy some of your property`,
  actions: [
    {
      text: 'Pests!',
      perform: compose(
        changeResourcePercentage('coin', -0.1),
        notify('Goblins raid the town, stealing or destroying some of your property'),
      ),
    },
  ],
});

export const goblinCritiquesAppearance = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.goblins! && _.town.fortification < Fortification.Palisade,
  title: 'Harsh words',
  getText: _ => `You are minding your own business when you encounter a goblin raiding party.
    They do not attack you, but one of them says some really hurtful things about your appearance`,
  actions: [
    {
      text: 'I feel ugly',
      perform: compose(
        changeStat('charm', -1),
        notify('A goblin raiding party says nasty things and hurts your confidence'),
      ),
    },
  ],
});

export const goblinsAttackYou = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.goblins! && _.town.fortification < Fortification.Palisade,
  title: 'Cornered by goblins',
  getText: _ => `You are minding your own business when you encounter a goblin raiding party.
    They spring to attack you, wielding small clubs and branches`,
  actions: [
    {
      condition: _ => _.character.physical >= 4,
      text: 'Chase them away',
      perform: notify('Goblins attack you, but you manage to chase them away'),
    },
    {
      text: 'Take a beating',
      perform: compose(
        changeStat('physical', -1),
        notify('A band of goblins corners you and gives you a nasty beating'),
      ),
    },
  ],
});

export const warStalemate = createEvent.triggered({
  title: 'Stalemate',
  getText: _ => `The spat between the neighbouring groups comes to a stalemate, with neither side managing
    to score a major victory. Both of the groups remain in the area`,
  actions: [
    {
      text: 'A shame',
    },
  ],
});

export const goblinsDefeatOrcs = createEvent.triggered({
  title: 'Goblins win',
  getText: _ => `Though certainly the underdog in this conflict, the goblin tribes manage to score a victory
    and chase the orcs from the area`,
  actions: [
    {
      text: 'Good news!',
      perform: compose(
        setWorldFlag('orcs', false),
        notify('Goblins manage to chase the orcs from the area'),
      ),
    }
  ],
});

export const orcsDefeatGoblins = createEvent.triggered({
  title: 'Orcs win',
  getText: _ => `The orc tribe easily overpowers the goblins, killing many and chasing the survivors from the area.
    The goblins will pester you no more`,
  actions: [
    {
      text: 'Good news!',
      perform: compose(
        setWorldFlag('goblins', false),
        notify('The orcs have chased the local goblin tribe away, winning their war'),
      ),
    },
  ],
});

export const orcGoblinWar = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.goblins! && _.worldFlags.orcs!,
  title: 'Orc-goblin conflicts',
  getText: _ => `The neighbouring orc and goblin tribes are both trying to raid your town, and do not seem to like each others'
    presence. After some tension, they start a war between themselves`,
  actions: [
    {
      text: 'Let us see what happens',
      perform: triggerEvent(goblinsDefeatOrcs)
        .orTrigger(warStalemate).withWeight(3)
        .orTrigger(orcsDefeatGoblins).withWeight(6)
        .toTransformer(),
    },
  ],
});

export const townGuardEstablishedDueToThreat = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => !_.worldFlags.townGuard
    && (_.town.prosperity >= Prosperity.Poor || _.town.size >= Size.Small)
    && (_.worldFlags.goblins! || _.worldFlags.bandits! || _.worldFlags.orcs!),
  title: 'Town guard established',
  getText: _ => `With the looming threat of attackers just beyond the town, the powers that be have
    decided to urgently establish a town guard to protect it`,
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

export const banditsMakeCamp = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => !_.worldFlags.bandits &&
    (_.town.prosperity >= Prosperity.Average || _.town.size >= Size.Average || _.town.fortification <= Fortification.Walls),
  title: 'Bandit presence established',
  getText: _ => `A group of bandits has established their presence close to the town, preying on the people travelling
    in and out of town. They are unlikely to attack the town, but may cause problems`,
  actions: [
    {
      text: `I don't like this`,
      perform: compose(
        setWorldFlag('bandits', true),
        notify('Bandits have set up camp near the town'),
      ),
    },
  ],
});

export const banditsFallApart = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.worldFlags.bandits!,
  title: 'Bandit group falls apart',
  getText: _ => `The bandit group close to the city seems to have fallen due to infighting. They should not longer pose
    a serious threat to ${_.town.name}`,
  actions: [
    {
      text: 'Excellent!',
      perform: compose(
        setWorldFlag('bandits', false),
        notify('The bandit group near the town will no longer be a problem'),
      ),
    },
  ],
});

export const banditsDisruptTrade = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.bandits! && !_.worldFlags.tradeDisrupted,
  title: 'Bandits disrupt trade',
  getText: _ => `The presence and actions of the local bandits has seriously disrupted the trade
    and movement of people in the region. This will have dire financial effects on most people`,
  actions: [
    {
      text: 'This is bad',
      perform: compose(
        setWorldFlag('tradeDisrupted', true),
        notify('The presence of the bandits in the region has seriously disrupted the local economy'),
      ),
    },
  ],
});

export const tradeRecovers = createEvent.regular({
  meanTimeToHappen: 3 * 30,
  condition: _ => !_.worldFlags.bandits && _.worldFlags.tradeDisrupted!,
  title: 'Trade recovers',
  getText: _ => `With the bandits gone, trade and movement of people are slowly recovering`,
  actions: [
    {
      text: 'Finally,',
      perform: compose(
        setWorldFlag('tradeDisrupted', false),
        notify('With the bandits gone, trade if finally back to normal'),
      ),
    },
  ],
});

export const goblinsDefeatBandits = createEvent.triggered({
  title: 'Goblins win',
  getText: _ => `Though certainly the underdog in this conflict, the goblin tribes manage to score a victory
    and chase the bandits from the area`,
  actions: [
    {
      text: 'Good news!',
      perform: compose(
        setWorldFlag('orcs', false),
        notify('Goblins manage to chase the bandits from the area'),
      ),
    }
  ],
});

export const banditsDefeatGoblins = createEvent.triggered({
  title: 'Bandits win',
  getText: _ => `The bandits easily overpowers the goblins, killing many and chasing the survivors from the area.
    The goblins will pester you no more`,
  actions: [
    {
      text: 'Good news!',
      perform: compose(
        setWorldFlag('goblins', false),
        notify('The bandits have chased the local goblin tribe away, winning their war'),
      ),
    },
  ],
});

export const banditGoblinWar = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.goblins! && _.worldFlags.bandits!,
  title: 'Bandit-goblin conflicts',
  getText: _ => `The neighbouring bandit group and goblin tribe are both trying to control the area, and do not seem to like each others'
    presence. After some tension, they start a war between themselves`,
  actions: [
    {
      text: 'Let us see what happens',
      perform: triggerEvent(goblinsDefeatBandits)
        .orTrigger(warStalemate).withWeight(3)
        .orTrigger(banditsDefeatGoblins).withWeight(6)
        .toTransformer(),
    },
  ],
});

export const banditsDefeatOrcs = createEvent.triggered({
  title: 'Bandits win',
  getText: _ => `After heavy fighting, the bandits seem to have won a victory over the orcs and have chased them away from
    the region`,
  actions: [
    {
      text: 'Good news!',
      perform: compose(
        setWorldFlag('orcs', false),
        notify('Bandits manage to chase the orcs from the area'),
      ),
    }
  ],
});

export const orcsDefeatBandits = createEvent.triggered({
  title: 'Orcs win',
  getText: _ => `The orc tribe overpowers the bandits after a prolonged fight, killing many and chasing the survivors from the area.
    The bandits will pester you no more`,
  actions: [
    {
      text: 'Good news!',
      perform: compose(
        setWorldFlag('bandits', false),
        notify('The orcs have chased the bandit gang away, winning their war'),
      ),
    },
  ],
});

export const orcBanditWar = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.worldFlags.bandits! && _.worldFlags.orcs!,
  title: 'Orc-bandit conflicts',
  getText: _ => `The neighbouring orc tribe and bandit gang are both trying to control the area, and do not seem to like each others'
    presence. After some tension, they start a war between themselves`,
  actions: [
    {
      text: 'Let us see what happens',
      perform: triggerEvent(banditsDefeatOrcs).withWeight(3)
        .orTrigger(warStalemate).withWeight(4)
        .orTrigger(orcsDefeatBandits).withWeight(3)
        .toTransformer(),
    },
  ],
});

import { Profession, ProfessionLevel } from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import { changeStat } from 'utils/person';
import { eventCreator, action } from 'utils/events';
import { setCharacterFlag, setWorldFlag } from 'utils/setFlag';
import { death } from 'gameEvents/life/general';

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
    action('Wrongdoers fear my might').do(changeStat('physical', 1)).log(`Your guard duties have made you fitter`),
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
    action('Investigation').when(_ => _.character.intelligence < 4).do(changeStat('intelligence', 1)).log('You learned more about investigation'),
    action('Contacts').when(_ => _.character.charm < 4).do(changeStat('intelligence', 1)).log('You made some new contacts'),
  ],
});

export const briberyAttempt = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.character.profession === Profession.Guard
    && _.character.professionLevel! > ProfessionLevel.Entry
    && _.characterFlags.bribery !== true,
  title: 'Bribe offered',
  getText: _ => `You catch a wealthy miscreant breaking the law. As you have them cornered,
    they offer a toothy smile "Surely some coins can forget that you ever saw me?"`,
  actions: [
    action('Accept the bribe').resourceGainPercentage('coin', 10).and(setCharacterFlag('bribery')).log('You took a bribe to ignore a crime'),
    action('Reject the bribe').gainResource('renown', 25).and(setCharacterFlag('enemiesInHighPlaces')).log('You rejected a bribe, but might have made an enemy'),
  ],
});

export const theftInvestigationDeadEnd = createEvent.triggered({
  title: 'Dead end',
  getText: _ => `Though you have gone through all the evidence and asked all your contacts, you fail to find
    anything conclusive about the theft. In the end, you have to let it go. The city government and the noble
    in particular are not happy`,
  actions: [
    action(`People won't be happy`).resourceLosePercentage('renown', 10).and(setCharacterFlag('enemiesInHighPlaces')).log(
      `Your investigation was a failure, and people are not happy`,
    ),
  ],
});

export const theftInvestigationInsideJob = createEvent.triggered({
  title: 'Inside job',
  getText: _ => `There were odd things about the case, and this morning you finally figure it out! The theft was
    an inside job. The noble's son sold off the warehouse's stock and claimed it was stolen. He is guilty without
    a doubt, but it might be dangerous to have a noble hanged`,
  actions: [
    action('Hang them!').resourceGainPercentage('renown', 10).and(setCharacterFlag('enemiesInHighPlaces')).log(
      `The nobleman's son hangs - you have solved the crime, but the nobleman can't be happy`
    ),
    action('Arrange lighter punishment').spendResource('renown', 100).resourceGainPercentage('renown', 5).log(
      `The nobleman's son is punished, but allowed to live. You are begrudgingly congratulated`,
    ),
    action('Drop the case').resourceLosePercentage('renown', 10).and(setCharacterFlag('friendsInHighPlaces')).log(
      `You drop the case in shame, but have made a friend in high places`,
    ),
  ],
});

export const theftInvestigationThiefCaught = createEvent.triggered({
  title: 'Thief caught',
  getText: _ => `You caught a hardened criminal whom you suspect to be the thief. The evidence points towards them,
    but it is not conclusive and they are professing their innocence. What do you do?`,
  actions: [
    action('Hang the thief').resourceGainPercentage('renown', 5).log('You have caught and hanged a thief, people are pleased'),
    action('Release them and investigate more').do(
      triggerEvent(theftInvestigationDeadEnd).withWeight(2)
        .orTrigger(theftInvestigationInsideJob)
          .onlyWhen(_ => _.character.intelligence >= 4 || _.character.charm >= 4)
          .multiplyByFactor(2, _ => _.character.intelligence >= 6 || _.character.charm >= 6),
    ),
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
    action('Investigate').do(
      triggerEvent(theftInvestigationDeadEnd)
        .orTrigger(theftInvestigationThiefCaught).onlyWhen(_ => _.character.intelligence >= 3 || _.character.charm >= 3)
        .orTrigger(theftInvestigationInsideJob)
          .onlyWhen(_ => _.character.intelligence >= 4 || _.character.charm >= 4)
          .multiplyByFactor(2, _ => _.character.intelligence >= 6 || _.character.charm >= 6),
    ),
    action('Delegate to another').when(_ => _.character.professionLevel === ProfessionLevel.Leadership),
  ],
});

export const blackMarketFound = createEvent.triggered({
  title: 'Black market found',
  getText: `Your investigation has concluded. You observe the black market in the tunnels underneath the city making a livery business.
    You could close it up, of course. Or... you could make a deal`,
  actions: [
    action('Bring in the guards!').do(setWorldFlag('blackMarket', false)).gainResource('renown', 250).log('You shut down the black market'),
    action(`Let's talk price...`).gainResource('coin', 500).log('You take a large sum of money to keep the black market a secret'),
  ],
});

export const trailGoesCold = createEvent.triggered({
  title: 'The trail goes cold',
  getText: `What evidence you gathered was either incorrect or out of date. Or maybe somebody tipped them off? Your investigation
    simply does not pan out. The black market continues operating in the town`,
  actions: [
    action('Better luck next time?'),
  ],
});

export const mercenariesFoughtOff = createEvent.triggered({
  title: 'Mercenaries defeated',
  getText: `The mercenaries are clearly better warriors than you, but an initial burst of ferocity results in a few of their fallen before they
    manage to do much damage to you or your guard unit. It would seem they are not paid enough for this, as they turn tail and run. Breathing heavily,
    you and your guards can advance towards the entrance to the tunnel`,
  actions: [
    action('Let us go in...').and(triggerEvent(blackMarketFound)),
  ],
});

export const escapedFromMercenaries = createEvent.triggered({
  title: 'Escaped!',
  getText: `You are outnumbered, and certainly outmatched. When all is done, you must make a run for it. The few of your guards that still
    stand are cut down in a valiant effort to cover your escape. You are not left unwounded, but you have escaped with your life. You return
    the next day with a larger group of guards, but the inside of the warehouse now has no trace of what you've seen`,
  actions: [
    action('They died for nothing?').do(changeStat('physical', -1)).and(triggerEvent(trailGoesCold)),
  ],
});

export const slainByMercenaries = createEvent.triggered({
  title: 'Defeated',
  getText: `You and your guards put on a valiant show, but you are simply outmatched. These are bloodied warriors, while you are just
    a town guard. They are pushing you further and further back, without hope for escape. Finally, you are on the ground, bloody and surrounded.
    You took a few of them with you, at least. Maybe you could talk your way out of this?`,
  actions: [
    action('Let us negotiate?').do(triggerEvent(death)),
    action('Do it, pigs!').do(triggerEvent(death)),
  ],
});

export const tracingGoodsSuccess = createEvent.triggered({
  title: 'Goods traced',
  getText: `Your deductions have been correct. There is only one trader who might possibly deal in such poisons. You and
    a handful of your trusted guards carefully follow his caravans from the town entrance to a warehouse. You enter it
    with caution, only to see a surprising sight inside - it opens into an underground tunnel, where goods are being
    loaded. Just as you are about to advance, a sudden shout from behind stops you - you turn, drawing your blade, to
    be faced with a handful of mercenaries`,
  actions: [
    action('Stand and fight').do(
      triggerEvent(slainByMercenaries)
        .orTrigger(escapedFromMercenaries).withWeight(3).multiplyByFactor(2, _ => _.character.physical >= 4)
        .orTrigger(mercenariesFoughtOff).withWeight(2).multiplyByFactor(2, _ => _.character.physical >= 6).multiplyByFactor(2, _ => _.character.physical >= 8),
    ),
    action('"Cover my escape!"').do(triggerEvent(escapedFromMercenaries)),
  ],
});

export const tracingGoods = createEvent.triggered({
  title: 'Tracing the poison',
  getText: `You have analysed what you have, in particular the poison. It seems to be exotic, from one region in
    particular. And there cannot be many who would be able to import such good...`,
  actions: [
    action('That would mean...').do(
      triggerEvent(trailGoesCold)
        .orTrigger(tracingGoodsSuccess)
          .multiplyByFactor(2, _ => _.character.intelligence >= 6)
          .multiplyByFactor(2, _ => _.character.education >= 6),
    ),
  ],
});

export const confrontMercenaries = createEvent.triggered({
  title: 'Assassins confronted',
  getText: `You find the only group of mercenaries in town who might have been capable of such an assassination.
    You find a group of them standing guard before an entrance to a sewers tunnel, seemingly guarding it. They see you
    coming and draw their swords and axes`,
  actions: [
    action('Stand and fight').do(
      triggerEvent(slainByMercenaries)
        .orTrigger(escapedFromMercenaries).withWeight(3).multiplyByFactor(2, _ => _.character.physical >= 4)
        .orTrigger(mercenariesFoughtOff).withWeight(2).multiplyByFactor(2, _ => _.character.physical >= 6).multiplyByFactor(2, _ => _.character.physical >= 8),
    ),
    action('"Cover my escape!"').do(triggerEvent(escapedFromMercenaries)),
  ],
});

export const blackMarketTraderKilledByPoison = createEvent.triggered({
  title: 'Poisoned!',
  getText: `The surrounded trader almost immediately surrenders. In fear for their life, they immediately agree to
    tell you everything. They only take a moment to have a drink to calm their nerves. However, a few moments later,
    they start convulsing on the ground, and life soon leaves them. It looks like suicide`,
  actions: [
    action('Look into that poison').do(
      triggerEvent(trailGoesCold)
      .orTrigger(tracingGoods)
        .multiplyByFactor(2, _ => _.character.education >= 6)
        .multiplyByFactor(2, _ => _.character.charm >= 6)
        .multiplyByFactor(2, _ => _.character.intelligence >= 6),
    ),
  ],
});

export const blackMarketTraderKilledByArrow = createEvent.triggered({
  title: 'Assassination!',
  getText: `The trader knows that they have no choice to speak. But before more than a few words can get out of their
    mouth, an arrow flies in through the window, expertly fired, and lodges into their back. They sputter out some
    blood before they go still`,
  actions: [
    action('I think I know these arrows...').when(_ => _.character.education >= 6).do(
      triggerEvent(trailGoesCold).orTrigger(confrontMercenaries).withWeight(4),
    ),
    action('I think I know whom to ask about this').when(_ => _.character.charm >= 6).do(
      triggerEvent(trailGoesCold).orTrigger(confrontMercenaries).withWeight(4),
    ),
    action('My only evidence!').and(triggerEvent(trailGoesCold)),
  ],
});

export const blackMarketTraderTellsMore = createEvent.triggered({
  title: 'Loose tongue',
  getText: `The surrounded trader almost immediately surrenders. In fear for their life, they immediately start babbling, telling you
    all you wanted to know about the black market and more.`,
  actions: [
    action('Follow his instructions').do(triggerEvent(trailGoesCold).orTrigger(blackMarketFound).withWeight(4)),
  ],
});

export const ambushSuccess = createEvent.triggered({
  title: 'Waiting paid off',
  getText: `The trader enters his home in the dead of the night. Before he knows what happened, you have him surrounded. He pleads
    his innocence most unconvincingly. You suspect he might know something...`,
  actions: [
    action('Question him').do(
      triggerEvent(trailGoesCold)
        .orTrigger(blackMarketTraderTellsMore).multiplyByFactor(2, _ => _.character.charm >= 6)
        .orTrigger(blackMarketTraderKilledByArrow)
        .orTrigger(blackMarketTraderKilledByPoison),
    ),
  ],
});

export const askAroundSuccess = createEvent.triggered({
  title: 'Contacts pan out',
  getText: `You have made extensive use of your contacts, and have discovered a man who is rumoured to be a seller of the type of goods you
    found. You have located his home, but he does not seem to be there at the time. You will have to wait`,
  actions: [
    action('Surround the house and wait').do(
      triggerEvent(trailGoesCold)
        .orTrigger(ambushSuccess).multiplyByFactor(2, _ => _.character.intelligence >= 5).multiplyByFactor(1.5, _ => _.character.intelligence >= 8),
    ),
  ],
});

export const goodsFoundInWarehouse = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.worldFlags.blackMarket! && _.character.profession === Profession.Guard && _.character.professionLevel! > ProfessionLevel.Entry,
  title: 'Black market found',
  getText: `One of your underlings urgently leads you to a warehouse they have raided, hoping to find a gambling ring. What he shows you instead
    is worrying. The crates in there contain poisons, illegal drugs, and even specialised weapons. This could be related to the black market
    rumoured to be in town. You should find it`,
  actions: [
    action(`Find it? But I belong to it!`).when(_ => _.characterFlags.criminalActivity!).resourceLosePercentage('renown', 10).log(
      `You cover up the search for the black market, not wanting to disturb your business`,
    ),
    action('Start asking around').when(_ => _.character.charm >= 3).do(
      triggerEvent(trailGoesCold)
        .orTrigger(askAroundSuccess).multiplyByFactor(2, _ => _.character.charm >= 5).multiplyByFactor(3, _ => _.character.charm >= 8),
    ),
    action('Trace the goods').when(_ => _.character.intelligence >= 3).do(
      triggerEvent(trailGoesCold)
        .orTrigger(tracingGoods).multiplyByFactor(2, _ => _.character.intelligence >= 5).multiplyByFactor(3, _ => _.character.intelligence >= 8),
    ),
  ],
});

import { ProfessionLevel, Gender, GenderEquality, ICharacter, Profession } from 'types/state';
import { triggerEvent } from 'utils/eventChain';
import {
  action,
  eventCreator,
  time,
} from 'utils/events';
import {
  employSpouse,
  fireSpouse,
  isEmployable,
  removeSpouse,
  setSpouseProfessionLevel,
  createChild,
  improveSpouseRelationship,
  worsenSpouseRelationship,
  changeStat,
  changeSpouseStat,
} from 'utils/person';
import { changeResource } from 'utils/resources';
import { setCharacterFlag, pregnancyChance, setWorldFlag } from 'utils/setFlag';
import { getAge } from 'utils/time';
import {
  hasLimitedRights,
  isOppressed,
} from 'utils/town';
import { pickOne } from 'utils/random';

const SPOUSE_EVENTS_PREFIX: number = 42_000;

const createEvent = eventCreator(SPOUSE_EVENTS_PREFIX);

export const spouseEmployed = createEvent.regular({
  meanTimeToHappen: time(6, 'months'),
  condition: _ => _.relationships.spouse != null && isEmployable(_, _.relationships.spouse!) && !_.characterFlags.focusFamily,
  title: 'Spouse finds work',
  getText: `In an effort to help finance the household, your spouse has found work. It is not
    a prestigious position, but it will bring some resources into your home`,
  actions: [
    action('Splendid').do(employSpouse()).log('Your spouse has found work'),
  ],
});

export const spouseEmployedAsk = createEvent.regular({
  meanTimeToHappen: time(6, 'months'),
  condition: _ => _.relationships.spouse != null && isEmployable(_, _.relationships.spouse!) && _.characterFlags.focusFamily!,
  title: 'Spouse looking for work',
  getText: `As you have been taking a greater interest in your family recently, your spouse asks you where they should
    seek employment to best help your household`,
  actions: [
    action('At the farm').do(employSpouse(Profession.Farmer)).log('Your spouse has taken your advice and found work at the farm'),
    action('At the bar').do(employSpouse(Profession.BarWorker)).log('Your spouse has taken your advice and found work at the bar'),
    action('At the market').do(employSpouse(Profession.Trader)).log('Your spouse has taken your advice and found work at the market'),
  ],
});

export const spouseFired = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.relationships.spouse != null
    && _.relationships.spouse.profession != null
    && _.relationships.spouse.professionLevel === ProfessionLevel.Entry
    && (_.relationships.spouse.physical < 3 || _.relationships.spouse.intelligence < 3 || _.relationships.spouse.education < 3 || _.relationships.spouse.charm < 3),
  title: 'Spouse fired',
  getText: `Due to either poor performance or workplace politics, your spouse has lost their job
    and cannot help support the family anymore`,
  actions: [
    action('I am sure it is not your fault').do(fireSpouse).do(improveSpouseRelationship).log('Your spouse has lost their job'),
    action('Blame them').when(_ => !isOppressed(_, _.character)).do(worsenSpouseRelationship).log('Your spouse has lost their job, and you chided them for it'),
  ],
});

export const spousePromoted = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.relationships.spouse != null
    && _.relationships.spouse.profession != null
    && _.relationships.spouse.professionLevel === ProfessionLevel.Entry
    && !hasLimitedRights(_, _.relationships.spouse)
    && (_.relationships.spouse.physical > 3 || _.relationships.spouse.intelligence > 3 || _.relationships.spouse.education > 3 || _.relationships.spouse.charm > 3),
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
      .and(improveSpouseRelationship)
      .do(changeResource('coin', -100))
      .log('It was expensive, but priests heal your spouse completely with divine magic'),
    action('Buy herbs')
      .when(_ => _.resources.coin >= 25)
      .do(changeResource('coin', -25))
      .and(triggerEvent(spouseDies).orTrigger(sicknessFullRecovery).withWeight(3))
      .log(`You buy herbs, hoping to help your spouse's recovery`),
    action(`"Walk it off, love"`)
      .do(worsenSpouseRelationship)
      .and(triggerEvent(spouseDies).orTrigger(sicknessFullRecovery)),
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


export const spouseDivorcesYou = createEvent.triggered({
  title: 'Divorced!',
  getText: _ => `Your relationship not being what it once was, your spouse has divorced you`,
  actions: [
    action('I can do better').resourceLosePercentage('renown', 5).and(removeSpouse).log('Your spouse has divorced you, which shames you greatly'),
  ],
});

export const spouseForgivesYou = createEvent.triggered({
  title: 'Forgiven',
  getText: _ => `Your spouse accepts your apology and reiterates their love for you. Maybe things will work out?`,
  actions: [
    action('Maybe they will...'),
  ],
});

export const spouseResentsYourCheating = createEvent.triggered({
  title: 'Anger simmers',
  getText: `Your spouse decides not to divorce you, but you can see that there is resentment under there`,
  actions: [
    action('Better than a divorce?').do(worsenSpouseRelationship).log('You remain married, but your relationship is damaged'),
  ],
});

export const cheatingDiscovered = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.relationships.spouse != null && _.characterFlags.lover! && _.relationships.spouse!.gender !== _.character.gender,
  title: 'Lover discovered',
  getText: _ => `Your spouse has discovered that you have a lover, and seems to be quite furious about it.
    It almost comes to fighting, but it somehow manages to end to breaking furniture and yelling`,
  actions: [
    action('So what? You have no say').when(_ => isOppressed(_, _.relationships.spouse!)).log(
      'Your spouse discovers your cheating, but cannot do anything about it'
    ),
    action('Leave your lover and beg forgiveness').when(_ => !isOppressed(_, _.character)).do(setCharacterFlag('lover', false)).and(
      triggerEvent(spouseDivorcesYou).orTrigger(spouseForgivesYou).orTrigger(spouseResentsYourCheating).withWeight(3),
    ),
    action('I love them, not you').when(_ => !isOppressed(_, _.character)).do(removeSpouse).log(
      'Leave your spouse for your lover',
    ),
  ],
});

export const spouseWantsGift = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.relationships.spouse != null,
  title: 'Spouse desires gift',
  getText: `As you go through the marketplace with your spouse, you notice that they are fascinated by an object they see there. They clearly
    desire it, but do not express it plainly. It does seem a bit expensive, so that might explain it. Maybe they would be glad if you purchased
    it for them?`,
  actions: [
    action('Purchase it').spendResource('coin', 50).and(improveSpouseRelationship).log('You buy your spouse a nice gift, making them happier'),
    action('Do nothing'),
    action('Admonish them for it').do(worsenSpouseRelationship),
  ],
});

export const wifePregnantDiscovered = createEvent.regular({
  meanTimeToHappen: 21,
  condition: _ => _.worldFlags.spousePregnant! && !_.worldFlags.spousePregnantDiscovered,
  title: 'One in the oven',
  getText: _ => `Your wife awaits your return home in the evening with a nervous smile and glinting eyes. "${_.character.name}, my love! We will have a child!"`,
  actions: [
    action('"You must get rid of it"')
      .when(_ => _.town.genderEquality === GenderEquality.FemaleOppression)
      .do(setWorldFlag('spousePregnant', false))
      .and(worsenSpouseRelationship)
      .log('You made your wife abort her pregnancy'),
    action('"I am so happy!"')
      .do(setWorldFlag('spousePregnant', false))
      .and(setWorldFlag('spousePregnantDiscovered'))
      .and(improveSpouseRelationship)
      .log('You happily receive the news that your wife and you have a child on the way'),
  ],
});

export const wifePregnancyFails = createEvent.regular({
  meanTimeToHappen: 12 * 30,
  condition: _ => _.worldFlags.spousePregnant! || _.worldFlags.spousePregnantDiscovered!,
  title: 'Pregnancy lost',
  getText: _ => `"Come, quick!" one of your neighbours seems panicked. You find your wife in tears on a bloody bed. She has lost the child`,
  actions: [
    action('Life is cruel').do(setWorldFlag('spousePregnant', false)).and(setWorldFlag('spousePregnantDiscovered', false)).and(worsenSpouseRelationship).log(
      'Your wife has lost your child during her pregnancy. Your relationship suffers from the loss',
    ),
  ],
});

export const wifeGivesBirth = createEvent.regular({
  meanTimeToHappen: 8 * 30,
  condition: _ => _.worldFlags.spousePregnant! || _.worldFlags.spousePregnantDiscovered!,
  title: 'A child is born!',
  getText: _ => `"Come, quick!" one of your neighbours seems delighted, if nervous.
    You find your wife with a tired smile on her face, holding your new child in her arms.`,
  actions: [
    action('How exciting!')
      .do(setWorldFlag('spousePregnant', false))
      .and(setWorldFlag('spousePregnantDiscovered', false))
      .and(improveSpouseRelationship)
      .and(createChild)
      .log('Your wife has given birth to your child. It brings you closer together'),
  ],
});

export const becomePregnantWithSpouse = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.gender === Gender.Female
    && _.relationships.spouse != null
    && !_.characterFlags.pregnant
    && !_.characterFlags.spouseLove
    && !_.characterFlags.spouseResent
    && getAge(_.character.dayOfBirth, _.daysPassed) < 40,
  title: 'Marital duties',
  getText: `You and your husband make sure to spend some time enjoying each others' company in bed. Not only is it a good way
    to spend time, it might leave you with child as well!`,
  actions: [
    action('Who knows?').do(pregnancyChance('spousePregnant')).log('Beds are not just for sleeping'),
    action('Invent a headache'),
  ],
});

export const spouseBecomesPregnant = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.gender === Gender.Male
    && _.relationships.spouse != null
    && !_.worldFlags.spousePregnantDiscovered
    && !_.characterFlags.spouseLove
    && !_.characterFlags.spouseResent
    && getAge(_.relationships.spouse.dayOfBirth, _.daysPassed) < 40,
  title: 'Marital duties',
  getText: `You and your wife make sure to spend some time enjoying each others' company in bed. Not only is it a good way
    to spend time, it might leave her with child as well!`,
  actions: [
    action('Who knows?').do(pregnancyChance('spousePregnant')).log('Beds are not just for sleeping'),
    action('Invent a headache'),
  ],
});

export const becomePregnantWithSpouseLove = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.character.gender === Gender.Female
    && _.relationships.spouse != null
    && !_.characterFlags.pregnant
    && _.characterFlags.spouseLove!
    && !_.characterFlags.spouseResent
    && getAge(_.character.dayOfBirth, _.daysPassed) < 40,
  title: 'Love and lust',
  getText: `You and your husband are, for the time being, deeply in love and deeply attracted to each other. In fact, you can barely keep your
    hands off of each other, sometimes even in company of others. With any luck, it might result in a pregnancy`,
  actions: [
    action('Who knows?').do(pregnancyChance('spousePregnant')).log('Beds are not just for sleeping'),
    action('Invent a headache').and(worsenSpouseRelationship),

  ],
});

export const spouseBecomesPregnantLove = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.character.gender === Gender.Male
    && _.relationships.spouse != null
    && !_.worldFlags.spousePregnantDiscovered
    && _.characterFlags.spouseLove!
    && !_.characterFlags.spouseResent
    && getAge(_.relationships.spouse.dayOfBirth, _.daysPassed) < 40,
  title: 'Love and lust',
  getText: `You and your wife are, for the time being, deeply in love and deeply attracted to each other. In fact, you can barely keep your
    hands off of each other, sometimes even in company of others. With any luck, it might result in a pregnancy`,
  actions: [
    action('Who knows?').do(pregnancyChance('spousePregnant')).log('Beds are not just for sleeping'),
    action('Invent a headache').and(worsenSpouseRelationship),
  ],
});

export const cheatedOn = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.relationships.spouse != null && _.characterFlags.spouseLove!,
  title: 'Cheated on',
  getText: _ => `You learn through your friends that your spouse has been cheating on you. When you confront them, they tearfully
    admit to doing so and ask for your forgiveness`,
  actions: [
    action('Forgive them').resourceLosePercentage('renown', 10).log('Your spouse cheats and you, but you forgive them fully. It does your prestige little good'),
    action('Resent them').resourceLosePercentage('renown', 5).and(worsenSpouseRelationship).log(
      'You do not quite forgive your spouse for cheating. There is deep resentment there. Still, you remain married',
    ),
    action('Divorce them').resourceLosePercentage('renown', 5).and(removeSpouse).log(
      'You divorce your spouse for cheating on you, but your reputation is still damaged',
    ),
  ],
});

export const loveFades = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.relationships.spouse != null && _.characterFlags.spouseLove!,
  title: 'Love fades',
  getText: `You notice that you and your spouse do not feel the same love you some time ago. You have become familiar to each other,
    and the old fire is gone`,
  actions: [
    action('Should I do something?').do(worsenSpouseRelationship).log(`The relationship between you and your spouse is no longer like it was`),
  ],
});

export const resentmentFades = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.relationships.spouse != null && _.characterFlags.spouseResent!,
  title: 'Forgiveness',
  getText: `You notice that the anger and resentment that was there between you and your spouse for some time is fading away. Old slights
    have been forgotten, and you relationship is closer to a balance again`,
  actions: [
    action('I was sick of anger').do(improveSpouseRelationship).log('The relationships between you and your spouse is no longer bitter'),
  ],
});

export const tooManyChildren = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.relationships.spouse != null && _.relationships.children.length >= 3,
  title: 'Too many children',
  getText: `With so many children in your house there is always screaming, always a mess, always someone wanting your attention.
    This has your spouse and you on the edge, and to top it off, you can rarely both find the time and the energy to... relieve some tension`,
  actions: [
    action('Why did we make this many?').do(worsenSpouseRelationship).log('Your relationship with your spouse tenses with all those children around'),
  ],
});

export const jobImbalance = createEvent.regular({
  meanTimeToHappen: 2 * 365,
  condition: _ => _.relationships.spouse != null
    // Problem arises when one spouse works above-entry, while other does not work. Oppressed individuals are excused, they should stay at home
    && (
      (!isOppressed(_, _.relationships.spouse) && _.character.profession != null && _.character.professionLevel! >= ProfessionLevel.Medium && _.relationships.spouse.profession == null)
    || (!isOppressed(_, _.character) && _.relationships.spouse.profession != null && _.relationships.spouse.professionLevel! >= ProfessionLevel.Medium && _.character.profession == null)
    ),
  title: 'Income imbalance',
  getText: `At first, the situation where one of you works and the other does not did not seem much of a problem. However, recently it has been causing serious
    arguments between you and your spouse`,
  actions: [
    action('Troubling').do(worsenSpouseRelationship).log('With only one spouse working at home, tensions started mounting'),
  ],
});

export const beatenBySpouse = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.relationships.spouse != null
    && hasLimitedRights(_, _.character)
    && _.characterFlags.spouseResent!
    && _.relationships.spouse!.physical > _.character.physical,
  title: 'Spouse beats you',
  getText: `You once found your spouse's strength attractive. You no longer do. With your relationship souring,
    they will occasionally turn it upon you. Your weaker physique leaves you a mere victim, in pain and bruised`,
  actions: [
    action('Ouch').do(changeStat(pickOne(['physical', 'charm']), - 1)).log('Your spouse beats you, leaving you worse for wear'),
  ],
});

export const resentmentSpouseDivorcesYou = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.relationships.spouse != null
    && _.characterFlags.spouseResent!
    && !hasLimitedRights(_, _.relationships.spouse!),
  title: 'Divorce!',
  getText: `You and your spouse have been having troubles, you know that. But you did not expect them to announce that they are divorcing you`,
  actions: [
    action('Were things so bad?').do(removeSpouse).log('Your spouse has divorced you'),
  ],
});

export const resentmentDivorceSpouse = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.relationships.spouse != null
    && _.characterFlags.spouseResent!
    && !hasLimitedRights(_, _.character),
  title: 'Divorce!',
  getText: `You and your spouse have been having troubles, you know that. Recently, you have been seriously considering divorcing them`,
  actions: [
    action('Do it').do(removeSpouse).log('Your spouse has divorced you'),
    action(`Give it one more try`).do(improveSpouseRelationship).log('You chose not to divorce your spouse, but to give it another try'),
  ],
});

export const spouseStrengthIncreases = createEvent.triggered({
  title: 'Spouse becomes fitter',
  getText: `You notice that your spouse has become fitter and stronger recently`,
  actions: [
    action('I do!').do(changeSpouseStat('physical', 1)),
  ],
});

export const spouseStrengthDecreases = createEvent.triggered({
  title: 'Spouse lets themselves go',
  getText: `You notice that your spouse is becoming fatter and less fit recently`,
  actions: [
    action('I noticed').do(changeSpouseStat('physical', -1)),
  ],
});

export const spouseIntelligenceIncreases = createEvent.triggered({
  title: 'Spouse becomes smarter',
  getText: `You notice that your spouse has quite a wit recently. Have they gotten smarter?`,
  actions: [
    action('They must have').do(changeSpouseStat('intelligence', 1)),
  ],
});

export const spouseIntelligenceDecreases = createEvent.triggered({
  title: 'Spouse getting dull',
  getText: `It's as if your spouse is getting duller by the day.`,
  actions: [
    action('Were they always this stupid?').do(changeSpouseStat('intelligence', -1)),
  ],
});

export const spouseEducationIncreases = createEvent.triggered({
  title: 'Erudite spouse',
  getText: `Your spouse has been reading a lot more lately, and it's starting to show`,
  actions: [
    action('They use big words now').do(changeSpouseStat('education', 1)),
  ],
});

export const spouseEducationDecreases = createEvent.triggered({
  title: 'Uneducated spouse',
  getText: `The state of your spouse's education is decaying. Recently you found them struggling with some words on a poster`,
  actions: [
    action('Awkward').do(changeSpouseStat('education', -1)),
  ],
});

export const spouseCharmIncreases = createEvent.triggered({
  title: 'Spouse even more beautiful',
  getText: `You notice that your spouse has been taking more care of themselves recently, and they look more attractive`,
  actions: [
    action('I noticed!').do(changeSpouseStat('charm', 1)),
  ],
});

export const spouseCharmDecreases = createEvent.triggered({
  title: 'Spouse uglier',
  getText: `Your spouse is taking less and less care of themselves, and you don't find them as charming and attractive as you used to`,
  actions: [
    action('Ugh. I noticed.').do(changeSpouseStat('charm', - 1)),
  ],
});

export const spouseStatChangesBackground = createEvent.background({
  meanTimeToHappen: time(1, 'year'),
  condition: _ => _.relationships.spouse != null,
  action: action('').and(
    triggerEvent(spouseStrengthIncreases).onlyWhen(_ => _.relationships.spouse!.physical < 5).multiplyByFactor(3, _ => _.characterFlags.focusFamily!)
      .orTrigger(spouseStrengthDecreases).onlyWhen(_ => _.relationships.spouse!.physical > 0)
      .orTrigger(spouseIntelligenceIncreases).onlyWhen(_ => _.relationships.spouse!.intelligence < 5).multiplyByFactor(3, _ => _.characterFlags.focusFamily!)
      .orTrigger(spouseIntelligenceDecreases).onlyWhen(_ => _.relationships.spouse!.intelligence > 0)
      .orTrigger(spouseEducationIncreases).onlyWhen(_ => _.relationships.spouse!.education < 5).multiplyByFactor(3, _ => _.characterFlags.focusFamily!)
      .orTrigger(spouseEducationDecreases).onlyWhen(_ => _.relationships.spouse!.education > 0)
      .orTrigger(spouseCharmIncreases).onlyWhen(_ => _.relationships.spouse!.charm < 5).multiplyByFactor(3, _ => _.characterFlags.focusFamily!)
      .orTrigger(spouseCharmDecreases).onlyWhen(_ => _.relationships.spouse!.charm > 0),
  ),
});

const statDifference = (first: ICharacter, second: ICharacter): number => {
  const firstStats = first.physical + first.intelligence + first.education + first.charm;
  const secondStats = second.physical + second.intelligence + second.education + second.charm;

  return Math.abs(firstStats - secondStats);
}

export const spouseOnDifferentLevel = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.relationships.spouse != null && statDifference(_.character, _.relationships.spouse!) >= 7,
  title: 'Very different people',
  getText: `For some time now, you have been noticing that your spouse and yourself are people of very different levels of ability.
    Though it was rarely a problem before, you are finding it harder and harder to co-exist as people so different`,
  actions: [
    action('It is hard').do(worsenSpouseRelationship),
  ],
});

export const leadershipSpouseBoost = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.relationships.spouse != null && _.character.profession != null && _.character.professionLevel === ProfessionLevel.Leadership,
  title: 'Power of prestige',
  getText: `Your spouse's relationship with you seems to be better now that you are in a position of leadership. Do they find you more attractive?
    Or is it just that they can stroke their ego by talking about you to the neighbours?`,
  actions: [
    action(`Either way, I won't complain`).do(improveSpouseRelationship),
  ],
});

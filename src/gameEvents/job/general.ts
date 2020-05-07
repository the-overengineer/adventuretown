import {
  IGameState,
  Profession,
  ProfessionLevel,
  IGameAction,
  Prosperity,
  Gender,
  GenderEquality,
  ClassEquality,
} from 'types/state';
import { isOppressed, hasLimitedRights } from 'utils/town';
import { compose } from 'utils/functional';
import { notify } from 'utils/message';
import { changeResource } from 'utils/resources';
import { pregnancyChance } from 'utils/setFlag';
import { triggerEvent } from 'utils/eventChain';
import { startJob, setLevel, removeJob } from 'utils/person';
import { eventCreator } from 'utils/events';

export const JOB_PREFIX = 1_000;

const createEvent = eventCreator(JOB_PREFIX);

const jobActions: IGameAction[] = [
  {
    condition: _ => _.character.profession !== Profession.Farmer,
    text: `I'll work at a farm`,
    perform: compose(
      startJob(Profession.Farmer),
      notify(`Farm work is not easy, but you won't lack for food`),
    ),
  },
  {
    condition: _ => _.town.prosperity > Prosperity.DirtPoor && _.character.profession !== Profession.BarWorker,
    text: `There is work at the bar`,
    perform: compose(
      startJob(Profession.BarWorker),
      notify(`Working at a bar is both lucrative and a good chance to meet people`)
    ),
  },
  {
    condition: _ => _.character.physical >= 3
      && _.worldFlags.townGuard!
      && _.character.profession !== Profession.Guard,
    text: `I am strong, I will guard the town`,
    perform: compose(
      startJob(Profession.Guard),
      notify(`The town guard can always use more warm bodies`),
    ),
  },
  {
    condition: _ =>
      _.town.prosperity >= Prosperity.Decent &&
      _.character.charm >= 3 &&
      !isOppressed(_, _.character)
      && _.character.profession !== Profession.Trader,
    text: 'Trading is the way to go',
    perform: compose(
      startJob(Profession.Trader),
      notify('If you move enough money around, some is bound to end up in your pockets'),
    ),
  },
  {
    condition: _ =>
      _.town.prosperity >= Prosperity.Decent &&
      _.character.charm >= 3 &&
      !hasLimitedRights(_, _.character)
      && _.character.profession !== Profession.Politician,
    text: 'Why honest living? Politics it is!',
    perform: compose(
      startJob(Profession.Politician),
      notify(`You start climbing the ladder of rulership in this city`),
    ),
  },
  {
    text: `I'm fine as is`,
  },
];

export const seekJob = createEvent.regular({
  meanTimeToHappen: 1,
  condition: (state: IGameState) => state.character.profession == null,
  title: 'Looking for a job',
  getText: () => `
    Making a living without work has been very difficult. Maybe it's time
    you found a job and started making an honest wage.

    Of course, not all lines of work might be open to your right now, but
    you can consider those that suit your talents, and change your line of work
    when you have gained experience, or the laws have relaxed.`,
  actions: jobActions,
});

export const changeCurrentJob = createEvent.regular({
  meanTimeToHappen: 9 * 30,
  condition: (state: IGameState) => state.character.professionLevel === ProfessionLevel.Entry,
  title: 'Find a better job',
  getText: (state) => state.character.professionLevel === ProfessionLevel.Entry
    ? `You have been working an entry-level position for some time now. The income is not
      great, the hours are terrible, and don't let me even get started on the boss.

      Maybe it's time you found a job that suited you better?`
    : `Is this job all there is to life? It's not as challenging or interesting as it used
      to be, and there may be lucrative opportunities elsewhere, or at least a change of pace.
      The downside is that you would start at an entry-level position.`,
  actions: jobActions,
});

export const promotedFromEntry = createEvent.regular({
  meanTimeToHappen: 5 * 30,
  condition: (state) => state.character.professionLevel === ProfessionLevel.Entry
    && !isOppressed(state, state.character),
  title: 'Moving up in the world',
  getText: () => `Your good work has been recognised and you have been offered a promotion
    to a more meaningful position! This will mean more income, certainly, but increased
    responsibility.`,
  actions: [
    {
      text: 'Accept, of course',
      perform: compose(
        setLevel(ProfessionLevel.Medium),
        notify(`You're no longer a nobody, but this might mean more work.`),
      ),
    },
    {
      text: 'No, I am happy as is',
      perform: notify('Who needs extra responsibility?'),
    },
  ],
});

export const promotedToLeading = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.character.professionLevel === ProfessionLevel.Medium
    && !hasLimitedRights(_, _.character)
    && (_.character.intelligence >= 5 || _.character.education >= 5 || _.character.charm >= 5),
  title: 'A leading role',
  getText: () => `You have proven yourself to be excellent at your job, or at least making connections that help you look
    as though you are. A new opportunity has opened up for you to take on a leadership role in your business. This will mean
    money and respect, but also a much greater share of personal responsibility and risk.`,
  actions: [
    {
      text: 'Take the job',
      perform: compose(
        setLevel(ProfessionLevel.Leadership),
        notify('You take a leading role in your business'),
      ),
    },
    {
      text: 'It is too much',
    },
  ],
});

export const anythingToKeepTheJobFailure = createEvent.triggered({
  title: 'Scorned',
  getText: _ => `Your employer looks at you with disgust. "You would offer your body for this?
    You disgust me, you ${_.character.gender === Gender.Male ? 'man-whore' : 'slut'}! My decision stands!`,
  actions: [
    {
      text: 'All this for nothing!',
      perform: compose(
        removeJob,
        changeResource('renown', -5),
        notify('Not only did you lose your job, word of your actions got around town'),
      ),
    },
  ]
});

export const anythingToKeepTheJobSuccess = createEvent.triggered({
  title: 'A price to pay',
  getText: _ => `Your employer looks you up and down, and then smiles.
    "Very well, then, that seems fair to me. Meet me in the back room."`,
  actions: [
    {
      text: 'You follow',
      perform: compose(
        pregnancyChance('pregnantLover'),
        notify('You had to offer your body, but you kept your job'),
      ),
    },
    {
      text: 'The job is not worth this',
      perform: compose(
        removeJob,
        notify('You lost your job, but kept your pride'),
      ),
    },
  ],
});

export const doYouKnowWhoIAmFailure = createEvent.triggered({
  title: 'Who are you?',
  getText: _ => `"I don't care who you are. Get out!" your former employer is not impressed, and not open to any further attempts at placating.`,
  actions: [
    {
      text: 'Nothing to do',
      perform: compose(
        removeJob,
        notify(`You've lost your job, but you can always find another`),
      ),
    },
  ],
});

export const doYouKnowWhoIAmSuccess = createEvent.triggered({
  title: 'Too important to fire',
  getText: _ => `"R-right, I'm sorry, I didn't mean that!" your employer stammers nervously as they remember your connections "Of course you can keep the job!"`,
  actions: [
    {
      text: '"I thought as much"',
      perform:  notify(`You have influence in this town, too much influence to be fired just like that`),
    },
  ],
});

export const firedEntry = createEvent.regular({
  meanTimeToHappen: 6 * 30,
  condition: _ => _.character.professionLevel === ProfessionLevel.Entry
    && (isOppressed(_, _.character) || _.character.intelligence < 3 || _.character.education < 3 || _.character.charm < 3),
  title: 'A firing offence',
  getText: _ => isOppressed(_, _.character)
    ? `
    "I'll be honest with you. As a ${_.character.gender === Gender.Male ? 'man' : 'woman'}, you are not fit for this job. Go home and don't come back!".

    Your employer is very direct and does not mince words. Their expression then softens for a moment. "Look, you should get married and have somebody take
    care of you. I'd like to keep you, but you know full well how your gender is. I need people who can actually do the work."`
    : `
    "This is the last time!" your employer shouts, red in the face, as you make a mistake yet another time. "You are fired! Get out of here before I kick you out!"
    `,
  actions: [
    {
      condition: _ => _.resources.coin >= 20,
      text: '"How about you take 20 coins and keep me on?"',
      perform: changeResource('coin', -20),
    },
    {
      condition: _ => _.character.charm > 3,
      text: '"I will do ANYTHING to keep this job"',
      perform: triggerEvent(anythingToKeepTheJobFailure).withWeight(1)
        .orTrigger(anythingToKeepTheJobSuccess).withWeight(2).multiplyByFactor(2, _ => _.character.charm > 5)
        .toTransformer(),
    },
    {
      condition: _ => _.resources.renown >= 50 || _.characterFlags.friendsInHighPlaces!,
      text: '"Fire ME?! Do you know who I am?!"',
      perform: triggerEvent(doYouKnowWhoIAmFailure).withWeight(3)
        .orTrigger(doYouKnowWhoIAmSuccess).withWeight(2)
          .multiplyByFactor(2, _ => _.resources.renown >= 100)
          .multiplyByFactor(2, _ => _.resources.renown >= 250)
          .multiplyByFactor(2, _ => _.characterFlags.friendsInHighPlaces!)
        .toTransformer(),
    },
    {
      text: `I didn't want this job, anyway`,
      perform: compose(
        removeJob,
        notify(`You've lost your job, but you can always find another`),
      ),
    },
  ],
});

export const difficultTrainee = createEvent.regular({
  meanTimeToHappen: 18 * 30,
  condition: _ => _.character.profession! && _.character.professionLevel === ProfessionLevel.Medium,
  title: 'Difficult trainee',
  getText: _ => `You've been assigned with training a new employee at your business. They have shown themselves
    to be incompetent to the extreme, even causing material damage. You'll have to fire them, but it is considered
    a personal failure of yours`,
  actions: [
    {
      text: 'How can they be so stupid?',
      perform: compose(
        changeResource('renown', -10),
        notify('You had to fire a trainee and it reflects poorly on you'),
      ),
    },
  ],
});

export const goodTrainee = createEvent.regular({
  meanTimeToHappen: 24 * 30,
  condition: _ => _.character.profession! && _.character.professionLevel === ProfessionLevel.Medium,
  title: 'Good trainee',
  getText: _ => `You've been assigned with training a new employee at your business. They have shown themselves
    to be amazingly competent, and this will reflect well on you`,
  actions: [
    {
      text: 'Good job!',
      perform: compose(
        changeResource('renown', 10),
        notify('You trained a competent worker, and this reflects well on you'),
      ),
    },
  ],
});

export const difficultJobSuccess = createEvent.triggered({
  title: 'Well-done',
  getText: _ => `You have done your work in a way that hardly anyone can criticise. Your employer is very
    satisfied with your performance`,
  actions: [
    {
      text: 'I knew I could do it',
      perform: compose(
        changeResource('coin', 5),
        changeResource('renown', 15),
        notify('You were praised for your good work'),
      ),
    },
  ],
});

export const difficultJobFailure = createEvent.triggered({
  title: 'Complete failure',
  getText: _ => `You have made a complete hash out of your assigned, and shamed yourself. Worst of all,
    some of the loss is coming out of your pocket`,
  actions: [
    {
      text: 'A honest mistake',
      perform: compose(
        changeResource('coin', -5),
        changeResource('renown', -15),
        notify('You failed miserably at work and were shamed for it'),
      ),
    },
  ],
});

export const difficultJob = createEvent.regular({
  meanTimeToHappen: 24 * 30,
  condition: _ => _.character.profession != null && _.character.professionLevel === ProfessionLevel.Medium,
  title: 'A difficult job',
  getText: _ => `You have been assigned a particularly difficult task. You are not even certain that you are up
    to it. Not only is your reputation on the line, but you might be monetarily rewarded or punished depending
    on your performance`,
  actions: [
    {
      text: 'Get to it',
      perform: triggerEvent(difficultJobSuccess).multiplyByFactor(2, _ => _.character.intelligence > 5).multiplyByFactor(2, _ => _.character.education > 5)
        .orTrigger(difficultJobFailure).multiplyByFactor(2, _ => _.character.intelligence < 2).multiplyByFactor(2, _ => _.character.education < 2)
        .toTransformer(),
    },
    {
      condition: _ => _.character.charm > 5,
      text: 'Weasel out of it',
      perform: notify('You smooth-talked your way out of a difficult task'),
    },
  ],
});

export const businessThrives = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.character.profession != null
  && _.character.professionLevel === ProfessionLevel.Leadership
  && _.character.profession !== Profession.Guard
  && _.character.profession !== Profession.Politician,
  title: 'Business thrives',
  getText: _ => `Your business has been doing very well recently, and you reap the benefits`,
  actions: [
    {
      text: 'I am good at this',
      perform: compose(
        changeResource('coin', 25),
        changeResource('renown', 10),
        notify('You reap the benefits of successfully leading a business'),
      ),
    },
  ],
});

export const businessDoesPoorly = createEvent.regular({
  meanTimeToHappen: 3 * 365,
  condition: _ => _.character.profession != null
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.character.profession !== Profession.Guard
    && _.character.profession !== Profession.Politician,
  title: 'Business does poorly',
  getText: _ => `Your business has been doing very poorly recently, and you pay the price`,
  actions: [
    {
      text: `There is no I in team`,
      perform: compose(
        changeResource('coin', -25),
        changeResource('renown', -10),
        notify('You pay the price of a failing business'),
      ),
    },
  ],
});

export const businessFails = createEvent.regular({
  meanTimeToHappen: 50 * 365,
  condition: _ => _.character.profession != null
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.character.profession !== Profession.Guard
    && _.character.profession !== Profession.Politician,
  title: 'Business collapses',
  getText: _ => `Your business has collapsed entirely and there was nothing you could
    have done about it. You went from having it all to having nothing at all.`,
  actions: [
    {
      text: 'And it was going so well',
      perform: compose(
        removeJob,
        changeResource('renown', -50),
        notify('Your business has collapsed, to your shame and loss'),
      ),
    },
  ],
});

export const expandBusinessFailure = createEvent.triggered({
  title: 'Expansion idea failed',
  getText: _ => `Your idea sounded brilliant on paper, but did not function in the real world.
    You have wasted your money and damaged your reputation`,
  actions: [
    {
      text: 'Curses!',
      perform: compose(
        changeResource('renown', -30),
        notify('You had a business idea and apparently it was terrible'),
      ),
    },
  ],
});

export const expandBusinessSuccess = createEvent.triggered({
  title: 'Business expanded',
  getText: _ => `Your idea worked, and your business has made an expansion, all thanks to your brilliance`,
  actions: [
    {
      text: 'I knew it!',
      perform: compose(
        changeResource('coin', 10),
        changeResource('renown', 30),
        notify('You had a business idea and it worked out well'),
      ),
    },
  ],
});

export const expandBusiness = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.character.profession != null
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.character.profession !== Profession.Guard
    && _.character.profession !== Profession.Politician
    && _.resources.coin >= 30,
  title: 'Expanding the business',
  getText: _ => `You were thinking about how your business was run, and you had an idea on how to expand
    it and maybe grow your profits. It would take some risk and investment, but it might work out`,
  actions: [
    {
      text: 'Take the risk',
      perform: compose(
        changeResource('coin', -30),
        triggerEvent(expandBusinessFailure).withWeight(2)
          .orTrigger(expandBusinessSuccess)
            .multiplyByFactor(1.5, _ => _.character.intelligence > 5)
            .multiplyByFactor(1.5, _ => _.character.education > 5)
            .multiplyByFactor(1.5, _ => _.character.charm > 5)
            .toTransformer(),
      ),
    },
    {
      text: 'Pass on this idea',
    },
  ],
});

export const massFiring = createEvent.regular({
  meanTimeToHappen: 10 * 365,
  condition: _ => _.character.profession != null
    && _.character.professionLevel === ProfessionLevel.Leadership,
  title: 'Mass firings',
  getText: _ => `Due to difficulties in how the business has been doing, you were forced to fire many of
    the people working for you. It has damaged your reputation, but allowed your business to survive without
    having to waste your own coin`,
  actions: [
    {
      text: 'It was a hard decision',
      perform: compose(
        changeResource('renown', -50),
        notify('You have become hated due to having to fire many of your employees'),
      ),
    },
    {
      condition: _ => _.resources.coin >= 100,
      text: 'No, I will take the loss upon me',
      perform: compose(
        changeResource('coin', -100),
        changeResource('renown', 30),
        notify('You paid heavily from your own pockets to keep your employees safe'),
      ),
    },
  ],
});

export const fromBusinessToPolitics = createEvent.regular({
  meanTimeToHappen: 40 * 365,
  condition: _ => _.character.profession != null
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.resources.renown >= 250,
  title: 'Prestigious offer',
  getText: _ => `The way your run your business has drawn attention from the ruling council.
    They have gone as far as to offer you a seat amongst them, though you would have no
    more time for leading your business`,
  actions: [
    {
      text: 'Accept',
      perform: compose(
        startJob(Profession.Politician),
        setLevel(ProfessionLevel.Leadership),
        notify('You have abandoned your business to join the town council'),
      ),
    },
    {
      text: 'I like it where I am',
    },
  ],
});

export const demotedFromLeadershipDueToRights = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.character.profession != null
    && _.character.professionLevel === ProfessionLevel.Leadership
    && hasLimitedRights(_, _.character),
  title: 'Stripped of position',
  getText: _ => `You have been stripped of your position, as due to your social status or gender you are not seen
    as somebody fit to have a leading position in business or society`,
  actions: [
    {
      text: 'Damn this town',
      perform: compose(
        setLevel(ProfessionLevel.Medium),
        notify('You have been stripped of your leadership position due to your standing in society'),
      ),
    },
  ],
});

export const demotedToEntryDueToRights = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.character.profession != null
    && _.character.professionLevel === ProfessionLevel.Medium
    && isOppressed(_, _.character),
  title: 'Stripped of position',
  getText: _ => `You have been stripped of your position and moved to an entry-level one, as due to your social status or gender you are not seen
    as somebody fit to have any responsibility in your line of work`,
  actions: [
    {
      text: 'Damn this town',
      perform: compose(
        setLevel(ProfessionLevel.Entry),
        notify('You have been demoted to the lowest stratum due to discrimination'),
      ),
    },
  ],
});

export const promotedForGenderQuota = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.character.profession != null
    && _.character.profession !== Profession.Politician
    && _.character.professionLevel === ProfessionLevel.Medium
    && _.town.genderEquality === GenderEquality.Equal
    && _.town.equality === ClassEquality.Equal,
  title: 'Promoted due to gender',
  getText: _ => `With the town leaders pushing for equality, they have noticed that there are not enough ${_.character.gender === Gender.Male ? 'men' : 'women'} in
    leadership positions. Therefore, they have taken away the job of your ${_.character.gender === Gender.Male ? 'female' : 'male'} employer and given it
    to you`,
  actions: [
    {
      text: 'Good for me, I guess...',
      perform: compose(
        setLevel(ProfessionLevel.Leadership),
        notify('You have been promoted to a leadership position to fill a gender quota'),
      ),
    },
  ],
});

export const demotedForGenderQuota = createEvent.regular({
  meanTimeToHappen: 5 * 365,
  condition: _ => _.character.profession != null
    && _.character.profession !== Profession.Politician
    && _.character.professionLevel === ProfessionLevel.Leadership
    && _.town.genderEquality === GenderEquality.Equal
    && _.town.equality === ClassEquality.Equal,
  title: 'Promoted due to gender',
  getText: _ => `With the town leaders pushing for equality, they have noticed that there are not enough ${_.character.gender === Gender.Male ? 'women' : 'men'} in
    leadership positions. Therefore, they have taken away your job and given it to you ${_.character.gender === Gender.Male ? 'female' : 'male'} employee`,
  actions: [
    {
      text: 'Is this equality?',
      perform: compose(
        setLevel(ProfessionLevel.Medium),
        notify('You have been demoted from a leadership position to fill a gender quota'),
      ),
    },
  ],
});

export const cheated = createEvent.regular({
  meanTimeToHappen: 365,
  condition: _ => _.character.profession != null && (_.character.intelligence < 2 || _.character.education < 2),
  title: 'Cheated',
  getText: _ => `Shamefully, it took you over a day to realise it, but you have been cheated by a customer, and the difference
    comes out of your own pocket`,
  actions: [
    {
      text: 'Am I that stupid?',
      perform: compose(
        changeResource('coin', -10),
        notify('You were naive at work, and you had to pay the price'),
      ),
    },
  ],
});

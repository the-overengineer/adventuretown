import classNames from 'classnames';
import React from 'react';
import {
  ClassEquality,
  GenderEquality,
  Fortification,
  ITownSettings,
  Prosperity,
  Size,
} from 'types/state';
import styles from './TownDescription.module.css';

interface ITownDescription {
  className?: string;
  town: ITownSettings;
}

export class TownDescription extends React.PureComponent<ITownDescription> {
  public render() {
    const { className, town } = this.props;
    return (
      <div className={classNames(className, styles.TownDescription)}>
        {town.name} is {this.describeSize()}. It is {this.describeFortifications()}.
        The town is {this.describeProsperity()}. The rights of its citizens are {this.describeClassEquality()}.
        As for the sexes, {this.describeGenderEquality()}.
      </div>
    );
  }

  private describeSize = () => {
    const { town } = this.props;

    switch (town.size) {
      case Size.Minuscule: return 'a minuscule village, barely of any importance in the region';
      case Size.Tiny: return 'a lively village with nowhere to go but up';
      case Size.Small: return 'a small town, home to just a few families';
      case Size.Modest: return 'a town of modest size, with guilds and associations starting to form';
      case Size.Average: return 'an average town, with cobbled streets and multiple guilds';
      case Size.Large: return 'a large town, notable in the region for its size and the craftsmanship of its masters';
      case Size.Bustling: return 'a bustling city, probably the largest in the region';
      case Size.Huge: return 'the largest city in the region, maybe in the world, the envy of all';
    }
  }

  private describeFortifications = () => {
    const { town } = this.props;

    switch (town.fortification) {
      case Fortification.None: return 'completely unprotected, left to the mercy of any attacker';
      case Fortification.Ditch: return 'surrounded by a ditch - a decent effort, but small comfort if a serious attack comes';
      case Fortification.Palisade: return 'ringed by a wooden palisade, which might hope to hold out against most attacks';
      case Fortification.Walls: return 'kept safe by stone walls, patrolled by guardsmen';
      case Fortification.MoatAndCastle: return 'protected by a strong moat and castle - it would take an army to siege it';
    }
  }

  private describeProsperity = () => {
    const { town } = this.props;

    switch (town.prosperity) {
      case Prosperity.DirtPoor: return 'dirt poor, with most citizens struggling to find food or a roof to spend the night'
      case Prosperity.Poor: return 'fairly poor, with most having to worry about whether they will have enough to feed their children';
      case Prosperity.Decent: return 'on the rise, financially, with most not having to fret about how to survive the day, but with some way to go';
      case Prosperity.Average: return 'in decent financial state, with all but the lowest strata of society living in relative comfort';
      case Prosperity.WellOff: return 'a bustling economy, where most with the means and rights to start a business can dream of prosperity';
      case Prosperity.Rich: return 'extremely rich, with great stone houses and magnificent temples, a place where dreams come true';
    }
  }

  private describeClassEquality = () => {
    const { town } = this.props;

    switch (town.equality) {
      case ClassEquality.GeneralSlavery:
          return 'non-existant for all but a few, with fellow humans being kept as slaves and the poor having no say in government matters';
      case ClassEquality.IncomeInequality:
        return 'about average for the region. None may be kept as slaves, but if you do not have wealth or status, you have few options in life';
      case ClassEquality.Stratified:
        return 'higher than most in the region, with everybody having equal rights on paper, but the poor having a harder time exercising them';
      case ClassEquality.Equal:
        return 'without equal in the region, with everybody enjoying full rights and responsibilities of citizenship';
    }
  }

  private describeGenderEquality = () => {
    const { town } = this.props;

    switch (town.genderEquality) {
      case GenderEquality.Equal:
        return 'they are fully equal. There is nothing that a woman is allowed to do that a man is not, and vice versa';
      case GenderEquality.FemaleDominance:
        return 'women hold more power in society, but that does not mean men are entirely without rights. Some, however, feel oppressed';
      case GenderEquality.FemaleOppression:
        return 'women are considered the property of their husband or male relatives, and have no rights of their own';
      case GenderEquality.MaleDominance:
        return 'men hold more power in society, but that does not mean women are entirely without rights. Some, however, feel oppressed';
      case GenderEquality.MaleOppression:
        return 'men are considered the property of their wives or female relatives, and have no rights of their own';
    }
  }
}

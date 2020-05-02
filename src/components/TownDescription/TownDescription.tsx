import classNames from 'classnames';
import React from 'react';
import {
  Equality,
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
        The town is {this.describeProsperity()}. The rights of its citizens are {this.describeEquality()}.
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

  private describeEquality = () => {
    const { town } = this.props;

    switch (town.equality) {
      case Equality.GeneralSlavery: return 'non-existant, with fellow humans being kept as slaves an women and the poor having no say';
      case Equality.RacialSlavery: return 'poor, with other races being kept as slaves, and women and the poor having very limited rights';
      case Equality.GenderInequality: return 'not excellent, with everybody being a free citizen, technically, but with women and the poor having very limited rights';
      case Equality.IncomeInequality: return 'about average for the region. The sexes have equal rights, but your political rights depend on your wealth';
      case Equality.Stratified: return 'higher than most in the region, with everybody having equal rights on paper, but the poor having a harder time exercising them';
      case Equality.Equal: return 'without comparison in the region, with everybody enjoying equal rights and responsibilities';
    }
  }
}

import { Button } from 'components/Button/Button';
import { TownDescription } from 'components/TownDescription/TownDescription';
import React from 'react';
import {
  ClassEquality,
  GenderEquality,
  Fortification,
  ITownSettings,
  Prosperity,
  Size,
} from 'types/state';
import { pickOne } from 'utils/random';
import styles from './QuickStart.module.css';
import { Fade } from 'components/Fade/Fade';

interface IQuickStart {
  onSetTown: (town: ITownSettings) => void;
}

interface IQuickStartState {
  town?: ITownSettings;
}

export class QuickStart extends React.PureComponent<IQuickStart, IQuickStartState> {
  public state: IQuickStartState = {};

  public render() {
    const { onSetTown } = this.props;
    const { town } = this.state;
    return (
      <main className={styles.QuickStart}>
        <Fade in={town != null}>
          <>
            <TownDescription
              className={styles.Description}
              town={town!}
            />
            <Button
              className={styles.Button}
              onClick={() => onSetTown(town!)}
            >
              Continue
            </Button>
          </>
        </Fade>
        <Fade in={town == null}>
          <>
            <div className={styles.Description}>
              Welcome to Adventure Town!

              <p>
                In many classic tabletop RPGs, you take on the role of a hero, doing daring deeds and living the high life.
                Not so here. In this event-based game, you take on the role of a citizen of a town somewhere in the land.
                You are not cut out to be a proper adventurer, though you can go on smaller adventures of your own, but most
                of your life revolves about living in the town, trying to improve your position and the position of your children,
                and living through both visiting adventurers and marauding monsters.
              </p>
              <p>
                Please note that this game contains mature themes relating to death, violence, slavery, rape, and others.
                Play it at your own risk.
              </p>
            </div>
            <Button
              className={styles.Button}
              onClick={this.generateTown}
            >
              Generate a Town
            </Button>
          </>
        </Fade>
      </main>
    );
  }

  private generateTown = () => {
    const town: ITownSettings = {
      name: this.getName(),
      size: pickOne([Size.Tiny, Size.Small, Size.Modest]),
      prosperity: pickOne([Prosperity.Poor, Prosperity.Decent, Prosperity.Average]),
      equality: pickOne([ClassEquality.GeneralSlavery, ClassEquality.IncomeInequality, ClassEquality.RacialSlavery, ClassEquality.Stratified]),
      genderEquality: pickOne([GenderEquality.FemaleDominance, GenderEquality.Equal, GenderEquality.MaleDominance]),
      fortification: pickOne([Fortification.None, Fortification.Ditch, Fortification.Palisade]),
    };

    this.setState({ town });
  }

  private getName = () => {
    const firstParts = ['Brak', 'Iron', 'Old', `Devil`, 'Salt', 'Copper', 'Turtle'];
    const secondParts = ['ville', 'town', `'s Cross`, 'sburg', ` Falls`, `'s Fall`];
    const first = pickOne(firstParts);
    const second = pickOne(secondParts);
    return `${first}${second}`;
  };
}
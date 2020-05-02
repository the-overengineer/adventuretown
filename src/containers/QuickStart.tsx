import { Button } from 'components/Button/Button';
import { TownDescription } from 'components/TownDescription/TownDescription';
import React from 'react';
import {
  Equality,
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
          <Button
            className={styles.Button}
            onClick={this.generateTown}
          >
            Generate a Town
          </Button>
        </Fade>
      </main>
    );
  }

  private generateTown = () => {
    const town: ITownSettings = {
      name: this.getName(),
      size: pickOne([Size.Tiny, Size.Small, Size.Modest]),
      prosperity: pickOne([Prosperity.Poor, Prosperity.Decent, Prosperity.Average]),
      equality: pickOne([Equality.RacialSlavery, Equality.GenderInequality, Equality.IncomeInequality]),
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
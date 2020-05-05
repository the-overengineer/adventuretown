import classNames from 'classnames';
import React from 'react';

import { IResources, ICharacter, Gender, ICharacterFinances, GameSpeed } from 'types/state';

import styles from './Header.module.css';
import { getAge } from 'utils/time';

interface IResource {
  name: string;
  icon: string;
}

const Resource: React.FC<IResource> = ({ name, icon, children }) => (
  <div className={styles.Resource}>
    <i
      className={classNames(styles.ResourceIcon, icon)}
      title={name}
    />
    <div className={styles.ResourceAmount}>
      {children}
    </div>
  </div>
)

interface IHeader {
  character: ICharacter;
  finances: ICharacterFinances;
  daysPassed: number;
  resources: IResources;
  isRunning: boolean;
  onPauseOrUnpause: () => void;
  gameSpeed?: GameSpeed;
  onSetSpeed: (speed: GameSpeed) => void;
  onReset: () => void;
}

export class Header extends React.PureComponent<IHeader> {
  public render() {
    const { daysPassed, character, resources, isRunning, onPauseOrUnpause, onReset, gameSpeed } = this.props;

    return (
      <div className={styles.Header}>
        <div className={styles.SpecialActions}>
          <div
            className={styles.SpecialAction}
            onClick={onReset}
          >
            Reset
          </div>
        </div>
        <div className={styles.Content}>
          <div className={styles.Controls}>
            <i
              className={classNames(styles.Control, 'fas fa-backward', { [styles.Disabled]: gameSpeed === GameSpeed.Slow })}
              onClick={this.onSlowDown}
            />
            <i
              className={classNames(styles.Control, isRunning ? 'fas fa-pause' : 'fas fa-play')}
              onClick={onPauseOrUnpause}
            />
            <i
              className={classNames(styles.Control, 'fas fa-forward', { [styles.Disabled]: gameSpeed === GameSpeed.Fast })}
              onClick={this.onSpeedUp}
            />
            <div className={styles.Day}>
              Day {daysPassed}
            </div>
          </div>
          <div className={styles.Resources}>
            <Resource name={`Coin / ${this.getCoinIncome()}`} icon='fas fa-coins'>{resources.coin}</Resource>
            <Resource name={`Food / ${this.getFoodIncome()}`} icon='fas fa-drumstick-bite'>{resources.food}</Resource>
            <Resource name={`Renown / ${this.getRenownIncome()}`} icon='far fa-flag'>{resources.renown}</Resource>
          </div>
          <div className={styles.Character}>
            <div className={styles.Name}>{this.showName()}</div>
            <div className={styles.Age}>{getAge(character.dayOfBirth, daysPassed)} years old</div>
            <i
              className={classNames(styles.Gender, character.gender === Gender.Female ? 'fas fa-venus' : 'fas fa-mars')}
            />
          </div>
        </div>
      </div>
    )
  }

  private onSlowDown = () => {
    const { gameSpeed , onSetSpeed } = this.props;
    if (gameSpeed == null || gameSpeed > GameSpeed.Slow) {
      onSetSpeed((gameSpeed ?? GameSpeed.Medium) - 1);
    }
  }

  private onSpeedUp = () => {
    const { gameSpeed , onSetSpeed } = this.props;
    if (gameSpeed == null || gameSpeed < GameSpeed.Fast) {
      onSetSpeed((gameSpeed ?? GameSpeed.Medium) + 1);
    }
  }

  private getCoinIncome = () =>
    this.props.finances.coinIncome - this.props.finances.coinExpenses;

  private getFoodIncome = () =>
    this.props.finances.foodIncome - this.props.finances.foodExpenses;

  private getRenownIncome = () =>
    this.props.finances.renownIncome - this.props.finances.renownExpenses;

  private showName = () => {
    const { character } = this.props;
    if (character.name.length > 20) {
      return character.name.slice(0, 18) + '...';
    }

    return character.name;
  }
}
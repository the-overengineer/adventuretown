import classNames from 'classnames';
import React from 'react';

import { Button } from 'components/Button/Button';
import { Input } from 'components/Input/Input';
import { Radio } from 'components/Input/Radio';
import { StatBlock } from 'components/StatBlock/StatBlock';
import {
  Gender,
  ICharacter,
  OneToTen,
} from 'types/state';
import { pickOne } from 'utils/random';
import styles from './CharacterCreator.module.css';

interface ICharacterCreator {
  className?: string;
  townName: string;
  onSetCharacter: (character: ICharacter) => void;
  prependMessage: (message: string) => void;
}

interface ICharacterCreatorState {
  character: Partial<ICharacter>;
}

type StatKey = 'physical' | 'intelligence' | 'education' | 'charm';

const genderOptions: Gender[] = [Gender.Female, Gender.Male];

export class CharacterCreator extends React.PureComponent<ICharacterCreator, ICharacterCreatorState> {
  public state: ICharacterCreatorState = {
    character: {
      isPregnant: false,
    },
  };

  public render() {
    const { className } = this.props;
    const { name, gender, intelligence, physical, charm, education } = this.state.character;

    return (
      <div className={classNames(styles.Creator, className)}>
        <Input
          className={styles.Input}
          name='name'
          label='Your Name'
          value={name}
          onChange={this.onChangeName}
        />
        <Radio
          className={styles.Input}
          name='gender'
          label='Your Gender'
          value={gender}
          options={genderOptions}
          onChange={this.onChangeGender}
        />
        {
          name != null && gender != null && physical != null ? (
            <div className={styles.Stats}>
              <StatBlock label='Physical' value={physical!} />
              <StatBlock label='Intelligence' value={intelligence!} />
              <StatBlock label='Education' value={education!} />
              <StatBlock label='Charm' value={charm!} />
            </div>
          ) : null
        }
        {
          name != null && gender != null ? (
            <Button
              className={styles.Button}
              wide
              onClick={this.generateStats}
            >
              { physical == null ? 'Generate Stats' : 'Regenerate Stats'}
            </Button>
          ) : null
        }
        {
          physical != null ? (
            <Button
              className={styles.Button}
              wide
              onClick={this.onSetCharacter}
            >
              Start Playing
            </Button>
          ) : null
        }
      </div>
    );
  }

  private onChangeName = (_: any, name: string) =>
    this.setState({ character: { ...this.state.character, name } });

  private onChangeGender = (_: any, gender: Gender) =>
    this.setState({ character: { ...this.state.character, gender } });

  private onSetCharacter = () => {
    const { onSetCharacter, prependMessage, townName } = this.props;
    const { character } = this.state;

    onSetCharacter(character as ICharacter)
    prependMessage(
      `${character.name!} is ready to start ${character.gender === Gender.Male ? 'his' : 'her'} adult life in the town of ${townName}!`,
    );
  }

  private generateStats = () => {
    const baseStats: Pick<ICharacter, StatKey> = {
      physical: 1 as OneToTen,
      intelligence : 1 as OneToTen,
      education: 1 as OneToTen,
      charm: 1 as OneToTen
    };

    // Add 5 to basic initial values of 1
    const options: Array<StatKey> = ['physical', 'intelligence', 'education', 'charm'];
    for (let i = 0; i < 5; i++) {
      const key = pickOne(options);
      baseStats[key] = baseStats[key] + 1 as OneToTen;
    }

    this.setState({
      character: {
        ...this.state.character,
        ...baseStats,
      }
    });
  }
}

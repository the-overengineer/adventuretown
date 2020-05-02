import classNames from 'classnames';
import { Button } from 'components/Button/Button';
import { Input } from 'components/Input/Input';
import { Radio } from 'components/Input/Radio';
import React from 'react';
import {
  Gender,
  ICharacter,
  OneToTen,
} from 'types/state';
import { pickOne } from 'utils/random';
import styles from './CharacterCreator.module.css';

interface ICharacterCreator {
  className?: string;
  onSetCharacter: (character: ICharacter) => void;
}

interface ICharacterCreatorState {
  character: Partial<ICharacter>;
}

interface IStatBlock {
  label: string;
  value: OneToTen;
}

type GenderLabel = 'Male' | 'Female';

type StatKey = 'physical' | 'intelligence' | 'education' | 'charm';

const getGender = (label: GenderLabel): Gender =>
  label === 'Male' ? Gender.Male : Gender.Female;

const getLabel = (gender: Gender): GenderLabel =>
  gender === Gender.Male ? 'Male' : 'Female';

const genderOptions: GenderLabel[] = ['Female', 'Male'];

const StatBlock: React.FC<IStatBlock> = ({ label, value }) => (
  <div className={styles.StatBlock}>
    <div className={styles.Label}>{label}</div>
    <div className={styles.Value}>{value}</div>
  </div>
);

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
          value={gender ? getLabel(gender) : undefined}
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

  private onChangeGender = (_: any, gender: GenderLabel) =>
    this.setState({ character: { ...this.state.character, gender: getGender(gender) } });

  private onSetCharacter = () =>
    this.props.onSetCharacter(this.state.character as ICharacter)

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

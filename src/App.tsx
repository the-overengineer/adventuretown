import { CharacterCreator } from 'components/CharacterCreator/CharacterCreator';
import { Fade } from 'components/Fade/Fade';
import { QuickStart } from 'containers/QuickStart';
import React from 'react';
import { processTick } from 'state';
import {
  ICharacter,
  ICharacterFlags,
  ID,
  IGameState,
  IQueuedEvent,
  IRelationships,
  IResources,
  ITownSettings,
  IUserSettings,
  IWorldFlags,
} from 'types/state';
import styles from './App.module.css';

export const TICK_DURATION: number = 10 * 1000; // 10s

interface IAppState {
  town?: ITownSettings;
  character?: ICharacter;
  settings: IUserSettings;
  resources: IResources;
  relationships: IRelationships;
  eventQueue: IQueuedEvent[];
  activeEvent?: ID;
  characterFlags: Partial<ICharacterFlags>;
  worldFlags: Partial<IWorldFlags>;
}

export class App extends React.PureComponent<{}, IAppState> {
  public state: IAppState = {
    eventQueue: [],
    resources: {
      coin: 10,
      food: 10,
      renown: 0,
    },
    relationships: {
      children: [],
    },
    settings: {
      autoSave: true,
      pauseOnEvents: true,
    },
    characterFlags: {},
    worldFlags: {},
  };

  private ticker: number | undefined;
  private tickCounter: number = 0;

  public componentDidMount() {
    // this.ticker = window.setInterval(this.handleTick, TICK_DURATION);
  }

  public componentWillUnmount() {
    if (this.ticker != null) {
      window.clearInterval(this.ticker);
    }
  }

  public render() {
    return (
      <div className={styles.App}>
        {this.renderGameScreen()}
      </div>
    )
  }

  private renderGameScreen = () => {
    const { character, town } = this.state;

    return (
      <>
        <Fade in={town == null}>
          <QuickStart onSetTown={this.onSetTown} />
        </Fade>
        <Fade in={town != null && character == null}>
          <CharacterCreator onSetCharacter={this.onSetCharacter} />
        </Fade>
        <Fade in={town != null && character != null}>
          <span />
        </Fade>
      </>
    );
  }

  private onSetTown = (town: ITownSettings) =>
    this.setState({ town });

  private onSetCharacter = (character: ICharacter) =>
    this.setState({ character });

  private handleTick = () => {
    if (this.state.town != null && this.state.character == null) {
      this.tickCounter++;
      const updatedState = processTick(this.state as IGameState, this.tickCounter);
      this.setState({
        ...updatedState,
      });
    }
  }
}

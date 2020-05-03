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
  ICharacterFinances,
  IEvent,
} from 'types/state';
import styles from './App.module.css';
import { GameScreen } from 'components/GameScreen/GameScreen';
import { prependMessage } from 'utils/message';
import { events, eventMap } from './events';
import { IEventVM } from 'components/Event/Event';

export const TICK_DURATION: number = 5 * 1000; // 5s

interface IAppState {
  town?: ITownSettings;
  character?: ICharacter;
  finances: ICharacterFinances;
  settings: IUserSettings;
  resources: IResources;
  relationships: IRelationships;
  eventQueue: IQueuedEvent[];
  activeEvent?: ID;
  characterFlags: Partial<ICharacterFlags>;
  worldFlags: Partial<IWorldFlags>;
  isRunning: boolean;
  daysPassed: number;
  messages: string[];
}

export class App extends React.PureComponent<{}, IAppState> {
  public state: IAppState = {
    eventQueue: [],
    resources: {
      coin: 10,
      food: 10,
      renown: 0,
    },
    finances: {
      coinIncome: 0,
      coinExpenses: 0,
      foodExpenses: 0,
      foodIncome: 0,
      renownExpenses: 0,
      renownIncome: 0
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
    isRunning: false,
    daysPassed: 0,
    messages: [],
  };

  private ticker: number | undefined;

  public componentDidMount() {
    this.ticker = window.setInterval(this.handleTick, TICK_DURATION);
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
    const {
      character,
      town,
      finances,
      daysPassed,
      isRunning,
      resources,
      relationships,
      messages,
    } = this.state;

    return (
      <>
        <Fade in={town == null}>
          <QuickStart onSetTown={this.onSetTown} />
        </Fade>
        <Fade in={town != null && character == null}>
          <CharacterCreator
            townName={town?.name ?? 'Your town'}
            onSetCharacter={this.onSetCharacter}
            prependMessage={this.prependMessage}
          />
        </Fade>
        <Fade in={town != null && character != null}>
          <GameScreen
            daysPassed={daysPassed}
            event={this.getEventVM()}
            isRunning={isRunning}
            character={character!}
            finances={finances}
            town={town!}
            resources={resources}
            relationships={relationships}
            messages={messages}
            manuallyTriggerEvent={this.manuallyTriggerEvent}
            onPauseOrUnpause={this.onPauseOrUnpause}
          />
        </Fade>
      </>
    );
  }

  private manuallyTriggerEvent = (id: ID) => {
    const { activeEvent } = this.state;
    if (activeEvent != null) {
      console.warn('Event already active');
      return;
    }

    const event = events.find((it: IEvent) => it.id === id);
    if (event != null) {
      this.setState({ activeEvent: id });
    } else {
      console.warn('No such event found');
    }
  }

  private onPauseOrUnpause = () =>
    this.setState({ isRunning: !this.state.isRunning })

  private onSetTown = (town: ITownSettings) =>
    this.setState({ town });

  private onSetCharacter = (character: ICharacter) =>
    this.setState({ character });

  private prependMessage = (message: string) =>
    this.setState({ messages: prependMessage(this.state.messages, message )})

  private handleTick = () => {
    if (this.state.town != null && this.state.character != null && this.state.isRunning) {
      try {
        this.setState(processTick(this.state as IGameState));
      } catch (error) {
        console.warn('Failed to process a day');
        console.error(error);
      }
    }
  }

  private getEventVM = (): IEventVM | undefined => {
    if (this.state.activeEvent == null) {
      return;
    }

    const event = eventMap[this.state.activeEvent];

    if (event == null) {
      console.warn('Event activated but could not be found');
      this.setState({ activeEvent: undefined });
      return;
    }

    return {
      title: event.title,
      text: event.getText(this.state as IGameState),
      actions: event.actions.map((action) => ({
        disabled: action.condition != null && !action.condition(this.state as IGameState),
        text: action.text,
        onClick: () => {
          const updatedState = action.perform
            ? action.perform(this.state as IGameState)
            : this.state;
          this.setState({
            ...updatedState,
            isRunning: this.state.isRunning,
            activeEvent: undefined,
          });
        },
      })),
    }
  }
}

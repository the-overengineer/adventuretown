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
  getTickDuration,
  GameSpeed,
  Taxation,
} from 'types/state';
import styles from './App.module.css';
import { GameScreen } from 'components/GameScreen/GameScreen';
import { prependMessage } from 'utils/message';
import { events, eventMap } from './gameEvents';
import { IEventVM } from 'components/Event/Event';
import { hasSavedGame, loadGame, saveGame } from 'utils/storage';

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

const initialState: IAppState = {
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

export class App extends React.PureComponent<{}, IAppState> {
  public state: IAppState = initialState;

  private ticker: number | undefined;

  public componentDidMount() {
    if (hasSavedGame()) {
      const game = loadGame();
      this.setState({
        ...game,
        town: game.town ? {
          ...game.town,
          taxation: game.town.taxation ?? Taxation.None, // Temporary compat layer TODO: Remove
        } : undefined,
      });
    }
    this.ticker = window.setInterval(this.handleTick, getTickDuration(this.state.settings.speed));

    // (window as any)._events = events;
    // (window as any)._trigger = this.triggerEvent;
  }

  public componentDidUpdate(_: any, prevState: IAppState) {
    if (prevState.settings.speed !== this.state.settings.speed) {
      window.clearInterval(this.ticker);
      this.ticker = window.setInterval(this.handleTick, getTickDuration(this.state.settings.speed));
    }
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
      characterFlags,
      town,
      finances,
      daysPassed,
      isRunning,
      resources,
      relationships,
      messages,
      settings,
    } = this.state;

    return (
      <>
        <Fade in={town == null}>
          <QuickStart onSetTown={this.onSetTown} />
        </Fade>
        <Fade in={town != null && character == null}>
          <CharacterCreator
            townName={town?.name ?? 'Your town'}
            currentDay={daysPassed}
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
            characterFlags={characterFlags}
            finances={finances}
            town={town!}
            resources={resources}
            relationships={relationships}
            messages={messages}
            gameSpeed={settings.speed}
            onSetSpeed={this.onSetSpeed}
            manuallyTriggerEvent={this.manuallyTriggerEvent}
            onPauseOrUnpause={this.onPauseOrUnpause}
            onReset={this.onReset}
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

  private onReset = () => {
    const state = { ...initialState, town: undefined, character: undefined };
    this.setState(state);
    saveGame(state as unknown as IGameState);
  }

  private onPauseOrUnpause = () =>
    this.setState({ isRunning: !this.state.isRunning })

  private onSetSpeed = (speed: GameSpeed) =>
    this.setState({
      settings: { ...this.state.settings, speed },
    });

  private onSetTown = (town: ITownSettings) =>
    this.setState({ town });

  private onSetCharacter = (character: ICharacter) =>
    this.setState({ character, isRunning: true });

  private prependMessage = (message: string) =>
    this.setState({ messages: prependMessage(this.state.messages, message )});

  protected triggerEvent = (eventID: ID) =>
    this.setState({ activeEvent: eventID });

  private handleTick = () => {
    if (this.state.town != null && this.state.character != null && this.state.isRunning) {
      if (this.state.settings.pauseOnEvents && this.state.activeEvent != null) {
        return;
      }

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

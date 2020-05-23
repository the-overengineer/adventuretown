import classNames from 'classnames';
import React from 'react';
import {
  ID,
  ICharacter,
  IRelationships,
  IResources,
  ITownSettings,
  ICharacterFinances,
  GameSpeed,
  ICharacterFlags,
  IWorldFlags,
} from 'types/state';
import styles from './GameScreen.module.css';
import { Header } from 'components/Header/Header';
import { StatBlock } from 'components/StatBlock/StatBlock';
import { describeJob } from 'utils/employment';
import { Person } from 'components/Person/Person';
import { TownDescription } from 'components/TownDescription/TownDescription';
import { Button } from 'components/Button/Button';
import { IEventVM, Event as EventPopup } from 'components/Event/Event';
import { chooseFocus } from 'gameEvents/focus/focus';
import { goOnAdventure } from 'gameEvents/adventure/adventure';
import { changeCurrentJob, seekJob } from 'gameEvents/job/general';

const asciiTown: string = `
~         ~~          __
     _T      .,,.    ~--~ ^^
^^   // \\                    ~
     ][O]    ^^      ,-~ ~
 /''-I_I         _II____
__/_  /   \\ ______/ ''   /'\\_,__
| II--'''' \\,--:--..,_/,.-{ },
; '/__\\,.--';|   |[] .-.| O{ _ }
:' |  | []  -|   ''--:.;[,.'\\,/
'  |[]|,.--'' '',   ''-,.    |
..    ..-''    ;       ''. '`

interface IGameScreen {
  className?: string;
  event?: IEventVM;
  daysPassed: number;
  town: ITownSettings;
  resources: IResources;
  character: ICharacter;
  characterFlags: ICharacterFlags;
  worldFlags: IWorldFlags;
  finances: ICharacterFinances;
  relationships: IRelationships;
  messages: string[];
  isRunning: boolean;
  gameSpeed?: GameSpeed;
  onSetSpeed: (speed: GameSpeed) => void;
  manuallyTriggerEvent: (id: ID) => void;
  onPauseOrUnpause: () => void;
  onReset: () => void;
}

export class GameScreen extends React.PureComponent<IGameScreen> {
  public render() {
    const {
      className,
      event,
      daysPassed,
      town,
      messages,
      resources,
      character,
      worldFlags,
      finances,
      relationships,
      isRunning,
      gameSpeed,
      onSetSpeed,
      onPauseOrUnpause,
      onReset,
      manuallyTriggerEvent,
    } = this.props;

    return (
      <div className={classNames(styles.Game, className)}>
        <Header
          daysPassed={daysPassed}
          character={character}
          resources={resources}
          finances={finances}
          isRunning={isRunning}
          gameSpeed={gameSpeed}
          onPauseOrUnpause={onPauseOrUnpause}
          onReset={onReset}
          onSetSpeed={onSetSpeed}
        />
        <main className={styles.Mat}>
          { event != null ? <EventPopup event={event} /> : null }
          <div className={styles.Screen}>
            {
              !isRunning ? (
                <div className={styles.PauseOverlay}>
                  Paused
                </div>
              ) : null
            }
            <div className={styles.TownAscii}>
              {asciiTown}
            </div>
            <TownDescription
              className={styles.TownDescription}
              town={town}
              townFlags={worldFlags}
              detailed
            />
            <div className={styles.Actions}>
              <Button
                className={styles.Action}
                onClick={() => manuallyTriggerEvent(chooseFocus.id)}
              >
                Change Focus
              </Button>
              <Button
                disabled
                className={styles.Action}
                onClick={() => manuallyTriggerEvent(goOnAdventure.id)}
              >
                Venture Outside
              </Button>
              <Button
                className={styles.Action}
                onClick={() => manuallyTriggerEvent(character.profession != null ? changeCurrentJob.id : seekJob.id)}
              >
                { character.profession != null ? 'Change Job' : 'Find Job' }
              </Button>
            </div>
          </div>
          <div className={styles.Sidebar}>
            <Stats title='Attributes'>
              <StatBlock label='Physical' value={character.physical} />
              <StatBlock label='Intelligence' value={character.intelligence} />
              <StatBlock label='Education' value={character.education} />
              <StatBlock label='Charm' value={character.charm} />
            </Stats>
            <Stats title='Status'>
              <StatBlock label='Job' value={describeJob(character)} />
              <StatBlock label='Focus' value={this.getFocus()} />
              <StatBlock label='Spouse' value={relationships.spouse ? <Person person={relationships.spouse} today={daysPassed} /> : 'Unmarried'} />
              {
                relationships.children.map((child, index) => (
                  <StatBlock
                    key={index}
                    label='Child'
                    value={<Person person={child} today={daysPassed} />}
                  />
                ))
              }
            </Stats>
          </div>
        </main>
        <div className={styles.ChatLog}>
          {
            messages.map((message, index) => (
              <div key={`${message}-${index}`} className={styles.Message}>{message}</div>
            ))
          }
        </div>
      </div>
    );
  }

  private getFocus = (): string => {
    const { characterFlags } = this.props;

    if (characterFlags.focusCharm!) {
      return 'Charm';
    } else if (characterFlags.focusCity!) {
      return 'Town';
    } else if (characterFlags.focusEducation!) {
      return 'Education';
    } else if (characterFlags.focusFamily!) {
      return 'Family';
    } else if (characterFlags.focusFood!) {
      return 'Food';
    } else if (characterFlags.focusFun!) {
      return 'Fun';
    } else if (characterFlags.focusIntelligence!) {
      return 'Intelligence';
    } else if (characterFlags.focusPhysical!) {
      return 'Physical';
    } else if (characterFlags.focusRenown!) {
      return 'Renown';
    } else if (characterFlags.focusWealth!) {
      return 'Wealth';
    } else {
      return 'None';
    }
  }
}

interface IStats {
  title: string;
}

const Stats: React.FC<IStats> = ({ children, title }) => (
  <div className={styles.Stats}>
    <div className={styles.Title}>{title}</div>
    {children}
  </div>
)
import classNames from 'classnames';
import React from 'react';
import {
  ID,
  ICharacter,
  IRelationships,
  IResources,
  ITownSettings,
  ICharacterFinances,
} from 'types/state';
import styles from './GameScreen.module.css';
import { Header } from 'components/Header/Header';
import { StatBlock } from 'components/StatBlock/StatBlock';
import { describeJob } from 'utils/employment';
import { Person } from 'components/Person/Person';
import { TownDescription } from 'components/TownDescription/TownDescription';
import { Button } from 'components/Button/Button';
import { IEventVM, Event as EventPopup } from 'components/Event/Event';
import { Fade } from 'components/Fade/Fade';
import { chooseFocus } from 'events/focus/focus';
import { goOnAdventure } from 'events/adventure/adventure';
import { changeCurrentJob, seekJob } from 'events/job/general';

interface IGameScreen {
  className?: string;
  event?: IEventVM;
  daysPassed: number;
  town: ITownSettings;
  resources: IResources;
  character: ICharacter;
  finances: ICharacterFinances;
  relationships: IRelationships;
  messages: string[];
  isRunning: boolean;
  manuallyTriggerEvent: (id: ID) => void;
  onPauseOrUnpause: () => void;
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
      finances,
      relationships,
      isRunning,
      onPauseOrUnpause,
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
          onPauseOrUnpause={onPauseOrUnpause}
        />
        <main className={styles.Mat}>
          <Fade in={event != null}>
            <EventPopup event={event} />
          </Fade>
          <div className={styles.Screen}>
            <div className={styles.TownAscii}>
              {/* TODO Actual ASCII art of the town */}
              {
                `.................
                ......@@@........
                ....^^^@@^.......
                ....;;.;.,,,......`
              }
            </div>
            <TownDescription town={town} />
            <div className={styles.Actions}>
              <Button
                className={styles.Action}
                onClick={() => manuallyTriggerEvent(chooseFocus.id)}
              >
                Change Focus
              </Button>
              <Button
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
              {
                character.isPregnant ? (
                  <StatBlock label='Pregnant' value='Yes' />
                ) : null
              }
              <StatBlock label='Spouse' value={relationships.spouse ? <Person person={relationships.spouse} /> : 'Unmarried'} />
              <StatBlock label='Lover' value={relationships.lover ? <Person person={relationships.lover} /> : 'None'} />
              {
                relationships.children.map((child, index) => (
                  <StatBlock
                    label='Child'
                    value={<Person person={child} />}
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
}

interface IStats {
  title: string;
}

const Stats: React.FC<IStats> = ({ children, title }) => (
  <div className={styles.Stats}>
    <div className={styles.Title}>Attributes</div>
    {children}
  </div>
)
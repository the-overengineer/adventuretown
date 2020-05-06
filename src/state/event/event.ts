import {
  events,
  eventMap,
} from 'gameEvents';
import {
  IGameState,
  IQueuedEvent,
} from 'types/state';
import { inIntRange } from 'utils/random';

export const fuzzyUpMtth = (mtth: number): number => {
  if (mtth === 0) {
    return 0;
  }

  const fuzzUp = Math.min(1, Math.round(mtth / 10));

  return Math.max(1, mtth + inIntRange(-fuzzUp, fuzzUp));
};

// Factor which determines the frequency at which an event is checked depending on its MTTH
const CHECK_HOW_OFTEN_FACTOR: number = 0.1;

export const updateEventQueue = (state: IGameState): IGameState => {
  const validEvents = state.eventQueue.filter((eq) => {
    if (eq.meanTimeToHappen === 0) {
      return true; // This event is inserted in and not processed manually
    }

    const event = eventMap[eq.id];
    if (event == null) {
      return false;
    }

    return event.condition(state);
  })

  const existingIDs = new Set(validEvents.map((it) => it.id));

  const eventCandidates = events
  .filter((event) => !existingIDs.has(event.id) && event.condition(state))
  .map((event): IQueuedEvent => ({
    id: event.id,
    meanTimeToHappen: fuzzyUpMtth(event.meanTimeToHappen),
    queuedAtDay: state.daysPassed,
  }));

  return {
    ...state,
    eventQueue: [...validEvents, ...eventCandidates],
  };
};

export const updateActiveEvent = (state: IGameState): IGameState => {
  if (state.activeEvent != null) {
    return state;
  }

  for (const event of state.eventQueue) {
    const daysSince = state.daysPassed - event.queuedAtDay;
    const chanceToHappen = event.meanTimeToHappen === 0
      ? 1
      : (1 - Math.pow(2, -1 * (state.daysPassed - event.queuedAtDay) / event.meanTimeToHappen));

    const checkHowOften = event.meanTimeToHappen <= 30
      ? Math.max(1, Math.floor(event.meanTimeToHappen / 2))
      : Math.max(1, Math.round(CHECK_HOW_OFTEN_FACTOR * event.meanTimeToHappen));

    if (event.meanTimeToHappen === 0 || (daysSince % checkHowOften === 0 && Math.random() <= chanceToHappen)) {
      return {
        ...state,
        eventQueue: state.eventQueue.filter((it) => it.id !== event.id),
        activeEvent: event.id,
      };
    }
  }

  return state;
}
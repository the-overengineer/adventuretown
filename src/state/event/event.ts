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

  const fuzzUp = Math.min(1, Math.round(mtth / 25));

  return Math.max(1, mtth + inIntRange(-fuzzUp, fuzzUp));
};

// Factor which determines the frequency at which an event is checked depending on its MTTH
const CHECK_HOW_OFTEN_FACTOR: number = 0.1;

export const updateEventQueue = (state: IGameState): IGameState => {
  const validEvents = state.eventQueue.filter((eq) => {
    if (eq.meanTimeToHappen == null && eq.fixedTimeToHappen == null) {
      return true; // This event is inserted in and not processed manually
    }
    if (eq.triggered!) {
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
      meanTimeToHappen: event.meanTimeToHappen != null ? fuzzyUpMtth(event.meanTimeToHappen!(state)) : undefined,
      fixedTimeToHappen: event.fixedTimeToHappen != null ? event.fixedTimeToHappen(state) : undefined,
      queuedAtDay: state.daysPassed,
      background: event.background,
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

    const getUpdatedQueue = () => {
      if (event.background!) {
        const actualEvent = eventMap[event.id];
        const action = actualEvent.actions[0];
        if (action && (action.condition == null || action.condition(state))) {
          return action.perform!({
            ...state,
            eventQueue: state.eventQueue.filter((it) => it.id !== event.id),
          });
        } else {
          return {
            ...state,
            eventQueue: state.eventQueue.filter((it) => it.id !== event.id),
          };
        }
      }

      return {
        ...state,
        eventQueue: state.eventQueue.filter((it) => it.id !== event.id),
        activeEvent: event.id
      }
    };

    if (event.meanTimeToHappen == null && event.fixedTimeToHappen == null) {
      return getUpdatedQueue();
    }

    if (event.fixedTimeToHappen != null) {
      if (event.fixedTimeToHappen <= daysSince) {
        return getUpdatedQueue();
      }
    }

    if (event.meanTimeToHappen != null) {
      const chanceToHappen = event.meanTimeToHappen === 0
        ? 1
        : (1 - Math.pow(2, -1 * (state.daysPassed - event.queuedAtDay) / event.meanTimeToHappen!));

      const checkHowOften = event.meanTimeToHappen! <= 30
        ? Math.max(1, Math.floor(event.meanTimeToHappen! / 2))
        : Math.max(1, Math.round(CHECK_HOW_OFTEN_FACTOR * event.meanTimeToHappen!));

      if (event.meanTimeToHappen === 0 || (daysSince % checkHowOften === 0 && Math.random() <= chanceToHappen)) {
        return getUpdatedQueue();
      }
    }
  }

  return state;
}

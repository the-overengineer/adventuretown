import {
  events,
  eventMap,
} from 'gameEvents';
import {
  IGameState,
  IQueuedEvent,
} from 'types/state';

// Unless special events, check only every N days
const CHECK_HOW_OFTEN: number = 10;

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
    meanTimeToHappen: event.meanTimeToHappen,
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

    if (event.meanTimeToHappen === 0 || (daysSince % CHECK_HOW_OFTEN === 0 && Math.random() <= chanceToHappen)) {
      return {
        ...state,
        eventQueue: state.eventQueue.filter((it) => it.id !== event.id),
        activeEvent: event.id,
      };
    }
  }

  return state;
}